import { buildSecurityTxt, SECURITY_TXT_CONTENT_TYPE } from "@/lib/security-txt";

export function GET() {
  return new Response(buildSecurityTxt(), {
    headers: {
      "Content-Type": SECURITY_TXT_CONTENT_TYPE,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
