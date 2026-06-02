# Admin Catalog Walkthrough

## Entry Points

- Admin shell: `app/admin/layout.tsx`
- Products: `app/admin/products/`
- Combos: `app/admin/combos/`
- Coupons: `app/admin/coupons/`
- Orders: `app/admin/orders/`
- Admin actions: `lib/actions/admin.ts`, `lib/actions/combos.ts`
- Product input normalization: `lib/admin-product-input.ts`

## Guarding

Admin pages require a signed-in Better Auth session and `isAdmin()` from `lib/auth-server.ts`. Admin write actions should call `requireAdmin()` at the action boundary.

## Catalog Writes

Product writes normalize incoming form/server-action payloads before touching Drizzle. Keep product and variant validation in the action boundary so the database never receives duplicate variant dimensions or malformed numbers.

Products with variants use variant stock as source of truth; product-level stock is recalculated from variant totals. Accessory/no-variant products may use the product stock field directly.

## Combos

Combos pair two products and define the max bargain discount for that pair. Checkout quote calculation validates combo cart groups server-side before applying the discount.

## Coupons And Store Credit

Coupons are the shared discount primitive for normal coupons, bargain coupons, and store credits. Store credits use fixed-value user-specific coupons and should keep the existing bonus/refund behavior in admin actions.

## Removed Settings

The placeholder settings page and nav link were removed. Reintroduce settings only with a real persistence model, validation rules, and tests.

## Merchandising Stats

Seeded product rating/viewer stats are intentional merchandising data. Keep them unless the product strategy changes; do not remove them as cleanup noise.
