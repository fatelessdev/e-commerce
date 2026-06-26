"use server";

import { db } from "@/lib/db";
import {
  marketingCampaignRecipients,
  marketingCampaigns,
  marketingEmailSuppressions,
  orders,
  products,
  user,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-server";
import { sendMarketingEmailBatch } from "@/lib/email";
import { normalizeProductImage } from "@/lib/image";
import {
  filterMarketingRecipients,
  normalizeMarketingEmail,
  type MarketingCandidate,
} from "@/lib/marketing/audience";
import { buildCampaignEmailHtml } from "@/lib/marketing/email-template";
import {
  chunkForResend,
  MARKETING_FINAL_SEND_LIMIT,
  RECENT_BUYER_DAYS,
  validateCampaignDraft,
  type CampaignAudience,
  type CampaignDraftInput,
  type CampaignProduct,
  type CampaignRecipient,
} from "@/lib/marketing/types";
import { verifyUnsubscribeToken } from "@/lib/marketing/unsubscribe-token";
import { and, desc, eq, gte, gt, inArray, isNotNull, sql } from "drizzle-orm";

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function absoluteImageUrl(image: string | null, appUrl: string) {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return new URL(image, appUrl).toString();
}

async function getSuppressedEmailSet() {
  const rows = await db
    .select({ email: marketingEmailSuppressions.email })
    .from(marketingEmailSuppressions);

  return new Set(rows.map((row) => normalizeMarketingEmail(row.email)));
}

async function selectMarketingCandidates(audience: CampaignAudience): Promise<MarketingCandidate[]> {
  const baseColumns = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    banned: user.banned,
  };

  switch (audience.type) {
    case "selected":
      if (audience.userIds.length === 0) return [];
      return db.select(baseColumns).from(user).where(inArray(user.id, audience.userIds));

    case "buyers":
      return db.select(baseColumns).from(user).where(gt(user.ordersCount, 0));

    case "nonBuyers":
      return db.select(baseColumns).from(user).where(eq(user.ordersCount, 0));

    case "recentBuyers": {
      const days = audience.days ?? RECENT_BUYER_DAYS;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const rows = await db
        .select({ userId: orders.userId })
        .from(orders)
        .where(and(gte(orders.createdAt, cutoff), isNotNull(orders.userId)));
      const userIds = Array.from(new Set(rows.map((row) => row.userId).filter(Boolean))) as string[];
      if (userIds.length === 0) return [];
      return db.select(baseColumns).from(user).where(inArray(user.id, userIds));
    }

    case "highSpenders":
      return db
        .select(baseColumns)
        .from(user)
        .where(gte(user.totalSpent, String(audience.minimumSpend ?? 3000)));

    case "all":
      return db.select(baseColumns).from(user);
  }
}

async function resolveCampaignRecipients(audience: CampaignAudience) {
  const [candidates, suppressedEmails] = await Promise.all([
    selectMarketingCandidates(audience),
    getSuppressedEmailSet(),
  ]);

  return filterMarketingRecipients(candidates, suppressedEmails);
}

async function getCampaignProducts(productIds: string[]) {
  if (productIds.length === 0) return [];
  const appUrl = getAppUrl();
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      images: products.images,
      sellingPrice: products.sellingPrice,
      mrp: products.mrp,
    })
    .from(products)
    .where(inArray(products.id, productIds));

  const byId = new Map(rows.map((row) => [row.id, row]));

  return productIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((product) => {
      const image = normalizeProductImage(product!.images?.[0]);
      return {
        id: product!.id,
        slug: product!.slug,
        name: product!.name,
        image: absoluteImageUrl(image, appUrl),
        sellingPrice: product!.sellingPrice,
        mrp: product!.mrp,
      } satisfies CampaignProduct;
    });
}

function buildMessages(
  draft: CampaignDraftInput,
  recipients: CampaignRecipient[],
  campaignProducts: CampaignProduct[]
) {
  const appUrl = getAppUrl();
  return recipients.map((recipient) => ({
    to: recipient.email,
    subject: draft.subject,
    previewText: draft.previewText,
    html: buildCampaignEmailHtml({
      draft,
      recipient,
      products: campaignProducts,
      appUrl,
    }),
  }));
}

