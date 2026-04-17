# XILAR E-Commerce — Copilot Instructions

CHECK IF YOU HAVE SKILLS FOR THE TECHNOLOGY YOU'RE TRYING TO IMPLEMENT. IF PRESENT, REFER TO THE SKILLS FIRST AND THEN PROCEED.

No bandaid fixes. Fix root causes.
No backward-compatibility shims (early-stage product).
For each task map out the full scope where the changes are needed like db, api, frontend etc. and then implement all at once.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Database:** Neon PostgreSQL (serverless) via Drizzle ORM (`lib/db/schema.ts`, `lib/db/index.ts`)
- **Auth:** Better Auth with admin plugin (`lib/auth.ts`, `lib/auth-server.ts`, `lib/auth-client.ts`)
- **Payments:** Razorpay (order creation + signature verification) — `lib/razorpay.ts`, `app/api/razorpay/`
- **AI:** NVIDIA NIM (Qwen3 model) via Vercel AI SDK — `lib/nim.ts`, `app/api/bargain/route.ts`
- **Images:** Cloudinary CDN with auto-format/quality — `lib/cloudinary.ts`
- **Styling:** Tailwind CSS 4 + `cn()` utility from `lib/utils.ts`, Lucide icons, Framer Motion

## Architecture

```
app/              → Pages & API routes (App Router)
  admin/          → Admin dashboard (requires admin role)
  api/            → Route handlers (auth, products, orders, bargain, razorpay, coupons, upload)
  shop/           → Store pages with gender/category filtering
  product/[id]/   → Product detail (dynamic route)
components/
  features/       → Domain components (bargain-ai, cart-drawer, checkout-bargain, product-client, shop-client)
  layout/         → Navbar, sidebar
  ui/             → Primitives (Button, Card) — shadcn-style with variant props, NOT shadcn/ui
lib/
  actions/        → Server actions (admin.ts, orders.ts) — all DB mutations go here
  db/             → Drizzle schema & connection
  *-context.tsx   → Client providers (cart, wishlist, theme) using localStorage
types/index.ts    → Shared TypeScript interfaces
drizzle/          → Migration SQL files
```

## Key Patterns

### Data Mutations & Server Actions
All database writes use server actions in `lib/actions/`. API route handlers call these actions — never write to DB directly from routes. Admin actions enforce `requireAdmin()` from `lib/auth-server.ts`.

### Auth Guards
- `getServerSession()` — get current session (pages/routes)
- `requireAuth()` / `requireAdmin()` — throw if unauthorized (server actions)
- Client: `useSession()` hook from `lib/auth-client.ts`

### Client State (Cart, Wishlist, Theme)
Stored in `localStorage` (keys: `xilar-cart`, `xilar-wishlist`, `xilar-theme`). Provided via React Context from `lib/*-context.tsx`. No server-side cart — entirely client-driven.

### Pricing & Security
- Server always recalculates totals from DB prices — never trust client amounts
- Razorpay signature verification on payment confirmation (`app/api/razorpay/verify/route.ts`)
- Coupon validation runs server-side with all business rules (expiry, limits, min order, user restrictions)
- Shipping: free ≥ ₹999, else ₹99 (see `lib/constants.ts` for source of truth)

### Bargain AI (Discount Negotiation)
- Checkout component (`components/features/checkout-bargain.tsx`) streams AI chat via `/api/bargain`
- Progressive discount: round 1 → 30-40%, round 2 → 50-60%, round 3+ → 80-90% of max allowed
- Generates ephemeral coupons (prefix `BRG-`, 5-min expiry) stored in `coupons` and `bargainSessions` tables
- Product page AI (`components/features/bargain-ai.tsx`) answers questions locally — no API calls

### Payment & Checkout Flow
Two payment paths in `app/checkout/page.tsx`:
- **COD:** POST `/api/orders` → creates order directly with `paymentStatus="pending"`, adds ₹50 COD fee
- **Online (Razorpay):** POST `/api/razorpay` (create order) → open Razorpay modal → POST `/api/razorpay/verify` (signature verification + amount check with ±₹1 tolerance) → `createOrder()` with `paymentStatus="paid"`
- Server recalculates totals in both paths — client amounts are never trusted
- Razorpay payment methods: UPI, Card, NetBanking (validated in verify route)

### Store Credits & Refunds
- `issueStoreCredit()` in `lib/actions/admin.ts` generates `CREDIT-XXXXXXXX` prefixed coupons
- Adds 5% bonus on top of refund amount (e.g., ₹1000 refund → ₹1050 credit)
- Fixed-value coupons, user-specific, valid 30-60 days
- `getUserStoreCredits()` fetches active credits for a user

### Content Pages
- `app/collections/` — curated product collections (Essentials, Summer '26)
- `app/policies/` — store policies with subpages: `exchange/`, `refunds/`, `returns/`, `shipping/`
- `app/about/` — about page
- `app/new/` — new arrivals page

### UI Components
Custom shadcn-inspired primitives in `components/ui/`. Use `cn()` for class merging. Button supports variants: `default | outline | ghost | link | destructive` and sizes: `default | sm | lg | icon`.

## Database

Schema in `lib/db/schema.ts`. Key tables: `user`, `products`, `orders`, `order_items`, `coupons`, `bargainSessions`, `wishlist`. Enums: `user_role`, `order_status`, `product_category`, `product_gender`.

**Commands:** `npm run db:generate` → `npm run db:push` (apply schema changes), `npm run db:studio` (browse data)

## Environment Variables

Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NIM_API_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`

## Conventions

- Import paths use `@/` alias (maps to project root)
- Currency is INR (₹) throughout
- Product images: JSON arrays in DB, served via Cloudinary in prod, local `/clothes/` in dev
- Order items snapshot product data at purchase time (name, price, image) for historical accuracy
- Pages use metadata exports for SEO; root layout includes Open Graph & JSON-LD
- Dark mode default (`html.dark`), toggle via ThemeProvider

## Design Context

- Refer to [.impeccable.md](.impeccable.md) for the full design context, brand personality, aesthetic direction, motion rules, and accessibility guidance.
- Keep this file focused on repo-wide engineering and implementation rules.
