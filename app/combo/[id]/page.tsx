import type { Metadata } from "next"
import { ComboClient } from "@/components/features/combo-client"
import { db } from "@/lib/db"
import { combos, products } from "@/lib/db/schema"
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

  const [productA, productB] = await db
    .select()
    .from(products)
    .where(
      and(
        inArray(products.id, [combo.productAId, combo.productBId]),
        eq(products.isActive, true)
      )
    )

  return { combo, productA, productB }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
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
  const priceA = parseFloat(productA.sellingPrice)
  const priceB = parseFloat(productB.sellingPrice)
  const totalPrice = priceA + priceB
  const description = `Shop ${productA.name} + ${productB.name} combo from XILAR. Bundle deal starting at ₹${totalPrice.toLocaleString("en-IN")}.`

  return {
    title: `${productA.name} + ${productB.name} Combo | XILAR`,
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
      <ComboClient id={id} />
    </>
  )
}
