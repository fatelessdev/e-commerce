# XILAR Domain Context

## Product

A sellable catalog item in `products`. Product rows hold display copy, merchandising flags, images, base stock, pricing, category/gender, and `maxBargainDiscount` for non-combo bargain caps.

## Variant

A product inventory bucket in `product_variants`, keyed by product, size, and optional color. Products with variants mutate variant stock first and then recalculate product-level stock from variant totals.

## Combo

A two-product bundle in `combos`. Combo cart lines carry `comboId` and a shared `comboGroupId`. Server quote calculation validates the pair and applies the configured combo discount, capped by the pair subtotal and quantity.

## Cart

Client-side shopping state stored in localStorage. The cart is a convenience payload, not a pricing authority. Route handlers must re-price cart items from the database.

## Checkout Quote

The server-owned price contract produced by `createCheckoutQuote()` in `lib/checkout/quote.ts`. It contains verified order items, subtotal, combo discount, coupon discount, shipping, COD fee, and final total.

## Coupon

A row in `coupons`. Coupons may be fixed or percentage discounts, can have validity windows, usage limits, minimum order values, and optional user restriction. Order creation consumes coupons transactionally.

## Bargain Coupon

A generated `BRG-` coupon created by the checkout bargain AI. It is fixed-value, user-specific, single-use, and expires after five minutes. Coupon and bargain session rows are created together by `createBargainCoupon()`.

## Order

The durable purchase record in `orders` with snapshot `order_items`. Order creation is the single write path for customer checkout and handles coupon consumption, inventory mutation, user metrics, and order snapshots in one transaction.

## COD Cancellation

Customer cancellation for owner-owned COD orders while status is `pending` or `confirmed`. Cancellation marks the order cancelled, restores product/variant stock, rolls back user order metrics, and revalidates order and product surfaces.

## Store Credit

Admin-issued fixed-value coupon, usually prefixed `CREDIT-`, used for refunds or customer service credits. Store credits are user-specific and follow normal coupon validation at checkout.
