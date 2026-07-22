import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Instrument_Serif, Outfit } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/app/navbar";
import { FooterGate } from "@/components/layout/footer-gate";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryProvider } from "@/components/ui/query-provider";

const CartDrawer = dynamic(() =>
  import("@/components/features/cart-drawer").then((mod) => mod.CartDrawer),
  { loading: () => null }
);

import { CursorDotLoader } from "@/components/effects/cursor-dot-loader";

const GOOGLE_TAG_ID = "G-6GDBLBWZW9";

function RouteShellFallback() {
  return <div className="min-h-[calc(100svh-7rem)] bg-background" aria-hidden="true" />;
}

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "XILAR | The Future Wear — Premium Streetwear India",
    template: "%s | XILAR",
  },
  description:
    "Next-gen streetwear for the bold. Premium basics, oversized fits, and urban essentials. Shop Gen-Z fashion with free shipping above ₹999.",
  applicationName: "XILAR",
  keywords: [
    "the future wear",
    "XILAR",
    "xilar.in",
    "streetwear",
    "unisex fashion",
    "Gen-Z clothing",
    "premium basics",
    "urban wear",
    "India streetwear",
    "oversized tshirts",
    "cargo pants India",
    "streetwear brand India",
    "affordable streetwear",
    "joggers",
    "hoodies India",
    "online clothing store India",
  ],
  authors: [
    { name: "XILAR", url: "https://xilar.in" },
    { name: "Aditya (fate1ess)", url: "https://fateless.dev" },
  ],
  creator: "Aditya Singh (fatelessdev)",
  publisher: "XILAR",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "XILAR",
    title: "XILAR | The Future Wear — Premium Streetwear India",
    description:
      "Next-gen streetwear for the bold. Premium basics, oversized fits, and urban essentials. Shop Gen-Z fashion with free shipping above ₹999.",
    url: "/",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "XILAR — The Future Wear | Premium Streetwear India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XILAR | The Future Wear",
    description:
      "Next-gen streetwear for the bold. Premium basics, oversized fits, and urban essentials.",
    images: ["/logo.jpeg"],
  },
  icons: {
    icon: [
      { url: "/logo.jpeg" },
      { url: "/logo.jpeg", sizes: "32x32", type: "image/jpeg" },
    ],
    apple: [{ url: "/logo.jpeg", sizes: "180x180", type: "image/jpeg" }],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "E-Commerce",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  other: {
    "msapplication-TileColor": "#000000",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          id="xilar-theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var root = document.documentElement;
                  var stored = localStorage.getItem('xilar-theme');
                  var cookieMatch = document.cookie.match(/(?:^|; )xilar-theme=(light|dark)(?:;|$)/);
                  var cookieTheme = cookieMatch ? cookieMatch[1] : null;
                  var theme = stored === 'light' || stored === 'dark'
                    ? stored
                    : cookieTheme === 'light' || cookieTheme === 'dark'
                      ? cookieTheme
                      : 'dark';
                  if (theme === 'dark') {
                    root.classList.add('dark');
                    root.classList.remove('light');
                  } else {
                    root.classList.add('light');
                    root.classList.remove('dark');
                  }
                  root.style.colorScheme = theme;
                  localStorage.setItem('xilar-theme', theme);
                  document.cookie = 'xilar-theme=' + theme + '; path=/; max-age=31536000; samesite=lax';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${outfit.variable} ${instrumentSerif.variable} font-sans antialiased bg-background text-foreground tracking-tight min-h-screen flex flex-col`}
      >
        <Script
          id="xilar-google-tag-loader"
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
          strategy="afterInteractive"
        />
        <Script
          id="xilar-google-tag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GOOGLE_TAG_ID}');
            `,
          }}
        />
        <ThemeProvider>
          <QueryProvider>
            <CartProvider>
              <Navbar />
              <div id="main-content-container" className="flex-1 flex flex-col">
                <main className="flex-1 overflow-x-hidden relative">
                  <Suspense fallback={<RouteShellFallback />}>{children}</Suspense>
                </main>
                <Suspense fallback={null}>
                  <FooterGate />
                </Suspense>
              </div>
              <CartDrawer />
              <CursorDotLoader />
              {/* Grain overlay for premium texture */}
              <div
                className="pointer-events-none fixed inset-0 z-[60] opacity-[0.025] dark:opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />
            </CartProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
