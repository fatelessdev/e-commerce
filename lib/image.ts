export const DEFAULT_PRODUCT_IMAGE = "/clothes/clothes1.jpeg";

export function normalizeProductImage(imagePath?: string | null): string {
  const trimmed = imagePath?.trim();

  if (!trimmed) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}
