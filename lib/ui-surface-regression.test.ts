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

test("home streams the hero before data-dependent merchandising sections", () => {
  const page = read("app/page.tsx");

  assert.match(page, /export default function Home\(\)/);
  assert.doesNotMatch(page, /export default async function Home/);
  assert.match(page, /<Hero \/>[\s\S]*<Suspense fallback={<HomeSectionsFallback \/>}>[\s\S]*<HomeMerchandisingSections \/>[\s\S]*<\/Suspense>/);
  assert.match(page, /async function HomeMerchandisingSections\(\)/);
  assert.match(page, /function HomeSectionsFallback\(\)/);
});

test("root route suspense reserves the first viewport instead of exposing the footer", () => {
  const layout = read("app/layout.tsx");

  assert.match(layout, /function RouteShellFallback\(\)/);
  assert.match(layout, /<Suspense fallback={<RouteShellFallback \/>}>{children}<\/Suspense>/);
  assert.doesNotMatch(layout, /<Suspense fallback={null}>{children}<\/Suspense>/);
});

test("product route loading shell matches the loaded desktop product layout", () => {
  const loading = read("app/product/[id]/loading.tsx");

  assert.match(loading, /bg-background pb-24 lg:pt-6/);
  assert.match(loading, /grid grid-cols-1 lg:grid-cols-2 gap-0/);
  assert.match(loading, /aspect-\[4\/5\]/);
  assert.match(loading, /lg:min-h-\[calc\(100svh-8rem\)\] lg:sticky lg:top-20/);
  assert.match(loading, /descriptionLineWidths/);
  assert.match(loading, /"w-\[92%\]"/);
  assert.match(loading, /border-t border-border\/60 mt-24 px-6 md:px-12 lg:px-16/);
  assert.match(loading, /You may also like/);
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
