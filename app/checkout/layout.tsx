import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout for your XILAR order.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/checkout",
  },
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children;
}
