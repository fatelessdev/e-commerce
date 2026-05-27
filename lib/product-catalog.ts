import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { and, desc, eq, gt, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export type CatalogProduct = Pick<
  typeof products.$inferSelect,
  | "id"
  | "name"
  | "slug"
  | "sellingPrice"
  | "mrp"
  | "maxBargainDiscount"
  | "category"
  | "gender"
  | "isNew"
  | "isFeatured"
  | "stock"
> & {
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string; images?: string[] }[];
  availableSizes: string[];
};

type CatalogProductRow = Omit<CatalogProduct, "images" | "sizes" | "colors" | "availableSizes"> & {
  images: string[] | null;
  sizes: string[] | null;
  colors: { name: string; hex: string; images?: string[] }[] | null;
};

type CatalogQuery = {
  category?: string | null;
  gender?: string | null;
  search?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  isNew?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
  includeTotal?: boolean;
};

const catalogProductColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  sellingPrice: products.sellingPrice,
  mrp: products.mrp,
  maxBargainDiscount: products.maxBargainDiscount,
  images: products.images,
  category: products.category,
  gender: products.gender,
  sizes: products.sizes,
  colors: products.colors,
  isNew: products.isNew,
  isFeatured: products.isFeatured,
  stock: products.stock,
};

function buildCatalogConditions(query: CatalogQuery) {
  const conditions = [eq(products.isActive, true)];

  if (query.category) {
    conditions.push(eq(products.category, query.category as typeof products.category.enumValues[number]));
  }

  if (query.gender) {
    conditions.push(
      or(
        eq(products.gender, query.gender as typeof products.gender.enumValues[number]),
        eq(products.gender, "unisex")
      )!
    );
  }

  if (query.search) {
    conditions.push(or(ilike(products.name, `%${query.search}%`), ilike(products.description, `%${query.search}%`))!);
  }

  if (query.minPrice) {
    conditions.push(gte(products.sellingPrice, query.minPrice));
  }

  if (query.maxPrice) {
    conditions.push(lte(products.sellingPrice, query.maxPrice));
  }

  if (query.isNew) {
    conditions.push(eq(products.isNew, true));
  }

  if (query.isFeatured) {
    conditions.push(eq(products.isFeatured, true));
  }

  return and(...conditions);
}

async function addAvailableSizes(productRows: CatalogProductRow[]): Promise<CatalogProduct[]> {
  const productIds = productRows.map((product) => product.id);
  const availableVariantRows = productIds.length > 0
    ? await db
        .select({
          productId: productVariants.productId,
          size: productVariants.size,
        })
        .from(productVariants)
        .where(and(inArray(productVariants.productId, productIds), gt(productVariants.stock, 0)))
    : [];

  const availableSizesByProductId = availableVariantRows.reduce<Map<string, Set<string>>>((acc, variant) => {
    const sizes = acc.get(variant.productId) || new Set<string>();
    sizes.add(variant.size);
    acc.set(variant.productId, sizes);
    return acc;
  }, new Map());

  return productRows.map((product) => {
    const availableSizes = Array.from(availableSizesByProductId.get(product.id) || []);
    return {
      ...product,
      images: product.images || [],
      sizes: product.sizes || [],
      colors: product.colors || [],
      availableSizes: availableSizes.length > 0
        ? availableSizes
        : product.stock > 0
          ? product.sizes || []
          : [],
    };
  });
}

export async function getCatalogProducts(query: CatalogQuery = {}) {
  "use cache";

  cacheLife("hours");
  cacheTag(CACHE_TAGS.catalog);
  cacheTag(CACHE_TAGS.products);

  const where = buildCatalogConditions(query);
  const productQuery = db
    .select(catalogProductColumns)
    .from(products)
    .where(where)
    .orderBy(desc(products.displayOrder), desc(products.createdAt));

  const productRowsPromise: Promise<CatalogProductRow[]> = (
    query.limit === undefined
      ? productQuery
      : productQuery.limit(query.limit).offset(query.offset || 0)
  ).then((rows) => rows as CatalogProductRow[]);

  const [productRows, countRows] = await Promise.all([
    productRowsPromise,
    query.includeTotal
      ? db.select({ count: sql<number>`count(*)` }).from(products).where(where)
      : Promise.resolve([{ count: 0 }]),
  ]);

  const productsWithAvailableSizes = await addAvailableSizes(productRows);

  return {
    products: productsWithAvailableSizes,
    total: query.includeTotal ? Number(countRows[0]?.count || 0) : productsWithAvailableSizes.length,
    limit: query.limit,
    offset: query.offset || 0,
  };
}

export async function getActiveProductIds() {
  "use cache";

  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  return db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.displayOrder), desc(products.createdAt));
}
