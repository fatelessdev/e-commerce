# Checkout And Orders Walkthrough

## Entry Points

- Customer checkout UI: `app/checkout/page.tsx`
- COD order route: `app/api/orders/route.ts`
- Razorpay order route: `app/api/razorpay/route.ts`
- Razorpay verification route: `app/api/razorpay/verify/route.ts`
- Order writes and cancellation: `lib/actions/orders.ts`
- Quote resolver: `lib/checkout/quote.ts`
- Pure pricing math: `lib/checkout/pricing.ts`
- Coupon validation: `lib/coupon-validation.ts`

## Quote Flow

The client sends cart items, coupon code, shipping address, and payment method. The server creates a quote by:

1. Validating cart quantities.
2. Loading active products and replacing client prices/names with database values.
3. Computing combo discounts from `comboId` and `comboGroupId`.
4. Validating coupons against canonical coupon rules.
5. Computing shipping, COD fee, total discount, and final total.

All payment paths use the same quote resolver. Do not add new subtotal or coupon calculations inside route handlers.

## COD Order Creation

`POST /api/orders` accepts only `paymentMethod: "cod"` and only allowed pincodes from `lib/constants.ts`. It creates a COD quote, then calls `createOrder()` with the verified quote.

COD orders get `paymentStatus: "pending"` and include the COD fee in the stored total.

## Razorpay Flow

`POST /api/razorpay` creates a Razorpay order using the server quote total in paise.

`POST /api/razorpay/verify` validates the Razorpay signature, prevents duplicate order creation by checking Razorpay IDs, rebuilds the quote, verifies Razorpay order/captured amounts within the existing one-rupee tolerance, then calls `createOrder()` with `paymentStatus: "paid"`.

No live charge is needed for local verification unless explicitly authorized.

## Order Write Contract

`createOrder()` is the single order intake interface. Inside one transaction it:

- Revalidates coupon consumption.
- Inserts the order row.
- Inserts order item snapshots.
- Decrements variant or product stock.
- Recalculates product stock from variants when needed.
- Updates user order count, total spent, and saved shipping address.

Keep cache revalidation after the transaction succeeds.

## COD Cancellation

`cancelOrder()` allows only the owning user to cancel COD orders in `pending` or `confirmed` status. It atomically marks the order cancelled, restores stock, rolls back user metrics, and refreshes order/product surfaces.

The UI button is in `app/orders/cancel-button.tsx` and only renders for eligible COD orders.
