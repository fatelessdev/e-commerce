import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopClient } from "@/components/features/shop-client";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/structured-data";
import { getCatalogProducts } from "@/lib/product-catalog";
import { CATEGORY_SEO, getCategorySeoBySlug, normalizeSiteUrl } from "@/lib/seo";

type Props = {
  params: Promise<{ category: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_SEO.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const seo = getCategorySeoBySlug(category);

  if (!seo) {
    return {
      title: "Category Not Found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `/shop/${seo.slug}`,
    },
    openGraph: {
      title: `${seo.title} | XILAR`,
      description: seo.description,
      url: `/shop/${seo.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const seo = getCategorySeoBySlug(category);

  if (!seo) notFound();

  const baseUrl = normalizeSiteUrl();
  const catalogPromise = getCatalogProducts({
    category: seo.category,
    limit: 24,
    offset: 0,
    includeTotal: true,
  });

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(baseUrl, [
          { name: "Home", url: "/" },
          { name: "Shop", url: "/shop" },
          { name: seo.label, url: `/shop/${seo.slug}` },
        ])}
      />
      <JsonLd data={faqJsonLd(seo.faq)} />
      <ShopClient
        genderFilter="all"
        fixedCategory={seo.category}
        title={seo.h1}
        subtitle={seo.subtitle}
        initialCatalogPromise={catalogPromise}
      />
      <section className="border-t border-border/60 px-6 py-12 md:px-12 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            XILAR category note
          </p>
          <div className="space-y-6">
            <p className="text-base leading-8 text-muted-foreground">{seo.intro}</p>
            <div className="grid gap-5">
              {seo.faq.map((item) => (
                <article key={item.question} className="border-t border-border/60 pt-5">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">{item.question}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
