"use client";

import { useQuery } from "@tanstack/react-query";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  sellingPrice: string;
  mrp: string;
  maxBargainDiscount: string;
  images: string[];
  category: string;
  gender: "men" | "women" | "unisex";
  sizes: string[];
  availableSizes: string[];
  colors: { name: string; hex: string }[];
  isNew?: boolean;
  isFeatured?: boolean;
  stock: number;
};

type ProductPageResponse = {
  products: CatalogProduct[];
  total: number;
  limit: number;
  offset: number;
};

export const SHOP_CATALOG_QUERY_KEY = ["shop-catalog"] as const;

async function fetchShopCatalog() {
  const allProducts: CatalogProduct[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  const limit = 50;

  while (offset < total) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    const response = await fetch(`/api/products?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch product catalog");
    const data = (await response.json()) as ProductPageResponse;
    const products = data.products || [];

    allProducts.push(...products);
    total = Number(data.total || products.length);
    offset += Number(data.limit || limit);

    if (products.length === 0) break;
  }

  return allProducts;
}

export function useShopCatalog() {
  return useQuery({
    queryKey: SHOP_CATALOG_QUERY_KEY,
    queryFn: fetchShopCatalog,
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
