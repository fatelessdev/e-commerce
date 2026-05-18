## 2024-05-18 - [Add aria-label and aria-hidden to Checkout Bargain AI]
**Learning:** Adding descriptive `aria-label` attributes to icon-only buttons (like `size="icon"` components) alongside `aria-hidden="true"` on their child SVGs is a crucial accessibility pattern in this codebase. This ensures screen readers announce the button purpose correctly and don't redundantly announce the icon structure.
**Action:** Always verify `aria-label` is present on `<Button size="icon">` components and use `aria-hidden="true"` on SVG elements inside icon-only buttons.
