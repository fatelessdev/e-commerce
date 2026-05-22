## 2024-05-22 - Missing ARIA Labels on Icon Buttons

**Learning:** Several icon-only buttons across the app (especially wishlist buttons, product/combo navigation buttons, theme toggler) are missing accessible labels. Also, the inner SVG icons are missing `aria-hidden="true"`, meaning they could be announced inconsistently by screen readers.
**Action:** Always verify that `<Button size="icon">` and similar visual-only interactive elements contain `aria-label` or `sr-only` text, and apply `aria-hidden="true"` to inner SVG icons to maintain screen reader accessibility.
