"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CursorDot = dynamic(
  () => import("@/components/effects/cursor-dot").then((mod) => mod.CursorDot),
  { ssr: false },
);

export function CursorDotLoader() {
  const [shouldLoadCursor, setShouldLoadCursor] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const requestIdle =
      window.requestIdleCallback ??
      ((callback: IdleRequestCallback) =>
        window.setTimeout(
          () => callback({ didTimeout: false, timeRemaining: () => 0 }),
          1,
        ));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const idleHandle = requestIdle(() => setShouldLoadCursor(true), {
      timeout: 1500,
    });

    return () => cancelIdle(idleHandle);
  }, []);

  return shouldLoadCursor ? <CursorDot /> : null;
}
