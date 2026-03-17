type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "XILAR",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      "Next-gen streetwear for the bold. Premium basics, oversized fits, and urban essentials.",
    foundingDate: "2025",
    founder: {
      "@type": "Person",
      name: "Aman Singh",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lucknow",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-8090644991",
      contactType: "customer service",
      email: "amansomvanshi29112003@gmail.com",
      availableLanguage: ["English", "Hindi"],
    },
    sameAs: [],
  };
}

export function webSiteJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "XILAR",
    url: baseUrl,
    description:
      "Premium streetwear for Gen-Z. Shop oversized tees, cargos, joggers, and essentials.",
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
      item: `${baseUrl}${item.url}`,
    })),
  };
}

export function collectionJsonLd(
  baseUrl: string,
  collection: {
    name: string;
    description: string;
    url: string;
  }
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: collection.description,
    url: `${baseUrl}${collection.url}`,
    isPartOf: {
      "@type": "WebSite",
      name: "XILAR",
      url: baseUrl,
    },
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
    category: string;
    brand?: string;
    sizes?: string[] | null;
    colors?: { name: string; hex: string }[] | null;
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
    image: product.images?.length ? product.images : [`${baseUrl}/logo.png`],
    brand: {
      "@type": "Brand",
      name: product.brand || "XILAR",
    },
    category: product.category,
    ...(product.sizes?.length && {
      size: product.sizes,
    }),
    ...(product.colors?.length && {
      color: product.colors.map((c) => c.name),
    }),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: price.toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${baseUrl}/product/${product.id}`,
      seller: {
        "@type": "Organization",
        name: "XILAR",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: price >= 999 ? "0" : "99",
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
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
      ...(hasDiscount && {
        priceValidUntil: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString().split("T")[0],
      }),
    },
  };
}

export function faqJsonLd(
  faqs: { question: string; answer: string }[]
) {
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