export async function getMarketingCustomerOptions() {
  await requireAdmin();

  const conditions = [eq(user.role, "user"), sql`coalesce(${user.banned}, false) = false`];

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      ordersCount: user.ordersCount,
      totalSpent: user.totalSpent,
    })
    .from(user)
    .where(and(...conditions))
    .orderBy(desc(user.ordersCount), desc(user.createdAt));

  return rows.filter((row) => row.email && row.email.includes("@"));
}

type MarketingProductOptionsInput = {
  search?: string;
  limit?: number;
  offset?: number;
  filters?: Array<"premium" | "bestSeller" | "new">;
};

export async function getMarketingProductOptions(input: MarketingProductOptionsInput = {}) {
  await requireAdmin();
  const search = input.search?.trim() ?? "";
  const limit = Math.max(1, Math.min(input.limit ?? 8, 24));
  const offset = Math.max(0, input.offset ?? 0);
  const filters = new Set(input.filters ?? []);
  const conditions = [eq(products.isActive, true)];

  if (search) {
    conditions.push(
      sql`(${products.name} ilike ${`%${search}%`} or ${products.slug} ilike ${`%${search}%`})`
    );
  }
  if (filters.has("premium")) conditions.push(eq(products.isPremium, true));
  if (filters.has("bestSeller")) conditions.push(eq(products.isFeatured, true));
  if (filters.has("new")) conditions.push(eq(products.isNew, true));

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      images: products.images,
      sellingPrice: products.sellingPrice,
      isNew: products.isNew,
      isFeatured: products.isFeatured,
      isPremium: products.isPremium,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.isNew), desc(products.isFeatured), desc(products.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const items = rows.slice(0, limit).map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: normalizeProductImage(product.images?.[0]),
    sellingPrice: product.sellingPrice,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    isPremium: product.isPremium,
  }));

  return {
    items,
    nextOffset: rows.length > limit ? offset + items.length : null,
  };
}

export async function getMarketingAudiencePreview(audience: CampaignAudience) {
  await requireAdmin();
  const recipients = await resolveCampaignRecipients(audience);

  return {
    count: recipients.length,
    sample: recipients.slice(0, 20),
    capped: recipients.length > MARKETING_FINAL_SEND_LIMIT,
  };
}

export async function getMarketingCampaigns() {
  await requireAdmin();
  const rows = await db
    .select({
      id: marketingCampaigns.id,
      name: marketingCampaigns.name,
      subject: marketingCampaigns.subject,
      audience: marketingCampaigns.audience,
      status: marketingCampaigns.status,
      recipientCount: marketingCampaigns.recipientCount,
      sentCount: marketingCampaigns.sentCount,
      failedCount: marketingCampaigns.failedCount,
      skippedCount: marketingCampaigns.skippedCount,
      error: marketingCampaigns.error,
      createdAt: marketingCampaigns.createdAt,
      sentAt: marketingCampaigns.sentAt,
    })
    .from(marketingCampaigns)
    .orderBy(desc(marketingCampaigns.createdAt))
    .limit(50);

  return rows.map((campaign) => ({
    ...campaign,
    createdAt: campaign.createdAt.toISOString(),
    sentAt: campaign.sentAt?.toISOString() ?? null,
  }));
}

export async function sendMarketingTestEmail(input: CampaignDraftInput, testEmail?: string) {
  const session = await requireAdmin();
  const draft = validateCampaignDraft(input);
  const campaignProducts = await getCampaignProducts(draft.productIds);
  const recipient: CampaignRecipient = {
    userId: session.user.id,
    email: normalizeMarketingEmail(testEmail || session.user.email),
    name: session.user.name || "there",
  };

  await sendMarketingEmailBatch(buildMessages(draft, [recipient], campaignProducts));

  return { success: true, email: recipient.email };
}

