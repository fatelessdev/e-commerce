"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

function FooterShell() {
  return (
    <footer
      aria-hidden="true"
      className="relative min-h-screen overflow-hidden border-t border-border/60 bg-background text-foreground"
    />
  );
}

const Footer = dynamic(
  () => import("@/components/layout/footer").then((mod) => mod.Footer),
  { loading: () => <FooterShell /> },
);

export function FooterGate() {
  const pathname = usePathname();

  if (pathname === "/gallery") return null;

  return <Footer />;
}
