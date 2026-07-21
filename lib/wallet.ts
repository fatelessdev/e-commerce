import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  walletAccounts,
  walletLedgerEntries,
  walletReservations,
  walletTopUps,
} from "@/lib/db/schema";

export const WALLET_LIMITS = {
  minTopUpPaise: 1_000,
  maxTopUpPaise: 200_000,
  maxBalancePaise: 500_000,
  maxDailyFundingPaise: 500_000,
  tryOnCostPaise: 700,
  reservationMinutes: 15,
} as const;

type WalletTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type LedgerType = "top_up" | "order_payment" | "generation" | "refund" | "reversal";

export function rupeesToPaise(value: number) {
  if (!Number.isFinite(value) || value < 0) throw new Error("Invalid money amount");
  return Math.round(value * 100);
}

export function paiseToRupees(value: number) {
  return value / 100;
}

export function assertTopUpAmount(amountPaise: number) {
  if (!Number.isInteger(amountPaise) || amountPaise < WALLET_LIMITS.minTopUpPaise || amountPaise > WALLET_LIMITS.maxTopUpPaise) {
    throw new Error("Wallet top-ups must be between ₹10 and ₹2,000.");
  }
}

async function ensureWallet(tx: WalletTx, userId: string) {
  await tx.insert(walletAccounts).values({ userId }).onConflictDoNothing();
  const [wallet] = await tx.select().from(walletAccounts).where(eq(walletAccounts.userId, userId)).limit(1);
  if (!wallet) throw new Error("Could not initialize wallet");
  return wallet;
}

async function writeLedger(tx: WalletTx, input: {
  walletAccountId: string;
  type: LedgerType;
  amountPaise: number;
  balanceAfterPaise: number;
  referenceType: string;
  referenceId: string;
  note?: string;
}) {
  await tx.insert(walletLedgerEntries).values(input).onConflictDoNothing();
}

export async function getWalletForUser(userId: string) {
  const [wallet] = await db.select().from(walletAccounts).where(eq(walletAccounts.userId, userId)).limit(1);
  if (!wallet) return { availablePaise: 0, heldPaise: 0, isFrozen: false, freezeReason: null, entries: [] as never[] };
  const entries = await db.select().from(walletLedgerEntries)
    .where(eq(walletLedgerEntries.walletAccountId, wallet.id))
    .orderBy(desc(walletLedgerEntries.createdAt)).limit(50);
  return { ...wallet, entries };
}

export async function reserveWalletFunds(input: { userId: string; amountPaise: number; referenceType: string; referenceId: string }) {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 0) throw new Error("Invalid wallet amount");
  if (input.amountPaise === 0) return null;
  return db.transaction(async (tx) => {
    const wallet = await ensureWallet(tx, input.userId);
    const [existing] = await tx.select().from(walletReservations)
      .where(and(eq(walletReservations.referenceType, input.referenceType), eq(walletReservations.referenceId, input.referenceId))).limit(1);
    if (existing) return existing;
    const [updated] = await tx.update(walletAccounts).set({
      availablePaise: sql`${walletAccounts.availablePaise} - ${input.amountPaise}`,
      heldPaise: sql`${walletAccounts.heldPaise} + ${input.amountPaise}`,
      updatedAt: new Date(),
    }).where(and(eq(walletAccounts.id, wallet.id), eq(walletAccounts.isFrozen, false), sql`${walletAccounts.availablePaise} >= ${input.amountPaise}`)).returning();
    if (!updated) throw new Error("Insufficient available wallet balance.");
    const [reservation] = await tx.insert(walletReservations).values({
      walletAccountId: wallet.id, amountPaise: input.amountPaise, referenceType: input.referenceType, referenceId: input.referenceId,
      expiresAt: new Date(Date.now() + WALLET_LIMITS.reservationMinutes * 60_000),
    }).returning();
    return reservation;
  });
}

export async function releaseWalletReservation(referenceType: string, referenceId: string) {
  return db.transaction(async (tx) => {
    const [reservation] = await tx.select().from(walletReservations)
      .where(and(eq(walletReservations.referenceType, referenceType), eq(walletReservations.referenceId, referenceId))).limit(1);
    if (!reservation || reservation.status !== "held") return false;
    const released = await tx.update(walletReservations).set({ status: "released", updatedAt: new Date() })
      .where(and(eq(walletReservations.id, reservation.id), eq(walletReservations.status, "held"))).returning();
    if (!released.length) return false;
    await tx.update(walletAccounts).set({
      availablePaise: sql`${walletAccounts.availablePaise} + ${reservation.amountPaise}`,
      heldPaise: sql`${walletAccounts.heldPaise} - ${reservation.amountPaise}`,
      updatedAt: new Date(),
    }).where(eq(walletAccounts.id, reservation.walletAccountId));
    return true;
  });
}