export async function sendMarketingCampaign(input: CampaignDraftInput) {
  const session = await requireAdmin();
  const draft = validateCampaignDraft(input);
  const recipients = await resolveCampaignRecipients(draft.audience);

  if (recipients.length === 0) {
    throw new Error("No eligible recipients found for this audience");
  }

  if (recipients.length > MARKETING_FINAL_SEND_LIMIT) {
    throw new Error(`Audience is capped at ${MARKETING_FINAL_SEND_LIMIT} recipients for v1`);
  }

  const campaignProducts = await getCampaignProducts(draft.productIds);

  const campaign = await db.transaction(async (tx) => {
    const [createdCampaign] = await tx
      .insert(marketingCampaigns)
      .values({
        name: draft.name,
        subject: draft.subject,
        previewText: draft.previewText,
        headline: draft.headline,
        body: draft.body,
        ctaLabel: draft.ctaLabel,
        ctaUrl: draft.ctaUrl,
        productIds: draft.productIds,
        audience: draft.audience,
        status: "sending",
        recipientCount: recipients.length,
        createdBy: session.user.id,
      })
      .returning();

    await tx.insert(marketingCampaignRecipients).values(
      recipients.map((recipient) => ({
        campaignId: createdCampaign.id,
        userId: recipient.userId,
        email: recipient.email,
        name: recipient.name,
        status: "pending",
      }))
    );

    return createdCampaign;
  });

  const recipientRows = await db
    .select({
      id: marketingCampaignRecipients.id,
      userId: marketingCampaignRecipients.userId,
      email: marketingCampaignRecipients.email,
      name: marketingCampaignRecipients.name,
    })
    .from(marketingCampaignRecipients)
    .where(eq(marketingCampaignRecipients.campaignId, campaign.id));

  let sentCount = 0;
  let failedCount = 0;

  for (const chunk of chunkForResend(recipientRows)) {
    const messages = buildMessages(draft, chunk, campaignProducts);

    try {
      const result = await sendMarketingEmailBatch(messages);
      const failedByIndex = new Map(result.errors.map((error) => [error.index, error.message]));
      let successIndex = 0;

      for (let index = 0; index < chunk.length; index += 1) {
        const recipient = chunk[index];
        const failedMessage = failedByIndex.get(index);

        if (failedMessage) {
          failedCount += 1;
          await db
            .update(marketingCampaignRecipients)
            .set({ status: "failed", error: failedMessage })
            .where(eq(marketingCampaignRecipients.id, recipient.id));
          continue;
        }

        const resendEmailId = result.data[successIndex]?.id;
        successIndex += 1;
        sentCount += 1;
        await db
          .update(marketingCampaignRecipients)
          .set({
            status: "sent",
            resendEmailId,
            sentAt: new Date(),
          })
          .where(eq(marketingCampaignRecipients.id, recipient.id));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send batch";
      failedCount += chunk.length;
      for (const recipient of chunk) {
        await db
          .update(marketingCampaignRecipients)
          .set({ status: "failed", error: message })
          .where(eq(marketingCampaignRecipients.id, recipient.id));
      }
    }
  }

  const status = failedCount === 0 ? "sent" : sentCount === 0 ? "failed" : "partial";

  await db
    .update(marketingCampaigns)
    .set({
      status,
      sentCount,
      failedCount,
      skippedCount: 0,
      sentAt: new Date(),
      updatedAt: new Date(),
      error: failedCount > 0 ? `${failedCount} recipients failed` : null,
    })
    .where(eq(marketingCampaigns.id, campaign.id));

  return {
    id: campaign.id,
    status,
    recipientCount: recipients.length,
    sentCount,
    failedCount,
  };
}

export async function unsubscribeFromMarketing(token: string) {
  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return { success: false, message: "This unsubscribe link is invalid." };
  }

  const email = normalizeMarketingEmail(payload.email);
  const [matchedUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  await db
    .insert(marketingEmailSuppressions)
    .values({
      email,
      userId: matchedUser?.id ?? null,
      reason: "unsubscribe",
    })
    .onConflictDoUpdate({
      target: marketingEmailSuppressions.email,
      set: {
        reason: "unsubscribe",
        userId: matchedUser?.id ?? null,
      },
    });

  return { success: true, email };
}
