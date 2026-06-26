export const MARKETING_BATCH_SIZE = 100;
export const MARKETING_FINAL_SEND_LIMIT = 1000;
export const MARKETING_PRODUCT_SELECTION_LIMIT = 12;
export const DEFAULT_HIGH_SPENDER_MINIMUM = 3000;
export const RECENT_BUYER_DAYS = 90;

export const marketingAudienceTypes = [
  "selected",
  "all",
  "buyers",
  "nonBuyers",
  "recentBuyers",
  "highSpenders",
] as const;

export type MarketingAudienceType = (typeof marketingAudienceTypes)[number];

export type CampaignAudience =
  | { type: "selected"; userIds: string[] }
  | { type: "all" }
  | { type: "buyers" }
  | { type: "nonBuyers" }
  | { type: "recentBuyers"; days?: number }
  | { type: "highSpenders"; minimumSpend?: number };

export type CampaignDraftInput = {
  name: string;
  subject: string;
  previewText: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  productIds: string[];
  audience: CampaignAudience;
};

export type CampaignRecipient = {
  userId: string | null;
  email: string;
  name: string;
};

export type CampaignProduct = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  sellingPrice: string;
  mrp: string;
};

const MAX_TEXT_LENGTHS = {
  name: 120,
  subject: 140,
  previewText: 180,
  headline: 140,
  body: 4000,
  ctaLabel: 40,
  ctaUrl: 600,
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isRelativeStorePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

export function normalizeCampaignAudience(input: CampaignAudience): CampaignAudience {
  switch (input.type) {
    case "selected":
      return {
        type: "selected",
        userIds: Array.from(new Set(input.userIds.map(cleanText).filter(Boolean))),
      };
    case "recentBuyers":
      return {
        type: "recentBuyers",
        days: Math.max(1, Math.min(input.days ?? RECENT_BUYER_DAYS, 365)),
      };
    case "highSpenders":
      return {
        type: "highSpenders",
        minimumSpend: Math.max(1, input.minimumSpend ?? DEFAULT_HIGH_SPENDER_MINIMUM),
      };
    case "all":
    case "buyers":
    case "nonBuyers":
      return input;
  }
}

export function validateCampaignDraft(input: CampaignDraftInput): CampaignDraftInput {
  const draft: CampaignDraftInput = {
    name: cleanText(input.name),
    subject: cleanText(input.subject),
    previewText: cleanText(input.previewText),
    headline: cleanText(input.headline),
    body: cleanText(input.body),
    ctaLabel: cleanText(input.ctaLabel),
    ctaUrl: cleanText(input.ctaUrl),
    productIds: Array.from(new Set((input.productIds ?? []).map(cleanText).filter(Boolean))).slice(0, MARKETING_PRODUCT_SELECTION_LIMIT),
    audience: normalizeCampaignAudience(input.audience),
  };

  for (const [key, maxLength] of Object.entries(MAX_TEXT_LENGTHS)) {
    const value = draft[key as keyof CampaignDraftInput];
    if (typeof value === "string" && value.length > maxLength) {
      throw new Error(`${key} must be ${maxLength} characters or fewer`);
    }
  }

  if (!draft.name) throw new Error("Campaign name is required");
  if (!draft.subject) throw new Error("Subject is required");
  if (!draft.headline) throw new Error("Headline is required");
  if (!draft.body) throw new Error("Body is required");
  if (!draft.ctaLabel) throw new Error("CTA label is required");
  if (!draft.ctaUrl) throw new Error("CTA URL is required");

  if (!isHttpUrl(draft.ctaUrl) && !isRelativeStorePath(draft.ctaUrl)) {
    throw new Error("CTA URL must be an http(s) URL or a store path starting with /");
  }

  if (draft.audience.type === "selected" && draft.audience.userIds.length === 0) {
    throw new Error("Select at least one customer");
  }

  return draft;
}

export function chunkForResend<T>(items: T[], size = MARKETING_BATCH_SIZE) {
  if (!Number.isInteger(size) || size < 1 || size > MARKETING_BATCH_SIZE) {
    throw new Error(`Batch size must be between 1 and ${MARKETING_BATCH_SIZE}`);
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
