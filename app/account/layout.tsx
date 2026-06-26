import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in or manage your XILAR account.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/account",
  },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
