import type { Metadata } from "next"
import { ComboClient } from "@/components/features/combo-client"
import { getComboDetails } from "@/lib/combos"
import {
  JsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/structured-data"
import { normalizeSiteUrl } from "@/lib/seo"

export const dynamic = "force-dynamic"

async function getCombo(id: string) {
  return getComboDetails(id)
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
  const baseUrl = normalizeSiteUrl()

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
