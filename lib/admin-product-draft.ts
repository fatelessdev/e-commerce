import type { ProductInput } from "./admin-product-input.ts"

export const ADMIN_NEW_PRODUCT_DRAFT_STORAGE_KEY = "xilar-admin-new-product-draft"

const ADMIN_PRODUCT_DRAFT_VERSION = 1

export type NewProductFormData = {
  name: string
  slug: string
  description: string
  mrp: string
  sellingPrice: string
  maxBargainDiscount: string
  category: ProductInput["category"]
  gender: ProductInput["gender"]
  stock: number
  fabric: string
  gsm: number
  isNew: boolean
  isFeatured: boolean
  isPremium: boolean
  isActive: boolean
  displayOrder: number
}

export type AdminProductDraft = {
  formData: NewProductFormData
  images: string[]
  newImageUrl: string
  sizes: string[]
  careInstructions: string[]
  newCareInstruction: string
  features: string[]
  newFeature: string
  colors: { name: string; hex: string }[]
  newColor: { name: string; hex: string }
  tags: string[]
  newTag: string
  variantStock: Record<string, number>
}

type PersistedAdminProductDraft = {
  version: typeof ADMIN_PRODUCT_DRAFT_VERSION
  draft: AdminProductDraft
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isColor(value: unknown): value is { name: string; hex: string } {
  return isRecord(value) && typeof value.name === "string" && typeof value.hex === "string"
}

function isVariantStock(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((stock) => typeof stock === "number" && Number.isFinite(stock))
}

function isNewProductFormData(value: unknown): value is NewProductFormData {
  if (!isRecord(value)) return false

  return (
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.description === "string" &&
    typeof value.mrp === "string" &&
    typeof value.sellingPrice === "string" &&
    typeof value.maxBargainDiscount === "string" &&
    typeof value.category === "string" &&
    typeof value.gender === "string" &&
    typeof value.stock === "number" &&
    typeof value.fabric === "string" &&
    typeof value.gsm === "number" &&
    typeof value.isNew === "boolean" &&
    typeof value.isFeatured === "boolean" &&
    typeof value.isPremium === "boolean" &&
    typeof value.isActive === "boolean" &&
    typeof value.displayOrder === "number"
  )
}

function isAdminProductDraft(value: unknown): value is AdminProductDraft {
  if (!isRecord(value)) return false

  return (
    isNewProductFormData(value.formData) &&
    isStringArray(value.images) &&
    typeof value.newImageUrl === "string" &&
    isStringArray(value.sizes) &&
    isStringArray(value.careInstructions) &&
    typeof value.newCareInstruction === "string" &&
    isStringArray(value.features) &&
    typeof value.newFeature === "string" &&
    Array.isArray(value.colors) &&
    value.colors.every(isColor) &&
    isColor(value.newColor) &&
    isStringArray(value.tags) &&
    typeof value.newTag === "string" &&
    isVariantStock(value.variantStock)
  )
}

export function encodeAdminProductDraft(draft: AdminProductDraft) {
  return JSON.stringify({
    version: ADMIN_PRODUCT_DRAFT_VERSION,
    draft,
  } satisfies PersistedAdminProductDraft)
}

export function decodeAdminProductDraft(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown
    if (!isRecord(parsed) || parsed.version !== ADMIN_PRODUCT_DRAFT_VERSION) {
      return null
    }

    return isAdminProductDraft(parsed.draft) ? parsed.draft : null
  } catch {
    return null
  }
}
