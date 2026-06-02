const CUSTOMER_CANCELLABLE_COD_STATUSES = new Set(["pending", "confirmed"]);

export function getCustomerCodCancellationFailure(input: {
  orderUserId: string | null;
  currentUserId: string;
  paymentMethod: string | null;
  status: string;
}) {
  if (input.orderUserId !== input.currentUserId) {
    return "You can only cancel your own orders";
  }

  if (input.paymentMethod !== "cod") {
    return "Only COD orders can be cancelled online. For paid orders, please contact support.";
  }

  if (!CUSTOMER_CANCELLABLE_COD_STATUSES.has(input.status)) {
    return `Cannot cancel an order that is already ${input.status}`;
  }

  return null;
}
