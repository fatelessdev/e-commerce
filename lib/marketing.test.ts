import assert from "node:assert/strict";
import test from "node:test";
import { filterMarketingRecipients } from "./marketing/audience.ts";
import { buildCampaignEmailHtml } from "./marketing/email-template.ts";
import {
  chunkForResend,
  DEFAULT_HIGH_SPENDER_MINIMUM,
  MARKETING_PRODUCT_SELECTION_LIMIT,
  validateCampaignDraft,
  type CampaignDraftInput,
} from "./marketing/types.ts";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "./marketing/unsubscribe-token.ts";

const validDraft: CampaignDraftInput = {
  name: "Cargo restock",
  subject: "New cargos just landed",
  previewText: "Fresh XILAR pieces are live.",
  headline: "CARGO RESTOCK",
  body: "The new cargos are live.\n\nSizes are moving fast.",
  ctaLabel: "Shop now",
  ctaUrl: "/new",
  productIds: [],
  audience: { type: "highSpenders" },
};

test("validateCampaignDraft requires core campaign fields and valid CTA URLs", () => {
  assert.throws(
    () => validateCampaignDraft({ ...validDraft, subject: " " }),
    /Subject is required/
  );
  assert.throws(
    () => validateCampaignDraft({ ...validDraft, body: "" }),
    /Body is required/
  );
  assert.throws(
    () => validateCampaignDraft({ ...validDraft, ctaUrl: "javascript:alert(1)" }),
    /CTA URL/
  );

  const result = validateCampaignDraft({
    ...validDraft,
    productIds: ["p1", "p1", "p2"],
  });

  assert.equal(result.audience.type, "highSpenders");
  if (result.audience.type === "highSpenders") {
    assert.equal(result.audience.minimumSpend, DEFAULT_HIGH_SPENDER_MINIMUM);
  }
  assert.deepEqual(result.productIds, ["p1", "p2"]);
});

test("validateCampaignDraft keeps up to the campaign product selection limit", () => {
  const productIds = Array.from({ length: MARKETING_PRODUCT_SELECTION_LIMIT + 3 }, (_, index) => `p${index + 1}`);
  const result = validateCampaignDraft({
    ...validDraft,
    productIds,
  });

  assert.equal(result.productIds.length, MARKETING_PRODUCT_SELECTION_LIMIT);
  assert.equal(result.productIds.at(-1), `p${MARKETING_PRODUCT_SELECTION_LIMIT}`);
});

test("filterMarketingRecipients excludes admins, banned users, invalid emails, suppressions, and duplicates", () => {
  const recipients = filterMarketingRecipients(
    [
      { id: "u1", email: "SHOPPER@EXAMPLE.COM", name: "Shopper", role: "user", banned: false },
      { id: "u2", email: "admin@example.com", name: "Admin", role: "admin", banned: false },
      { id: "u3", email: "banned@example.com", name: "Banned", role: "user", banned: true },
      { id: "u4", email: "bad-email", name: "Bad", role: "user", banned: false },
      { id: "u5", email: "suppressed@example.com", name: "Suppressed", role: "user", banned: false },
      { id: "u6", email: "shopper@example.com", name: "Duplicate", role: "user", banned: false },
    ],
    new Set(["suppressed@example.com"])
  );

  assert.deepEqual(recipients, [
    { userId: "u1", email: "shopper@example.com", name: "Shopper" },
  ]);
});

test("chunkForResend splits payloads into Resend-sized batches", () => {
  const chunks = chunkForResend(Array.from({ length: 205 }, (_, index) => index));

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 100);
  assert.equal(chunks[1].length, 100);
  assert.equal(chunks[2].length, 5);
  assert.throws(() => chunkForResend([1], 101), /Batch size/);
});

test("unsubscribe tokens verify valid payloads and reject tampering", () => {
  const token = createUnsubscribeToken("Customer@Example.com", "test-secret");
  const verified = verifyUnsubscribeToken(token, "test-secret");

  assert.equal(verified?.email, "customer@example.com");
  assert.equal(verifyUnsubscribeToken(`${token}x`, "test-secret"), null);
});

