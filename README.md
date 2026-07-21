# XILAR E-Commerce

XILAR is a Next.js storefront for apparel with a dark editorial frontend, SEO-focused public routing, admin catalog tools, Razorpay checkout, COD orders, account-backed wishlist support, coupon/store-credit support, and a checkout bargain AI that can issue short-lived coupons.

## Stack

- Next.js 16 App Router, React 19, TypeScript 5
- Neon PostgreSQL through Drizzle ORM
- Better Auth with admin role support
- Razorpay orders and payment verification
- OpenRouter through the Vercel AI SDK
- Cloudinary image delivery
- Vercel Analytics and GA4 measurement
- Tailwind CSS 4, Lucide icons, Framer Motion, GSAP where the existing motion system uses it

## Setup

Install dependencies and run the local app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Required environment variables:

```bash
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_WEBHOOK_SECRET=
OPENROUTER_API_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

## Scripts

```bash
npm test
npm run lint
npm run build
npm run db:generate
npm run db:push
npm run db:studio
```

Use `npm test`, `npm run lint`, and `npm run build` as the main quality gate before shipping.

If full `npm run lint` stalls on Windows, run focused lint on the touched files and still run `npm test` plus `npm run build`.

## Architecture

- `app/` contains App Router pages and route handlers.
- `components/features/` contains customer-facing domain components such as cart, checkout, product, shop, and bargain UI.
- `components/ui/` contains local primitives. They are shadcn-style, not generated shadcn/ui.
- `lib/db/` owns Drizzle schema and database connection.
- `lib/actions/` owns database mutations and privileged server operations.
- `lib/checkout/quote.ts` owns server-side checkout quote creation.
- `lib/checkout/pricing.ts` owns pure quote math and Razorpay amount parity checks.
- `lib/coupon-validation.ts` owns public coupon validation and discount math.
- `lib/seo.ts`, `lib/structured-data.ts`, and `lib/seo-merchant-feed.ts` own canonical URL helpers, JSON-LD payloads, and merchant-feed serialization.
- `lib/public-cache.ts` owns the public paths that admin product/combo mutations revalidate.
- `lib/wishlist.ts` and `lib/actions/wishlist.ts` own account-backed wishlist reads and writes.
- `lib/actions/orders.ts` owns atomic order creation and COD cancellation.
- `lib/bargain/logic.ts` owns pure bargain cap, offer, and finalization rules.
- `lib/bargain/context.ts` owns DB-backed bargain eligibility context.
- `lib/actions/bargain.ts` owns persisted bargain coupon/session writes.

## Public Storefront, SEO, And Caching

Public product URLs use slugs, not database UUIDs. Use `buildProductPath(slug)` and `buildProductUrl(slug, baseUrl)` from `lib/seo.ts` whenever code builds product links, canonical URLs, sitemap entries, structured data, or feed URLs. Product actions still use product IDs for mutations.

Catalog and editorial pages are intended to stay static or SSG where possible. The root layout does not read request cookies; theme first paint is repaired by a small inline script so public pages remain cacheable. Product and combo detail pages use `generateStaticParams()`, and admin product/combo mutations revalidate the relevant public storefront, sitemap, feed, and detail paths through `lib/public-cache.ts`.

SEO surfaces include:

- `app/sitemap.ts` for canonical public routes and slug product URLs.
- `app/robots.ts` plus `proxy.ts` for crawl policy and noindex headers on query-driven catalog variants.
- `app/feeds/google-merchant.xml/route.ts` for active-product Google Merchant feed output.
- `app/llms.txt/route.ts` for AI-readable site context.
- `app/.well-known/security.txt/route.ts` and `app/security.txt/route.ts` for security contact metadata.
- `components/seo/structured-data.tsx` and `lib/structured-data.ts` for JSON-LD injection.

GA4 is installed once in the root layout with measurement ID `G-6GDBLBWZW9`; do not add another Google tag per page.

## Checkout And Orders

The client cart is intentionally localStorage-backed. The server never trusts client totals.

Checkout route handlers call `createCheckoutQuote()` to resolve products, validate quantities, compute combo discounts, validate coupons, calculate shipping/COD fees, and produce verified order items. COD order creation, Razorpay order creation, and Razorpay payment verification all use that same quote path.

Order creation in `createOrder()` is transactional: coupon consumption, order rows, order item snapshots, stock mutation, user order metrics, and cache revalidation are handled as one write path. COD cancellation is restored for owner-owned `pending` or `confirmed` COD orders and restores product/variant stock while rolling back user order metrics.

## Wishlist

Wishlist data is account-backed. The `/wishlist` page requires a server session and reads from the database. Product and navbar wishlist state go through server actions; there is intentionally no `localStorage` wishlist provider fallback.

## Storefront Performance

The public shell is tuned to keep the first viewport stable and cacheable:

- Home streams the hero before data-dependent merchandising sections.
- Route fallbacks reserve viewport height so the footer does not flash into the initial paint.
- The shared footer is dynamically loaded behind `FooterGate`, with a reserved shell.
- The custom cursor effect waits for idle time, fine pointers, and non-reduced-motion users.
- Hero panel transitions avoid Framer layout animation and use short motion timing.
- Reel videos are lazy-loaded and include a captions track.

## Bargain AI

The checkout bargain API streams model output from `/api/bargain`, but persistence is separated:

- `lib/bargain/logic.ts` calculates configured caps, offer progression, demand reasonableness, and finalization.
- `lib/bargain/context.ts` loads product/combo caps and first-time-user eligibility.
- `lib/actions/bargain.ts` creates `BRG-` coupons and `bargain_sessions` records transactionally.
- Final coupon headers are only sent if the coupon was actually persisted.

Bargain coupons are fixed-value, user-specific, single-use, and expire after five minutes.

## Admin

Admin pages require the Better Auth admin role. Catalog writes live in server actions and normalize product/variant input before touching the database. Products, combos, coupons, and orders are the real admin surfaces; the placeholder settings page was intentionally removed.

Seeded rating/viewer merchandising stats are intentional presentation data. Do not remove them as "fake data" unless the merchandising model changes.

## Quality Tools

Desloppify is configured for cleanup scanning. Local/generated/source-material paths are excluded, including `.git`, `node_modules`, `.next`, `out`, `build`, `coverage`, `references`, `drizzle/meta`, `.env`, and `.env.local`.

If `desloppify` is not on PATH on Windows, use the Python Scripts path shown by `python -m site --user-base`, for example:

```powershell
& "$env:LOCALAPPDATA\Python\pythoncore-3.14-64\Scripts\desloppify.exe" status
```

## Walkthroughs

- `docs/walkthroughs/checkout-and-orders.md`
- `docs/walkthroughs/bargain-ai-and-coupons.md`
- `docs/walkthroughs/admin-catalog.md`
