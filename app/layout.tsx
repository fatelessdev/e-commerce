import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/app/navbar";
import { Sidebar } from "@/components/layout/sidebar";
// import { BargainAI } from "@/components/features/bargain-ai";
import { CartDrawer } from "@/components/features/cart-drawer";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
        url: "/logo.jpeg",
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
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground tracking-tight min-h-screen flex flex-col`}
      >
        <Analytics />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CartProvider>
            <WishlistProvider>
              <Navbar />
              <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 overflow-x-hidden relative">
                  {children}
                  {/* <BargainAI /> */}
                </main>
              </div>
              <CartDrawer />
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
