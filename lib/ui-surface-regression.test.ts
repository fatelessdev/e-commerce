import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function read(path: string) {
  return readFileSync(path, "utf8");
}

test("gallery hides the shared footer through a route-aware shell", () => {
  const layout = read("app/layout.tsx");
  const gate = read("components/layout/footer-gate.tsx");

  assert.match(layout, /<FooterGate \/>/);
  assert.match(gate, /usePathname/);
  assert.match(gate, /pathname === "\/gallery"/);
});

test("root layout wires Lenis smooth scrolling", () => {
  const layout = read("app/layout.tsx");
  const provider = read("components/effects/lenis-provider.tsx");

  assert.match(layout, /<LenisProvider>/);
  assert.match(provider, /ReactLenis/);
  assert.match(provider, /smoothWheel/);
  assert.match(provider, /syncTouch/);
});

test("footer and menu shells use theme tokens instead of fixed black and white", () => {
  const footer = read("components/layout/footer.tsx");
  const navbar = read("app/navbar.tsx");

  assert.match(footer, /bg-background text-foreground/);
  assert.doesNotMatch(footer, /bg-neutral-950 text-white/);
  assert.match(navbar, /bg-background text-foreground/);
  assert.doesNotMatch(navbar, /bg-neutral-950 text-white/);
});

test("mobile reviews are capped to four cards", () => {
  const reviews = read("components/features/real-reviews.tsx");

  assert.match(reviews, /REVIEWS\.map\(\(review, index\)/);
  assert.match(reviews, /index >= 4/);
  assert.match(reviews, /max-md:hidden/);
});

test("shared buttons use circular pill geometry by default", () => {
  const button = read("components/ui/button.tsx");

  assert.match(button, /rounded-full/);
  assert.doesNotMatch(button, /rounded-md text-sm font-medium/);
});
