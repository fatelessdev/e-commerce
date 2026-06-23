## 2024-10-24 - Accessibility improvements for Catalog Search
**Learning:** The navigation bar components often lack `aria-label`s on icon-only buttons (`X` to close search, `ArrowRight` to submit search). This pattern might be prevalent across other interactive overlay components.
**Action:** When working on navigation or overlay components with icon-only actions, always verify and add descriptive `aria-label` attributes to ensure screen reader users can understand the button's purpose without visual context.
