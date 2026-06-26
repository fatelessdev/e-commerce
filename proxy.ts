import { NextResponse, type NextRequest } from "next/server";

const PRODUCT_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const config = {
  matcher: "/product/:slug",
};

export async function proxy(request: NextRequest) {
  const slugOrId = request.nextUrl.pathname.split("/").filter(Boolean).at(1);

  if (!slugOrId || !PRODUCT_UUID_PATTERN.test(slugOrId)) {
    return NextResponse.next();
  }

  try {
    const productResponse = await fetch(new URL(`/api/products/${slugOrId}`, request.url), {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!productResponse.ok) {
      return NextResponse.next();
    }

    const product = (await productResponse.json()) as { slug?: unknown };

    if (typeof product.slug !== "string" || !product.slug.trim()) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL(`/product/${product.slug}`, request.url), 308);
  } catch {
    return NextResponse.next();
  }
}
