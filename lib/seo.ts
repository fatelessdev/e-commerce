import { CONTACT_EMAIL, CONTACT_PHONE, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "./constants.ts";

export const SITE_NAME = "XILAR";
export const SITE_BRAND_LINE = "The Future Wear";
export const DEFAULT_SITE_URL = "https://xilar.in";
export const DEFAULT_OG_IMAGE = "/logo.jpeg";

export const SITE_DESCRIPTION =
  "XILAR is an online Indian streetwear brand from Lucknow, built for premium oversized fits, bold basics, and Gen-Z everyday wear.";

export const SEO_CONTACT = {
  email: CONTACT_EMAIL,
  phone: CONTACT_PHONE,
  locality: "Lucknow",
  region: "Uttar Pradesh",
  country: "IN",
  availableLanguage: ["English", "Hindi"],
};

export const SEO_SHIPPING = {
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  standardShippingFee: SHIPPING_FEE,
  currency: "INR",
  country: "IN",
};

export function normalizeSiteUrl(baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL) {
  return baseUrl.replace(/\/+$/, "");
}

export function buildAbsoluteUrl(path: string, baseUrl?: string) {
  const normalizedBase = normalizeSiteUrl(baseUrl);
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${normalizedBase}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildProductPath(slug: string) {
  return `/product/${slug}`;
}

export function buildProductUrl(slug: string, baseUrl?: string) {
  return buildAbsoluteUrl(buildProductPath(slug), baseUrl);
}

export function isProductUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const CATALOG_NOINDEX_PARAMS = new Set([
  "search",
  "size",
  "minPrice",
  "maxPrice",
  "isNew",
  "isFeatured",
  "isPremium",
]);

export function shouldNoindexCatalogQuery(searchParams: URLSearchParams) {
  for (const key of searchParams.keys()) {
    if (CATALOG_NOINDEX_PARAMS.has(key)) return true;
  }
  return false;
}

export type ProductCategory =
  | "tshirt"
  | "cargo"
  | "jogger"
  | "shirt"
  | "jeans"
  | "hoodie"
  | "jacket"
  | "shorts"
  | "accessory";

export type CategorySeo = {
  slug: string;
  category: ProductCategory;
  label: string;
  title: string;
  h1: string;
  subtitle: string;
  description: string;
  intro: string;
  faq: { question: string; answer: string }[];
};

export const CATEGORY_SEO: CategorySeo[] = [
  {
    slug: "tshirts",
    category: "tshirt",
    label: "T-Shirts",
    title: "Oversized T-Shirts",
    h1: "Oversized T-Shirts",
    subtitle: "Heavyweight tees, clean drops, and Indian streetwear proportions.",
    description:
      "Shop XILAR oversized t-shirts for men, women, and unisex streetwear. Premium cotton-led basics, bold graphics, and relaxed Indian fits.",
    intro:
      "XILAR t-shirts focus on relaxed shoulders, clean everyday styling, and drops that work across cargos, jeans, and shorts.",
    faq: [
      {
        question: "Are XILAR t-shirts oversized?",
        answer:
          "Most XILAR tees are designed with a relaxed streetwear fit. Check each product page for the available sizes and fit notes before ordering.",
      },
      {
        question: "Does XILAR ship t-shirts across India?",
        answer:
          "Yes. XILAR ships across India, with free shipping available above the sitewide order threshold.",
      },
    ],
  },
  {
    slug: "shirts",
    category: "shirt",
    label: "Shirts",
    title: "Streetwear Shirts",
    h1: "Streetwear Shirts",
    subtitle: "Structured layers for clean streetwear looks.",
    description:
      "Shop XILAR shirts made for layered Indian streetwear outfits, clean silhouettes, and daily styling.",
    intro:
      "XILAR shirts are built as sharp layers: easy over tees, strong with cargos, and simple enough for repeat wear.",
    faq: [
      {
        question: "How should I style XILAR shirts?",
        answer:
          "Wear them open over an oversized tee or buttoned with cargos and jeans for a cleaner streetwear profile.",
      },
    ],
  },
  {
    slug: "cargos",
    category: "cargo",
    label: "Cargos",
    title: "Cargo Pants",
    h1: "Cargo Pants",
    subtitle: "Utility pockets, relaxed structure, and street-ready movement.",
    description:
      "Shop XILAR cargo pants for Indian streetwear outfits. Relaxed fits, utility details, and bold everyday styling.",
    intro:
      "XILAR cargos anchor oversized tees and hoodies with practical pockets, wider proportions, and a strong streetwear base.",
    faq: [
      {
        question: "Are XILAR cargos good for daily wear?",
        answer:
          "Yes. XILAR cargos are selected for streetwear styling and everyday movement, with product pages showing available waist sizes and stock.",
      },
    ],
  },
  {
    slug: "joggers",
    category: "jogger",
    label: "Joggers",
    title: "Streetwear Joggers",
    h1: "Streetwear Joggers",
    subtitle: "Easy movement with a cleaner streetwear finish.",
    description:
      "Shop XILAR joggers for relaxed streetwear fits, daily comfort, and clean Indian casual styling.",
    intro:
      "XILAR joggers keep the outfit mobile without drifting into gymwear: relaxed, direct, and made to pair with oversized tops.",
    faq: [
      {
        question: "What can I wear with XILAR joggers?",
        answer:
          "Pair XILAR joggers with oversized t-shirts, hoodies, or structured shirts for a balanced streetwear outfit.",
      },
    ],
  },
  {
    slug: "jeans",
    category: "jeans",
    label: "Jeans",
    title: "Streetwear Jeans",
    h1: "Streetwear Jeans",
    subtitle: "Denim silhouettes for oversized fits and everyday drops.",
    description:
      "Shop XILAR jeans for streetwear outfits, relaxed proportions, and versatile Indian everyday styling.",
    intro:
      "XILAR jeans are chosen to support oversized tees and layered tops with denim that feels grounded, not overworked.",
    faq: [
      {
        question: "Are XILAR jeans for men or women?",
        answer:
          "XILAR jeans may be listed for men, women, or unisex styling depending on the product. Use the product page sizing before checkout.",
      },
    ],
  },
  {
    slug: "hoodies",
    category: "hoodie",
    label: "Hoodies",
    title: "Streetwear Hoodies",
    h1: "Streetwear Hoodies",
    subtitle: "Layered comfort for colder drops and late-night fits.",
    description:
      "Shop XILAR hoodies for premium streetwear layering, relaxed silhouettes, and bold everyday comfort.",
    intro:
      "XILAR hoodies lean into strong proportions, clean branding, and easy layering over tees or under jackets.",
    faq: [
      {
        question: "Are XILAR hoodies limited drops?",
        answer:
          "Some XILAR hoodies may be limited-run products. Current stock and available sizes are shown on each product page.",
      },
    ],
  },
  {
    slug: "jackets",
    category: "jacket",
    label: "Jackets",
    title: "Streetwear Jackets",
    h1: "Streetwear Jackets",
    subtitle: "Outer layers with street presence and clean utility.",
    description:
      "Shop XILAR jackets for Indian streetwear layering, bold silhouettes, and premium casual outfits.",
    intro:
      "XILAR jackets are the outer layer for colder edits, travel days, and heavier streetwear looks.",
    faq: [
      {
        question: "How do XILAR jackets fit?",
        answer:
          "Fit depends on the individual jacket. Product pages show available sizes and images so you can choose the right proportion.",
      },
    ],
  },
  {
    slug: "shorts",
    category: "shorts",
    label: "Shorts",
    title: "Streetwear Shorts",
    h1: "Streetwear Shorts",
    subtitle: "Warm-weather fits with relaxed movement.",
    description:
      "Shop XILAR shorts for summer streetwear, relaxed Indian fits, and easy everyday styling.",
    intro:
      "XILAR shorts are built for heat, movement, and simple pairing with oversized t-shirts or open shirts.",
    faq: [
      {
        question: "Are XILAR shorts part of summer drops?",
        answer:
          "Shorts often appear in warm-weather edits and seasonal drops. The live catalog shows current availability.",
      },
    ],
  },
  {
    slug: "accessories",
    category: "accessory",
    label: "Accessories",
    title: "Streetwear Accessories",
    h1: "Streetwear Accessories",
    subtitle: "Perfume and finishing pieces for the XILAR wardrobe.",
    description:
      "Shop XILAR accessories, including perfume and selected essentials for Indian streetwear outfits.",
    intro:
      "XILAR accessories are kept focused: finishing pieces, perfume, and small essentials that support the outfit instead of cluttering it.",
    faq: [
      {
        question: "What accessories does XILAR sell?",
        answer:
          "XILAR accessories include perfume and selected essentials. The category page reflects the currently active catalog.",
      },
    ],
  },
];

export function getCategorySeoBySlug(slug: string) {
  return CATEGORY_SEO.find((item) => item.slug === slug) ?? null;
}

export function getCategorySeoByCategory(category: string) {
  return CATEGORY_SEO.find((item) => item.category === category) ?? null;
}

export function productTypeLabel(category: string) {
  return getCategorySeoByCategory(category)?.label ?? category;
}
