import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCustomerCodCancellationFailure } from "./order-cancellation.ts";

describe("COD order cancellation eligibility", () => {
  it("allows owner-owned COD orders while pending or confirmed", () => {
    assert.equal(
      getCustomerCodCancellationFailure({
        orderUserId: "user-1",
        currentUserId: "user-1",
        paymentMethod: "cod",
        status: "pending",
      }),
      null
    );
  });

  it("rejects other users, paid methods, and terminal statuses", () => {
    assert.equal(
      getCustomerCodCancellationFailure({
        orderUserId: "user-2",
        currentUserId: "user-1",
        paymentMethod: "cod",
        status: "pending",
      }),
      "You can only cancel your own orders"
    );

    assert.equal(
      getCustomerCodCancellationFailure({
        orderUserId: "user-1",
        currentUserId: "user-1",
        paymentMethod: "upi",
        status: "pending",
      }),
      "Only COD orders can be cancelled online. For paid orders, please contact support."
    );

    assert.equal(
      getCustomerCodCancellationFailure({
        orderUserId: "user-1",
        currentUserId: "user-1",
        paymentMethod: "cod",
        status: "shipped",
      }),
      "Cannot cancel an order that is already shipped"
    );
  });
});
