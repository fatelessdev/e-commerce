## 2024-04-27 - Icon-only buttons lacking ARIA labels
**Learning:** Many interactive icon-only buttons using `<Button size="icon">` (such as in cart, bargain AI, and nav components) lack `aria-label` attributes or `sr-only` text, leading to poor screen reader accessibility.
**Action:** When implementing or modifying icon-only buttons (`<Button size="icon">`), ensure they always include descriptive `aria-label` attributes to maintain screen reader accessibility.
