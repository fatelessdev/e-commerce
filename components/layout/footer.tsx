import Link from "next/link";
import { ArrowRight, Instagram, Mail, Phone } from "lucide-react";
import { PixelatedText } from "@/components/effects/pixelated-text";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";

const COPYRIGHT_YEAR = 2026;

const shopLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/shop/men", label: "Men" },
  { href: "/shop/women", label: "Women" },
  { href: "/shop/accessories", label: "Accessories" },
  { href: "/new", label: "New Drop" },
  { href: "/collections/premium", label: "Premium" },
  { href: "/gallery", label: "Gallery" },
];

const accountLinks = [
  { href: "/about", label: "About" },
  { href: "/account", label: "Account" },
  { href: "/orders", label: "Orders" },
  { href: "/wishlist", label: "Wishlist" },
];

const policyLinks = [
  { href: "/policies", label: "Policies" },
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/exchange", label: "Exchange" },
  { href: "/policies/returns", label: "Returns" },
  { href: "/policies/refunds", label: "Refunds" },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center justify-between gap-2 border-b border-border/70 py-2 text-sm font-light leading-tight text-muted-foreground transition-colors duration-500 hover:text-foreground sm:text-base md:gap-3 md:py-3 md:text-lg"
    >
      <span className="min-w-0">{label}</span>
      <ArrowRight className="hidden h-4 w-4 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 sm:block" />
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="relative min-h-screen overflow-hidden border-t border-border/60 bg-background text-foreground">
      <div className="flex min-h-screen flex-col px-6 py-12 md:px-12 lg:px-16">
        <div className="grid flex-1 gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(32rem,0.9fr)] lg:gap-14">
          <div className="flex min-w-0 flex-col justify-between gap-12">
            <div>
              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                The Future Wear
              </p>
              <PixelatedText
                text="XILAR"
                className="h-[clamp(8rem,24vw,22rem)] max-w-5xl"
                align="left"
                textClassName="text-left"
              />
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <a
                className="group inline-flex h-16 w-16 items-center justify-center rounded-full border border-border transition-colors duration-300 hover:border-foreground/35 hover:text-foreground"
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label={`Email ${CONTACT_EMAIL}`}
              >
                <Mail className="h-7 w-7" />
              </a>
              <a
                className="group inline-flex h-16 w-16 items-center justify-center rounded-full border border-border transition-colors duration-300 hover:border-foreground/35 hover:text-foreground"
                href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
                aria-label={`Call ${CONTACT_PHONE}`}
              >
                <Phone className="h-7 w-7" />
              </a>
              <a
                className="group inline-flex h-16 w-16 items-center justify-center rounded-full border border-border transition-colors duration-300 hover:border-foreground/35 hover:text-foreground"
                href="https://www.instagram.com/"
                rel="noreferrer"
                target="_blank"
                aria-label="Instagram"
              >
                <Instagram className="h-7 w-7" />
              </a>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-3 gap-4 md:gap-6">
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Shop</p>
              <div>
                {shopLinks.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Company</p>
              <div>
                {accountLinks.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Care</p>
              <div>
                {policyLinks.map((link) => (
                  <FooterLink key={link.href} {...link} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border/70 pt-8">
          <div className="grid gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:flex sm:items-center sm:justify-between">
            <p>&copy; {COPYRIGHT_YEAR} XILAR. All rights reserved.</p>
            <div className="flex items-center justify-between gap-5 sm:contents">
              <p>Lucknow, India</p>
              <Link href="/gallery" className="transition-colors duration-300 hover:text-foreground">
                Open Gallery
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
