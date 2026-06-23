import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getCatalogProducts } from "@/lib/product-catalog";
import {
  buildGeneralSearchPhrases,
  mergeMerchandisingSuggestionPool,
  type SearchSuggestionProductSource,
} from "@/lib/search-suggestions";

const PRODUCT_SUGGESTION_LIMIT = 3;
const TERM_SUGGESTION_LIMIT = 4;
const BUCKET_LIMIT = 12;
const MIN_PHRASE_MATCHES = 6;

export const dynamic = "force-dynamic";

const suggestionProductColumns = {
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
  isPremium: products.isPremium,
  stock: products.stock,
};

const phraseProductColumns = {
  id: products.id,
  name: products.name,
  category: products.category,
  gender: products.gender,
  tags: products.tags,
  fabric: products.fabric,
  features: products.features,
  colors: products.colors,
  isNew: products.isNew,
  isPremium: products.isPremium,
  displayOrder: products.displayOrder,
  stock: products.stock,
  searchText: products.searchText,
};

function getSeed(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return searchParams.get("seed")?.trim() || `${Date.now()}`;
}

async function getMerchandisingBucket(extraCondition: ReturnType<typeof eq>) {
  return db
    .select(suggestionProductColumns)
    .from(products)
    .where(and(eq(products.isActive, true), gt(products.stock, 0), extraCondition))
    .orderBy(desc(products.displayOrder), desc(products.createdAt))
    .limit(BUCKET_LIMIT);
}

async function getEmptyQueryProducts(seed: string) {
  const [premiumProducts, newProducts, displayOrderProducts] = await Promise.all([
    getMerchandisingBucket(eq(products.isPremium, true)),
    getMerchandisingBucket(eq(products.isNew, true)),
    db
      .select(suggestionProductColumns)
      .from(products)
      .where(and(eq(products.isActive, true), gt(products.stock, 0)))
      .orderBy(desc(products.displayOrder), desc(products.createdAt))
      .limit(BUCKET_LIMIT),
  ]);

  return mergeMerchandisingSuggestionPool({
    premiumProducts,
    newProducts,
    displayOrderProducts,
    seed,
    limit: PRODUCT_SUGGESTION_LIMIT,
  });
}

async function getPhraseProducts() {
  return db
    .select(phraseProductColumns)
    .from(products)
    .where(and(eq(products.isActive, true), gt(products.stock, 0)))
    .orderBy(desc(products.displayOrder), desc(products.createdAt));
}

function toPhraseSource(product: Awaited<ReturnType<typeof getPhraseProducts>>[number]): SearchSuggestionProductSource {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    gender: product.gender,
    tags: product.tags || [],
    fabric: product.fabric,
    features: product.features || [],
    colors: product.colors || [],
    isNew: product.isNew,
    isPremium: product.isPremium,
    displayOrder: product.displayOrder,
    stock: product.stock,
    searchText: product.searchText,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const seed = getSeed(req);
    const phraseProducts = (await getPhraseProducts()).map(toPhraseSource);
    const terms = buildGeneralSearchPhrases({
      products: phraseProducts,
      seed,
      limit: TERM_SUGGESTION_LIMIT,
      minMatches: MIN_PHRASE_MATCHES,
      query: query.length >= 2 ? query : undefined,
    });

    if (query.length < 2) {
      return NextResponse.json({
        products: await getEmptyQueryProducts(seed),
        terms,
      });
    }

    const result = await getCatalogProducts({
      search: query,
      limit: 12,
      offset: 0,
      includeTotal: false,
    });

    return NextResponse.json({
      products: result.products
        .filter((product) => product.stock > 0)
        .slice(0, PRODUCT_SUGGESTION_LIMIT),
      terms,
    });
  } catch (error) {
    console.error("Failed to fetch search suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch search suggestions" },
      { status: 500 },
    );
  }
}