export async function consumeWalletReservation(tx: WalletTx, input: { referenceType: string; referenceId: string; ledgerType: "order_payment" | "generation"; note: string }) {
  const [reservation] = await tx.select().from(walletReservations)
    .where(and(eq(walletReservations.referenceType, input.referenceType), eq(walletReservations.referenceId, input.referenceId))).limit(1);
  if (!reservation || reservation.status !== "held" || reservation.expiresAt < new Date()) throw new Error("Wallet reservation is no longer available.");
  const [updatedReservation] = await tx.update(walletReservations).set({ status: "consumed", updatedAt: new Date() })
    .where(and(eq(walletReservations.id, reservation.id), eq(walletReservations.status, "held"))).returning();
  if (!updatedReservation) throw new Error("Wallet reservation is no longer available.");
  const [wallet] = await tx.update(walletAccounts).set({ heldPaise: sql`${walletAccounts.heldPaise} - ${reservation.amountPaise}`, updatedAt: new Date() })
    .where(and(eq(walletAccounts.id, reservation.walletAccountId), sql`${walletAccounts.heldPaise} >= ${reservation.amountPaise}`)).returning();
  if (!wallet) throw new Error("Wallet balance reconciliation failed.");
  await writeLedger(tx, { walletAccountId: wallet.id, type: input.ledgerType, amountPaise: -reservation.amountPaise, balanceAfterPaise: wallet.availablePaise, referenceType: input.referenceType, referenceId: input.referenceId, note: input.note });
  return wallet;
}

export async function creditWallet(tx: WalletTx, input: { userId: string; amountPaise: number; type: "top_up" | "refund" | "reversal"; referenceType: string; referenceId: string; note: string }) {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise <= 0) throw new Error("Invalid wallet credit");
  const wallet = await ensureWallet(tx, input.userId);
  const [existing] = await tx.select({ id: walletLedgerEntries.id }).from(walletLedgerEntries)
    .where(and(eq(walletLedgerEntries.referenceType, input.referenceType), eq(walletLedgerEntries.referenceId, input.referenceId))).limit(1);
  if (existing) return { alreadyCredited: true, wallet };
  const [updated] = await tx.update(walletAccounts).set({ availablePaise: sql`${walletAccounts.availablePaise} + ${input.amountPaise}`, updatedAt: new Date() })
    .where(and(eq(walletAccounts.id, wallet.id), eq(walletAccounts.isFrozen, false), sql`${walletAccounts.availablePaise} + ${input.amountPaise} <= ${WALLET_LIMITS.maxBalancePaise}`)).returning();
  if (!updated) throw new Error("Wallet credit would exceed the balance limit or the wallet is frozen.");
  await writeLedger(tx, { walletAccountId: updated.id, type: input.type, amountPaise: input.amountPaise, balanceAfterPaise: updated.availablePaise, referenceType: input.referenceType, referenceId: input.referenceId, note: input.note });
  return { alreadyCredited: false, wallet: updated };
}

export async function assertDailyFundingCapacity(userId: string, amountPaise: number) {
  const since = new Date(); since.setHours(0, 0, 0, 0);
  const [row] = await db.select({ total: sql<number>`COALESCE(SUM(${walletTopUps.amountPaise}), 0)` }).from(walletTopUps)
    .where(and(eq(walletTopUps.userId, userId), eq(walletTopUps.status, "paid"), gte(walletTopUps.settledAt, since)));
  if (Number(row?.total ?? 0) + amountPaise > WALLET_LIMITS.maxDailyFundingPaise) throw new Error("Daily wallet funding limit reached.");
}

export async function debitWalletForGeneration(userId: string, referenceId: string) {
  await reserveWalletFunds({ userId, amountPaise: WALLET_LIMITS.tryOnCostPaise, referenceType: "try_on_generation", referenceId });
  return db.transaction((tx) => consumeWalletReservation(tx, { referenceType: "try_on_generation", referenceId, ledgerType: "generation", note: "XILAR virtual try-on" }));
}

export async function reverseGenerationCharge(userId: string, referenceId: string) {
  return db.transaction((tx) => creditWallet(tx, { userId, amountPaise: WALLET_LIMITS.tryOnCostPaise, type: "reversal", referenceType: "try_on_generation_reversal", referenceId, note: "Try-on generation reversal" }));
}
