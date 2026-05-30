"use client";

import dynamic from "next/dynamic";

const CursorDot = dynamic(
  () => import("@/components/effects/cursor-dot").then((mod) => mod.CursorDot),
  { ssr: false },
);

export function CursorDotLoader() {
  return <CursorDot />;
}
