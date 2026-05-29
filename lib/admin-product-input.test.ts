import assert from "node:assert/strict"
import test from "node:test"
import {
  normalizeProductInput,
  normalizeProductPatch,
  type RawProductInput,
} from "./admin-product-input.ts"

const baseInput: RawProductInput = {
  name: " Golden Skyline Oversized Tee ",
  slug: " golden-skyline-oversized-tee ",
  description: "Premium cotton tee",
  mrp: "999",
  sellingPrice: "799",
  maxBargainDiscount: "50",
  category: "tshirt",
  gender: "men",
  stock: 1,
  fabric: "100% premium cotton ",
  images: [
    "https://res.cloudinary.com/du44kbibc/image/upload/v1780066847/xilar/products/eodf5t0wzpckgqasfuya.webp",
  ],
  sizes: ["M", "L", "XL", "XXL"],
  careInstructions: [],
  features: [],
  colors: [],
  tags: [],
  variants: [
    { size: "M", color: null, stock: 1 },
    { size: "L", color: null, stock: 0 },
  ],
  isNew: true,
  isFeatured: false,
  isPremium: false,
  isActive: true,
  displayOrder: 500,
}

test("normalizes server-action undefined sentinels before product insert", () => {
  const product = normalizeProductInput({
    ...baseInput,
    gsm: "$undefined",
  })

  assert.equal(product.name, "Golden Skyline Oversized Tee")
  assert.equal(product.slug, "golden-skyline-oversized-tee")
  assert.equal(product.gsm, null)
  assert.equal(product.stock, 1)
  assert.deepEqual(product.variants, [
    { size: "M", color: null, stock: 1 },
    { size: "L", color: null, stock: 0 },
  ])
})

test("normalizes accessory products to the single inventory bucket", () => {
  const product = normalizeProductInput({
    ...baseInput,
    category: "accessory",
    gender: "men",
    stock: "3",
    gsm: 260,
    fabric: "Leather",
    sizes: ["M"],
    colors: [{ name: "Black", hex: "#000000" }],
    careInstructions: ["wipe clean"],
    features: ["metal clasp"],
    variants: [{ size: "M", color: "Black", stock: 3 }],
  })

  assert.equal(product.gender, "unisex")
  assert.equal(product.gsm, null)
  assert.equal(product.fabric, null)
  assert.deepEqual(product.sizes, ["One Size"])
  assert.deepEqual(product.colors, [])
  assert.deepEqual(product.careInstructions, [])
  assert.deepEqual(product.features, [])
  assert.deepEqual(product.variants, [{ size: "One Size", color: null, stock: 3 }])
})

test("rejects invalid product numerics at the action boundary", () => {
  assert.throws(
    () => normalizeProductInput({ ...baseInput, mrp: "not-a-price" }),
    /MRP must be a valid amount/
  )
  assert.throws(
    () => normalizeProductInput({ ...baseInput, variants: [{ size: "M", color: null, stock: -1 }] }),
    /Variant stock cannot be negative/
  )
})

test("normalizes partial product updates without forcing missing fields", () => {
  assert.deepEqual(normalizeProductPatch({ gsm: "$undefined", fabric: "" }), {
    gsm: null,
    fabric: null,
  })
})

test("normalizes accessory patches without inventing zero-stock variants", () => {
  assert.deepEqual(normalizeProductPatch({ category: "accessory" }), {
    category: "accessory",
    gender: "unisex",
    fabric: null,
    gsm: null,
    sizes: ["One Size"],
    colors: [],
    careInstructions: [],
    features: [],
  })
})
