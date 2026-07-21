"use server";

import { and, desc, eq } from "drizzle-orm";
import { db, productTryOnRuns } from "@/lib/db";
import type { TryOnBodyMode } from "@/lib/try-on";
import { getAuthenticatedImageUrl } from "@/lib/cloudinary";

export type ProductTryOnRun = {
  id: string;
  productId: string;
  userId: string;
  bodyImageUrl: string;
  outputImageUrl: string;
  productImageUrl: string;
  productImageIndex: number;
  tryOnMode: TryOnBodyMode;
  modelId: string;
  promptVersion: string;
  createdAt: string;
};

function serializeTryOnRun(row: typeof productTryOnRuns.$inferSelect): ProductTryOnRun {
  return {
    id: row.id,
    productId: row.productId,
    userId: row.userId,
    bodyImageUrl: getAuthenticatedImageUrl(row.bodyImagePublicId),
    outputImageUrl: getAuthenticatedImageUrl(row.outputImagePublicId),
    productImageUrl: row.productImageUrl,
    productImageIndex: row.productImageIndex,
    tryOnMode: row.tryOnMode,
    modelId: row.modelId,
    promptVersion: row.promptVersion,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listProductTryOnRuns(productId: string, userId: string) {
  const rows = await db
    .select()
    .from(productTryOnRuns)
    .where(and(eq(productTryOnRuns.productId, productId), eq(productTryOnRuns.userId, userId)))
    .orderBy(desc(productTryOnRuns.createdAt))
    .limit(20);

  return rows.map(serializeTryOnRun);
}

export async function createProductTryOnRun(input: {
  productId: string;
  userId: string;
  bodyImageUrl: string;
  bodyImagePublicId: string;
  outputImageUrl: string;
  outputImagePublicId: string;
  productImageUrl: string;
  productImageIndex: number;
  tryOnMode: TryOnBodyMode;
  modelId: string;
  promptVersion: string;
}) {
  const [row] = await db
    .insert(productTryOnRuns)
    .values(input)
    .returning();

  return serializeTryOnRun(row);
}

export async function getOwnedProductTryOnRun(input: {
  productId: string;
  runId: string;
  userId: string;
}) {
  const [row] = await db
    .select()
    .from(productTryOnRuns)
    .where(
      and(
        eq(productTryOnRuns.id, input.runId),
        eq(productTryOnRuns.productId, input.productId),
        eq(productTryOnRuns.userId, input.userId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function deleteOwnedProductTryOnRun(input: {
  productId: string;
  runId: string;
  userId: string;
}) {
  const deleted = await db
    .delete(productTryOnRuns)
    .where(
      and(
        eq(productTryOnRuns.id, input.runId),
        eq(productTryOnRuns.productId, input.productId),
        eq(productTryOnRuns.userId, input.userId),
      ),
    )
    .returning({ id: productTryOnRuns.id });

  return deleted.length > 0;
}
