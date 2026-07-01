export const TRY_ON_PROMPT_VERSION = "try-on-v1";
export const DEFAULT_TRY_ON_MODEL_ID = "google/gemini-3.1-flash-image";
export const MAX_TRY_ON_IMAGE_BYTES = 10 * 1024 * 1024;

export const TRY_ON_BODY_MODES = ["upper", "lower", "full"] as const;
export type TryOnBodyMode = (typeof TRY_ON_BODY_MODES)[number];
export type RequiredTryOnMode = "upper" | "lower" | "unsupported";

const TOP_CATEGORIES = new Set(["tshirt", "shirt", "hoodie", "jacket"]);
const BOTTOM_CATEGORIES = new Set(["jeans", "cargo", "jogger", "shorts"]);
const SUPPORTED_TRY_ON_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function getRequiredTryOnMode(category: string): RequiredTryOnMode {
  if (TOP_CATEGORIES.has(category)) return "upper";
  if (BOTTOM_CATEGORIES.has(category)) return "lower";
  return "unsupported";
}

export function isTryOnBodyMode(value: string | null | undefined): value is TryOnBodyMode {
  return TRY_ON_BODY_MODES.includes(value as TryOnBodyMode);
}

export function isTryOnBodyModeAllowed(
  requiredMode: RequiredTryOnMode,
  bodyMode: TryOnBodyMode,
) {
  if (requiredMode === "unsupported") return false;
  if (bodyMode === "full") return true;
  return requiredMode === bodyMode;
}

export function getTryOnModelId(env?: { OPENROUTER_TRYON_MODEL?: string }) {
  const modelId = env?.OPENROUTER_TRYON_MODEL ?? process.env.OPENROUTER_TRYON_MODEL;
  return modelId?.trim() || DEFAULT_TRY_ON_MODEL_ID;
}

export function validateTryOnImageFile(file: { type: string; size: number }) {
  if (!SUPPORTED_TRY_ON_IMAGE_TYPES.has(file.type)) {
    return { ok: false as const, error: "Upload a JPEG, PNG, or WebP image." };
  }

  if (file.size > MAX_TRY_ON_IMAGE_BYTES) {
    return { ok: false as const, error: "Image must be 10MB or smaller." };
  }

  return { ok: true as const };
}

export function buildTryOnPrompt({
  productName,
  category,
  requiredMode,
}: {
  productName: string;
  category: string;
  requiredMode: RequiredTryOnMode;
}) {
  const garmentArea = requiredMode === "lower" ? "lower-body garment" : "upper-body garment";

  return [
    `Create a realistic virtual try-on preview for the product "${productName}" (${category}).`,
    "Use the first reference image as the person/body photo and the second reference image as the garment/product reference.",
    "Preserve the person, face, pose, body proportions, camera angle, lighting direction, and background from the body photo.",
    `Replace only the ${garmentArea} with the selected product, matching fabric texture, print placement, color, seams, drape, and fit as faithfully as possible.`,
    "Keep skin, hair, hands, shoes, accessories, and all non-target clothing unchanged unless they are naturally occluded by the product.",
    "Do not create an editorial campaign image, do not change the person identity, and do not invent extra logos or text.",
  ].join(" ");
}

export function buildTryOnAssetPublicId({
  productId,
  userId,
  timestamp,
  kind,
}: {
  productId: string;
  userId: string;
  timestamp: number;
  kind: "body" | "output";
}) {
  return `${productId}-${userId}-${timestamp}-${kind}`
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}
