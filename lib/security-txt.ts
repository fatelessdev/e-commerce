import { CONTACT_EMAIL } from "./constants.ts";
import { normalizeSiteUrl } from "./seo.ts";

export const SECURITY_TXT_CONTENT_TYPE = "text/plain; charset=utf-8";

export function buildSecurityTxt(baseUrl = normalizeSiteUrl()) {
  const normalizedBaseUrl = normalizeSiteUrl(baseUrl);

  return [
    `Contact: mailto:${CONTACT_EMAIL}`,
    `Canonical: ${normalizedBaseUrl}/.well-known/security.txt`,
    "Preferred-Languages: en, hi",
    "",
  ].join("\n");
}
