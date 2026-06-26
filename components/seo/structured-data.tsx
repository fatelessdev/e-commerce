import { safeJsonLdStringify } from "@/lib/safe-json";
export {
  breadcrumbJsonLd,
  collectionJsonLd,
  faqJsonLd,
  organizationJsonLd,
  productJsonLd,
  webSiteJsonLd,
} from "@/lib/structured-data";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json">{safeJsonLdStringify(data)}</script>;
}
