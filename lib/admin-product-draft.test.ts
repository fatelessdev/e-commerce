import assert from "node:assert/strict"
import test from "node:test"
import {
  decodeAdminProductDraft,
  encodeAdminProductDraft,
  type AdminProductDraft,
} from "./admin-product-draft.ts"

const draft: AdminProductDraft = {
  formData: {
    name: "Golden Skyline Oversized Tee",
    slug: "golden-skyline-oversized-tee",
    description: "Premium cotton tee",
    mrp: "999",
    sellingPrice: "799",
    maxBargainDiscount: "50",
    category: "tshirt",
    gender: "men",
    stock: 0,
    fabric: "100% premium cotton",
    gsm: 260,
    isNew: true,
    isFeatured: false,
    isPremium: false,
    isActive: true,
    displayOrder: 500,
  },
  images: ["https://res.cloudinary.com/demo/image/upload/xilar/products/tee.webp"],
  newImageUrl: "https://example.com/alternate.webp",
  sizes: ["M", "L", "XL"],
  careInstructions: ["Machine wash cold"],
  newCareInstruction: "Dry inside out",
  features: ["Oversized fit"],
  newFeature: "Heavyweight fabric",
  colors: [{ name: "Black", hex: "#000000" }],
  newColor: { name: "Cream", hex: "#fff4df" },
  tags: ["new"],
  newTag: "streetwear",
  variantStock: { "M|Black": 1, "L|Black": 0 },
}

test("round-trips a new product draft through the persisted payload", () => {
  assert.deepEqual(decodeAdminProductDraft(encodeAdminProductDraft(draft)), draft)
})

test("rejects stale or invalid new product draft payloads", () => {
  assert.equal(decodeAdminProductDraft("not-json"), null)
  assert.equal(decodeAdminProductDraft(JSON.stringify({ version: 0, draft })), null)
  assert.equal(decodeAdminProductDraft(JSON.stringify({ version: 1, draft: null })), null)
})
