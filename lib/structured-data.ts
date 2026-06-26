import {
  buildAbsoluteUrl,
  buildProductUrl,
  SEO_CONTACT,
  SEO_SHIPPING,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "./seo.ts";

const PRICE_VALID_UNTIL = "2026-12-31";

type CollectionProduct = {
  name: string;
  slug: string;
  image?: string | null;
  sellingPrice?: string | number | null;
};

export function organizationJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: SITE_NAME,
    alternateName: "XILAR The Future Wear",
    url: baseUrl,
    logo: buildAbsoluteUrl("/logo.jpeg", baseUrl),
    image: buildAbsoluteUrl("/logo.jpeg", baseUrl),
    description: SITE_DESCRIPTION,
    foundingDate: "2025",
    founder: [
      {
        "@type": "Person",
        name: "Aman Somvanshi",
        jobTitle: "Founder",
      },
      {
        "@type": "Person",
        "@id": "https://fateless.dev/#person",
        name: "Aditya Singh",
        jobTitle: "CTO",
        alternateName: ["fatelessdev", "fate1ess"],
        url: "https://fateless.dev",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: SEO_CONTACT.locality,
      addressRegion: SEO_CONTACT.region,
      addressCountry: SEO_CONTACT.country,
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SEO_CONTACT.phone,
      contactType: "customer service",
      email: SEO_CONTACT.email,
      availableLanguage: SEO_CONTACT.availableLanguage,
      areaServed: "IN",
    },
    sameAs: [],
  };
}

export function webSiteJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl,
    description: "Premium Indian streetwear for oversized tees, cargos, joggers, hoodies, and everyday drops.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: baseUrl,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  baseUrl: string,
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.url, baseUrl),
    })),
  };
}

export function collectionJsonLd(
  baseUrl: string,
  collection: {
    name: string;
    description: string;
    url: string;
    products?: CollectionProduct[];
  }
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: collection.description,
    url: buildAbsoluteUrl(collection.url, baseUrl),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: baseUrl,
    },
    ...(collection.products?.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            itemListElement: collection.products.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: product.name,
              url: buildProductUrl(product.slug, baseUrl),
              ...(product.image ? { image: buildAbsoluteUrl(product.image, baseUrl) } : {}),
              ...(product.sellingPrice
                ? {
                    offers: {
                      "@type": "Offer",
                      priceCurrency: SEO_SHIPPING.currency,
                      price: Number(product.sellingPrice).toFixed(2),
                    },
                  }
                : {}),
            })),
          },
        }
      : {}),
  };
}

export function productJsonLd(
  baseUrl: string,
  product: {
    name: string;
    description?: string | null;
    images?: string[] | null;
    sellingPrice: string;
    mrp: string;
    stock: number;
    id: string;
    slug: string;
    category: string;
    brand?: string;
    sizes?: string[] | null;
    colors?: { name: string; hex: string }[] | null;
    updatedAt?: Date | null;
  }
) {
  const price = parseFloat(product.sellingPrice);
  const mrp = parseFloat(product.mrp);
  const hasDiscount = mrp > price;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `Shop ${product.name} from XILAR.`,
    image: product.images?.length
      ? product.images.map((image) => buildAbsoluteUrl(image, baseUrl))
      : [buildAbsoluteUrl("/logo.jpeg", baseUrl)],
    brand: {
      "@type": "Brand",
      name: product.brand || SITE_NAME,
    },
    sku: product.id,
    mpn: product.slug,
    category: product.category,
    ...(product.updatedAt ? { releaseDate: product.updatedAt.toISOString() } : {}),
    ...(product.sizes?.length ? { size: product.sizes } : {}),
    ...(product.colors?.length ? { color: product.colors.map((c) => c.name) } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: SEO_SHIPPING.currency,
      price: price.toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: buildProductUrl(product.slug, baseUrl),
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: price >= SEO_SHIPPING.freeShippingThreshold ? "0" : String(SEO_SHIPPING.standardShippingFee),
          currency: SEO_SHIPPING.currency,
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: SEO_SHIPPING.country,
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: SEO_SHIPPING.country,
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 2,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
        url: buildAbsoluteUrl("/policies/returns", baseUrl),
      },
      ...(hasDiscount ? { priceValidUntil: PRICE_VALID_UNTIL } : {}),
    },
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
