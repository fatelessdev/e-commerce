import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getPublicComboMutationPaths,
  getPublicProductMutationPaths,
} from "./public-cache.ts";

test("product mutations invalidate storefront catalog and slug pages", () => {
  assert.deepEqual(
    getPublicProductMutationPaths({
      nextSlug: "new-drop-tee",
      previousSlug: "old-drop-tee",
    }),
    [
      "/",
      "/shop",
      "/shop/men",
      "/shop/women",
      "/shop/accessories",
      "/new",
      "/collections/premium",
      "/collections/summer-26",
      "/gallery",
      "/sitemap.xml",
      "/feeds/google-merchant.xml",
      "/product/new-drop-tee",
      "/product/old-drop-tee",
    ],
  );
});

test("product mutation paths are deduped when the slug is unchanged", () => {
  assert.deepEqual(
    getPublicProductMutationPaths({
      nextSlug: "same-drop",
      previousSlug: "same-drop",
    }).filter((path) => path === "/product/same-drop"),
    ["/product/same-drop"],
  );
});

test("combo mutations invalidate public combo and merchandising paths", () => {
  assert.deepEqual(getPublicComboMutationPaths("combo-1"), [
    "/",
    "/shop/men",
    "/shop/women",
    "/combo/combo-1",
  ]);
});
