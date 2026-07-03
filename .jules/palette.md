## 2024-05-24 - Search Input Accessibility
**Learning:** Found that the search input in `components/features/shop-client.tsx` relies solely on a `placeholder` attribute without an associated `<label>` tag or an `aria-label`. This makes it inaccessible for screen readers. This matches a memory rule regarding placeholders and accessibility.
**Action:** Add an explicit `aria-label="Search products"` to the search input in `components/features/shop-client.tsx` to ensure it is properly announced by screen readers.
