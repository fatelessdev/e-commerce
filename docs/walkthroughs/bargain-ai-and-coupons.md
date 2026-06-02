# Bargain AI And Coupons Walkthrough

## Entry Points

- Checkout UI: `components/features/checkout-bargain.tsx`
- Streaming route: `app/api/bargain/route.ts`
- Pure bargain rules: `lib/bargain/logic.ts`
- Eligibility context: `lib/bargain/context.ts`
- Coupon persistence: `lib/actions/bargain.ts`
- Coupon validation: `lib/coupon-validation.ts`
- Coupon consumption: `lib/actions/orders.ts`

## Negotiation Flow

The checkout component posts chat messages, cart items, cart total, and negotiation round to `/api/bargain`.

The route authenticates the user, asks `lib/bargain/context.ts` for first-time-user state and configured product/combo caps, and delegates all offer math to `lib/bargain/logic.ts`.

Pure logic decides:

- Cart-rule cap.
- Configured product/combo cap.
- Requested discount parsing.
- Unreasonable demand detection.
- Current offer amount.
- Whether this round should finalize.

## Coupon Persistence

When a final coupon should be issued and the user is authenticated, the route calls `createBargainCoupon()` before streaming the final response. That action writes the `coupons` and `bargain_sessions` rows transactionally.

The route only sends coupon headers and tells the model to present a code after persistence succeeds. This prevents a streamed coupon from existing only in text.

## Coupon Shape

Bargain coupons are:

- Prefix: `BRG-`
- Type: fixed discount
- Scope: specific user
- Usage: single-use
- Expiry: five minutes
- Session tracking: `bargain_sessions.used`

Order creation consumes the coupon and marks the matching bargain session used.

## Rules For Changes

Keep model prompt copy separate from business rules. If the offer progression changes, update `lib/bargain/logic.ts` and tests first, then adjust prompt context if needed.

Do not write coupon/session rows directly in `/api/bargain`.
