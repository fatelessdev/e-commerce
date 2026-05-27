"use client";

import { useQuery } from "@tanstack/react-query";
import type { CatalogProduct } from "@/lib/product-catalog";

export type { CatalogProduct };

type ProductPageResponse = {
  products: CatalogProduct[];
  total: number;
  limit: number;
  offset: number;
};

export const SHOP_CATALOG_QUERY_KEY = ["shop-catalog"] as const;

async function fetchShopCatalog() {
  const limit = 50;
  const firstPage = await fetchProductPage(0, limit);
  const allProducts = [...(firstPage.products || [])];
  const total = Number(firstPage.total || allProducts.length);
  const remainingOffsets: number[] = [];

  for (let offset = Number(firstPage.limit || limit); offset < total; offset += limit) {
    remainingOffsets.push(offset);
  }

  const remainingPages = await Promise.all(remainingOffsets.map((offset) => fetchProductPage(offset, limit)));
  remainingPages.forEach((page) => allProducts.push(...(page.products || [])));

  return allProducts;
}

async function fetchProductPage(offset: number, limit: number) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const response = await fetch(`/api/products?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch product catalog");
  return (await response.json()) as ProductPageResponse;
}

export function useShopCatalog(initialData?: CatalogProduct[]) {
  return useQuery({
    queryKey: SHOP_CATALOG_QUERY_KEY,
    queryFn: fetchShopCatalog,
    initialData,
    enabled: initialData === undefined,
    staleTime: 1000 * 60 * 5,
  });
}

export function productMatchesGender(product: CatalogProduct, gender?: "men" | "women" | "unisex" | "all") {
  if (!gender || gender === "all") return true;
  return product.gender === gender || product.gender === "unisex";
}

export function getDisplaySizes(product: Pick<CatalogProduct, "availableSizes" | "sizes" | "stock" | "category">) {
  if (product.category === "accessory") return [];
  if (product.stock <= 0) return [];
  return product.availableSizes?.length ? product.availableSizes : product.sizes || [];
}
