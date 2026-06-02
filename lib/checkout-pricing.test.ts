import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertRazorpayAmountMatchesQuote,
  buildCheckoutQuoteFromVerifiedItems,
} from "./checkout/pricing.ts";

const verifiedItems = [
  {
    productId: "p1",
    productName: "Server tee",
    productImage: "/server-tee.jpg",
    size: "M",
    color: "Black",
    quantity: 2,
    unitPrice: 700,
    totalPrice: 1400,
  },
  {
    productId: "p2",
    productName: "Server cargo",
    productImage: "/server-cargo.jpg",
    size: "L",
    color: "Olive",
    quantity: 2,
    unitPrice: 800,
    totalPrice: 1600,
  },
];

describe("checkout pricing", () => {
  it("builds a server-priced COD quote with combo, coupon, shipping, and COD fee", () => {
    const quote = buildCheckoutQuoteFromVerifiedItems({
      items: verifiedItems,
      paymentMethod: "cod",
      comboDiscount: 100,
      couponDiscount: 50,
      couponCode: "save50",
    });

    assert.equal(quote.subtotal, 3000);
    assert.equal(quote.comboDiscount, 100);
    assert.equal(quote.couponDiscount, 50);
    assert.equal(quote.discount, 150);
    assert.equal(quote.shippingCost, 0);
    assert.equal(quote.codFee, 50);
    assert.equal(quote.total, 2900);
    assert.equal(quote.couponCode, "SAVE50");
  });

  it("charges shipping below the free-shipping threshold and never lets discounts invert total", () => {
    const quote = buildCheckoutQuoteFromVerifiedItems({
      items: [
        {
          productId: "p1",
          productName: "Server tee",
          size: "M",
          quantity: 1,
          unitPrice: 499,
          totalPrice: 499,
        },
      ],
      paymentMethod: "upi",
      comboDiscount: 200,
      couponDiscount: 500,
    });

    assert.equal(quote.subtotal, 499);
    assert.equal(quote.shippingCost, 99);
    assert.equal(quote.codFee, 0);
    assert.equal(quote.discount, 498);
    assert.equal(quote.total, 100);
  });

  it("rejects mismatched item totals before quote creation", () => {
    assert.throws(
      () =>
        buildCheckoutQuoteFromVerifiedItems({
          items: [{ ...verifiedItems[0], totalPrice: 1399 }],
          paymentMethod: "card",
        }),
      /Price total mismatch/
    );
  });

  it("allows Razorpay amount parity within the existing one-rupee tolerance", () => {
    const quote = buildCheckoutQuoteFromVerifiedItems({
      items: verifiedItems,
      paymentMethod: "netbanking",
      couponDiscount: 25,
    });

    assert.doesNotThrow(() =>
      assertRazorpayAmountMatchesQuote({
        quoteTotal: quote.total,
        orderAmountInPaise: Math.round((quote.total + 1) * 100),
        capturedAmountInPaise: Math.round(quote.total * 100),
      })
    );

    assert.throws(
      () =>
        assertRazorpayAmountMatchesQuote({
          quoteTotal: quote.total,
          orderAmountInPaise: Math.round((quote.total + 2) * 100),
          capturedAmountInPaise: Math.round(quote.total * 100),
        }),
      /Payment amount mismatch/
    );
  });
});
