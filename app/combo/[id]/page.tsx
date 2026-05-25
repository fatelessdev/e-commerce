import type { Metadata } from "next"
import { ComboClient } from "@/components/features/combo-client"
import { db } from "@/lib/db"
import { combos, products, productVariants } from "@/lib/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import {
  JsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/structured-data"

async function getCombo(id: string) {
  const [combo] = await db
    .select()
    .from(combos)
    .where(and(eq(combos.id, id), eq(combos.isActive, true)))

  if (!combo) return null

  const [comboProducts, variants] = await Promise.all([
    db
      .select()
      .from(products)
      .where(
        and(
          inArray(products.id, [combo.productAId, combo.productBId]),
          eq(products.isActive, true)
        )
      ),
    db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, [combo.productAId, combo.productBId])),
  ])

  // Keep correct product order according to combo table
  const productA = comboProducts.find(
    (product) => product.id === combo.productAId
  )

  const productB = comboProducts.find(
    (product) => product.id === combo.productBId
  )

  if (!productA || !productB) return null

  const variantsByProductId = variants.reduce<Map<string, typeof variants>>((acc, variant) => {
    const existing = acc.get(variant.productId) || []
    existing.push(variant)
    acc.set(variant.productId, existing)
    return acc
  }, new Map())

  return {
    ...combo,
    productA: {
      ...productA,
      images: productA.images || [],
      sizes: productA.sizes || [],
      colors: productA.colors || [],
      variants: variantsByProductId.get(productA.id) || [],
    },
    productB: {
      ...productB,
      images: productB.images || [],
      sizes: productB.sizes || [],
      colors: productB.colors || [],
      variants: variantsByProductId.get(productB.id) || [],
    },
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const result = await getCombo(id)

  if (!result) {
    return {
      title: "Combo Not Found",
      description: "This combo does not exist.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const { productA, productB } = result

  const priceA = Number(productA.sellingPrice)
  const priceB = Number(productB.sellingPrice)
  const totalPrice = priceA + priceB

  const title = `${productA.name} + ${productB.name} Combo | XILAR`

  const description = `Shop ${productA.name} + ${productB.name} combo from XILAR. Bundle deal starting at ₹${totalPrice.toLocaleString(
    "en-IN"
  )}.`

  return {
    title,
    description,
    alternates: {
      canonical: `/combo/${id}`,
    },
    openGraph: {
      title: `${productA.name} + ${productB.name} Combo — XILAR`,
      description,
      url: `/combo/${id}`,
    },
  }
}

export default async function ComboPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const combo = await getCombo(id)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(baseUrl, [
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
          { name: "Combo", url: `/combo/${id}` },
        ])}
      />

      <ComboClient id={id} initialCombo={combo ?? undefined} />
    </>
  )
}
