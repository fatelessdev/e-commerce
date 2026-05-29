const PRODUCT_CATEGORIES = [
  "tshirt",
  "cargo",
  "jogger",
  "shirt",
  "jeans",
  "hoodie",
  "jacket",
  "shorts",
  "accessory",
] as const

const PRODUCT_GENDERS = ["men", "women", "unisex"] as const

export const ACCESSORY_SIZE = "One Size"

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]
export type ProductGender = (typeof PRODUCT_GENDERS)[number]

export type ProductVariantInput = {
  size: string
  color: string | null
  stock: number
}

export type ProductColorInput = {
  name: string
  hex: string
  images?: string[]
}

export type ProductInput = {
  name: string
  slug: string
  description?: string | null
  mrp: string
  sellingPrice: string
  maxBargainDiscount?: string
  category: ProductCategory
  gender: ProductGender
  tags?: string[]
  stock: number
  images?: string[]
  fabric?: string | null
  gsm?: number | null
  careInstructions?: string[]
  features?: string[]
  sizes?: string[]
  colors?: ProductColorInput[]
  variants?: ProductVariantInput[]
  isNew?: boolean
  isFeatured?: boolean
  isPremium?: boolean
  isActive?: boolean
  displayOrder?: number
}

export type RawProductInput = Omit<Partial<ProductInput>, "colors" | "variants"> & {
  category?: unknown
  gender?: unknown
  stock?: unknown
  gsm?: unknown
  displayOrder?: unknown
  colors?: unknown
  variants?: unknown
}

function isUnset(value: unknown) {
  return value === undefined || value === null || value === "$undefined"
}