test("campaign email template escapes admin text and includes unsubscribe link", () => {
  process.env.BETTER_AUTH_SECRET = "template-test-secret";
  const html = buildCampaignEmailHtml({
    draft: {
      ...validDraft,
      headline: "<DROP>",
      body: "Hello <script>alert(1)</script>",
    },
    recipient: { userId: "u1", email: "customer@example.com", name: "<Customer>" },
    products: [],
    appUrl: "https://xilar.in",
  });

  assert.match(html, /&lt;DROP&gt;/);
  assert.match(html, /Hello &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Hi &lt;Customer&gt;/);
  assert.match(html, /\/unsubscribe\/marketing\?token=/);
  assert.doesNotMatch(html, /<script>alert/);
});

test("campaign email template uses email-safe width and product image constraints", () => {
  process.env.BETTER_AUTH_SECRET = "template-test-secret";
  const html = buildCampaignEmailHtml({
    draft: validDraft,
    recipient: { userId: "u1", email: "customer@example.com", name: "Customer" },
    products: [
      {
        id: "p1",
        name: "Seoul Edge Polo",
        image: "https://xilar.in/product.jpg",
        sellingPrice: "1299",
        mrp: "1599",
      },
    ],
    appUrl: "https://xilar.in",
  });

  assert.match(html, /width="640"/);
  assert.match(html, /padding:34px/);
  assert.match(html, /width="240"/);
  assert.match(html, /height="300"/);
  assert.doesNotMatch(html, /display:grid/);
  assert.match(html, /\/about\/logo\.jpeg/);
});

test("campaign email template links featured products by product id", () => {
  process.env.BETTER_AUTH_SECRET = "template-test-secret";
  const html = buildCampaignEmailHtml({
    draft: validDraft,
    recipient: { userId: "u1", email: "customer@example.com", name: "Customer" },
    products: [
      {
        id: "b72305dc-5fc9-453b-b4dc-830d628c4fd8",
        name: "XILAR Dualform",
        image: "https://xilar.in/product.jpg",
        sellingPrice: "799",
        mrp: "999",
      },
    ],
    appUrl: "https://xilar.in",
  });

  assert.match(html, /https:\/\/xilar\.in\/product\/b72305dc-5fc9-453b-b4dc-830d628c4fd8/);
  assert.doesNotMatch(html, /https:\/\/xilar\.in\/product\/xilar-dualform/);
});

test("campaign email template renders up to twelve selected products", () => {
  process.env.BETTER_AUTH_SECRET = "template-test-secret";
  const html = buildCampaignEmailHtml({
    draft: validDraft,
    recipient: { userId: "u1", email: "customer@example.com", name: "Customer" },
    products: Array.from({ length: MARKETING_PRODUCT_SELECTION_LIMIT + 1 }, (_, index) => ({
      id: `p${index + 1}`,
      name: `Product ${index + 1}`,
      image: "https://xilar.in/product.jpg",
      sellingPrice: "799",
      mrp: "999",
    })),
    appUrl: "https://xilar.in",
  });

  assert.match(html, /https:\/\/xilar\.in\/product\/p12/);
  assert.doesNotMatch(html, /https:\/\/xilar\.in\/product\/p13/);
});

test("campaign email template normalizes Cloudinary product images to a consistent crop", () => {
  process.env.BETTER_AUTH_SECRET = "template-test-secret";
  const html = buildCampaignEmailHtml({
    draft: validDraft,
    recipient: { userId: "u1", email: "customer@example.com", name: "Customer" },
    products: [
      {
        id: "p1",
        name: "Seoul Edge Polo",
        image: "https://res.cloudinary.com/demo/image/upload/v123/product.jpg",
        sellingPrice: "1299",
        mrp: "1599",
      },
    ],
    appUrl: "https://xilar.in",
  });

  assert.match(html, /f_auto,q_auto,c_fill,g_auto,w_480,h_600/);
});
