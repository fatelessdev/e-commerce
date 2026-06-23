"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { CatalogProduct } from "@/lib/product-catalog";
import { productMatchesGender } from "@/lib/catalog-filter";

export type { CatalogProduct };
export { productMatchesGender };

export type ProductPageResponse = {
  products: CatalogProduct[];
  total: number;
  limit: number;
  offset: number;
};

export type ShopCatalogQuery = {
  category?: string;
  gender?: "men" | "women" | "unisex";
  search?: string;
  size?: string;
  minPrice?: string;
  maxPrice?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  limit?: number;
};

export const SHOP_CATALOG_QUERY_KEY = ["shop-catalog"] as const;

function pageFromProducts(products?: CatalogProduct[]): ProductPageResponse | undefined {
  if (!products) return undefined;
  return {
    products,
    total: products.length,
    limit: products.length,
    offset: 0,
  };
}

async function fetchProductPage(query: ShopCatalogQuery, offset: number, limit: number) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && key !== "limit") {
      params.set(key, String(value));
    }
  });

  const response = await fetch(`/api/products?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch product catalog");
  return (await response.json()) as ProductPageResponse;
}

export function useShopCatalog(
  queryOrInitialData: ShopCatalogQuery | CatalogProduct[] = {},
  initialPage?: ProductPageResponse,
) {
  const legacyInitialProducts = Array.isArray(queryOrInitialData) ? queryOrInitialData : undefined;
  const query = Array.isArray(queryOrInitialData) ? {} : queryOrInitialData;
  const limit = query.limit ?? 24;
  const resolvedInitialPage = initialPage ?? pageFromProducts(legacyInitialProducts);

  return useInfiniteQuery({
    queryKey: [...SHOP_CATALOG_QUERY_KEY, query],
    queryFn: ({ pageParam }) => fetchProductPage(query, pageParam, limit),
    initialPageParam: 0,
    initialData: resolvedInitialPage
      ? { pages: [resolvedInitialPage], pageParams: [resolvedInitialPage.offset] }
      : undefined,
    getNextPageParam: (lastPage) => {
      const nextOffset = Number(lastPage.offset || 0) + Number(lastPage.limit || limit);
      return nextOffset < Number(lastPage.total || 0) ? nextOffset : undefined;
    },
    select: (data) => data.pages.flatMap((page) => page.products || []),
    staleTime: 1000 * 60 * 5,
  });
}

export function getDisplaySizes(product: Pick<CatalogProduct, "availableSizes" | "sizes" | "stock" | "category">) {
  if (product.category === "accessory") return [];
  if (product.stock <= 0) return [];
  return product.availableSizes?.length ? product.availableSizes : product.sizes || [];
}