function textOrNull(value: unknown) {
  if (isUnset(value)) return null
  if (typeof value !== "string") return String(value)
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function requiredText(value: unknown, label: string) {
  const text = textOrNull(value)
  if (!text) throw new Error(`${label} is required`)
  return text
}

function normalizeStringArray(value: unknown, label: string) {
  if (isUnset(value)) return []
  if (!Array.isArray(value)) throw new Error(`${label} must be a list`)
  return value.map((item) => requiredText(item, label)).filter(Boolean)
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

function normalizeNonNegativeInt(value: unknown, label: string, fallback = 0) {
  if (isUnset(value) || value === "") return fallback
  const number = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(number)) throw new Error(`${label} must be a whole number`)
  if (number < 0) throw new Error(`${label} cannot be negative`)
  return number
}

function normalizeOptionalInt(value: unknown, label: string) {
  if (isUnset(value) || value === "") return null
  return normalizeNonNegativeInt(value, label)
}

function normalizeAmount(value: unknown, label: string, fallback?: string) {
  if (isUnset(value) || value === "") {
    if (fallback !== undefined) return fallback
    throw new Error(`${label} is required`)
  }

  const text = String(value).trim()
  const number = Number(text)
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${label} must be a valid amount`)
  }

  return text
}

function normalizeCategory(value: unknown) {
  if (!PRODUCT_CATEGORIES.includes(value as ProductCategory)) {
    throw new Error("Category is invalid")
  }
  return value as ProductCategory
}

function normalizeGender(value: unknown) {
  if (!PRODUCT_GENDERS.includes(value as ProductGender)) {
    throw new Error("Gender is invalid")
  }
  return value as ProductGender
}

function normalizeColors(value: unknown) {
  if (isUnset(value)) return []
  if (!Array.isArray(value)) throw new Error("Colors must be a list")

  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Color is invalid")
    const color = item as Record<string, unknown>
    return {
      name: requiredText(color.name, "Color name"),
      hex: requiredText(color.hex, "Color hex"),
      images: normalizeStringArray(color.images, "Color images"),
    }
  })
}

function normalizeVariants(value: unknown) {
  if (isUnset(value)) return []
  if (!Array.isArray(value)) throw new Error("Variants must be a list")

  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("Variant is invalid")
    const variant = item as Record<string, unknown>
    return {
      size: requiredText(variant.size, "Variant size"),
      color: textOrNull(variant.color),
      stock: normalizeNonNegativeInt(variant.stock, "Variant stock"),
    }
  })
}

function normalizeCommonProductInput(input: RawProductInput, partial: boolean) {
  const normalized: Partial<ProductInput> = {}

  if (!partial || "name" in input) normalized.name = requiredText(input.name, "Product name")
  if (!partial || "slug" in input) normalized.slug = requiredText(input.slug, "Product slug")
  if ("description" in input) normalized.description = textOrNull(input.description)
  if (!partial || "mrp" in input) normalized.mrp = normalizeAmount(input.mrp, "MRP")
  if (!partial || "sellingPrice" in input) {
    normalized.sellingPrice = normalizeAmount(input.sellingPrice, "Selling price")
  }
  if ("maxBargainDiscount" in input) {
    normalized.maxBargainDiscount = normalizeAmount(input.maxBargainDiscount, "Max bargain discount", "0")
  } else if (!partial) {
    normalized.maxBargainDiscount = "0"
  }
  if (!partial || "category" in input) normalized.category = normalizeCategory(input.category)
  if (!partial || "gender" in input) normalized.gender = normalizeGender(input.gender)
  if ("tags" in input) normalized.tags = normalizeStringArray(input.tags, "Tags")
  if (!partial || "stock" in input) normalized.stock = normalizeNonNegativeInt(input.stock, "Stock")
  if ("images" in input) normalized.images = normalizeStringArray(input.images, "Images")
  if ("fabric" in input) normalized.fabric = textOrNull(input.fabric)
  if ("gsm" in input) normalized.gsm = normalizeOptionalInt(input.gsm, "GSM")
  if ("careInstructions" in input) {
    normalized.careInstructions = normalizeStringArray(input.careInstructions, "Care instructions")
  }
  if ("features" in input) normalized.features = normalizeStringArray(input.features, "Features")
  if ("sizes" in input) normalized.sizes = normalizeStringArray(input.sizes, "Sizes")
  if ("colors" in input) normalized.colors = normalizeColors(input.colors)
  if ("variants" in input) normalized.variants = normalizeVariants(input.variants)
  if ("isNew" in input) normalized.isNew = normalizeBoolean(input.isNew, false)
  if ("isFeatured" in input) normalized.isFeatured = normalizeBoolean(input.isFeatured, false)
  if ("isPremium" in input) normalized.isPremium = normalizeBoolean(input.isPremium, false)
  if ("isActive" in input) normalized.isActive = normalizeBoolean(input.isActive, true)
  if ("displayOrder" in input) {
    normalized.displayOrder = normalizeNonNegativeInt(input.displayOrder, "Display order")
  }

  return normalized
}

function applyAccessoryDefaults<T extends Partial<ProductInput>>(input: T): T {
  const stock = input.variants?.[0]?.stock ?? input.stock ?? 0

  return {
    ...input,
    gender: "unisex",
    fabric: null,
    gsm: null,
    sizes: [ACCESSORY_SIZE],
    colors: [],
    careInstructions: [],
    features: [],
    variants: [{ size: ACCESSORY_SIZE, color: null, stock }],
  }
}

function applyAccessoryPatchDefaults<T extends Partial<ProductInput>>(input: T): T {
  const stock = input.variants?.[0]?.stock ?? input.stock

  return {
    ...input,
    gender: "unisex",
    fabric: null,
    gsm: null,
    sizes: [ACCESSORY_SIZE],
    colors: [],
    careInstructions: [],
    features: [],
    ...(stock === undefined ? {} : { variants: [{ size: ACCESSORY_SIZE, color: null, stock }] }),
  }
}

export function normalizeProductInput(input: RawProductInput): ProductInput {
  const normalized = normalizeCommonProductInput(input, false) as ProductInput
  const withDefaults: ProductInput = {
    ...normalized,
    tags: normalized.tags ?? [],
    images: normalized.images ?? [],
    fabric: normalized.fabric ?? null,
    gsm: normalized.gsm ?? null,
    careInstructions: normalized.careInstructions ?? [],
    features: normalized.features ?? [],
    sizes: normalized.sizes?.length ? normalized.sizes : ["S", "M", "L", "XL"],
    colors: normalized.colors ?? [],
    variants: normalized.variants ?? [],
    isNew: normalized.isNew ?? false,
    isFeatured: normalized.isFeatured ?? false,
    isPremium: normalized.isPremium ?? false,
    isActive: normalized.isActive ?? true,
    displayOrder: normalized.displayOrder ?? 0,
  }

  if (withDefaults.category === "accessory") {
    return applyAccessoryDefaults(withDefaults)
  }

  if (!withDefaults.sizes || withDefaults.sizes.length === 0) {
    throw new Error("At least one size is required")
  }

  return withDefaults
}

export function normalizeProductPatch(input: RawProductInput): Partial<ProductInput> {
  const normalized = normalizeCommonProductInput(input, true)

  if (normalized.category === "accessory") {
    return applyAccessoryPatchDefaults(normalized)
  }

  return normalized
}
