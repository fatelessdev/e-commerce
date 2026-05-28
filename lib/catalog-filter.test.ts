import assert from "node:assert/strict";
import { test } from "node:test";
import { filterCatalogProducts } from "./catalog-filter.ts";
import type { CatalogProduct } from "./product-catalog.ts";

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  return {
    id: "product-id",
    name: "Product",
    slug: "product",
    sellingPrice: "999.00",
    mrp: "1299.00",
    maxBargainDiscount: "0",
    category: "tshirt",
    gender: "unisex",
    isNew: false,
    isFeatured: false,
    isPremium: false,
    stock: 10,
    images: [],
    sizes: ["S", "M"],
    colors: [],
    availableSizes: ["S", "M"],
    ...overrides,
  };
}

test("filterCatalogProducts returns only premium products when requested", () => {
  const products = [
    product({ id: "regular", isPremium: false }),
    product({ id: "premium", isPremium: true }),
  ];

  assert.deepEqual(
    filterCatalogProducts(products, { isPremium: true }).map((item) => item.id),
    ["premium"],
  );
});
