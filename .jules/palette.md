## 2024-03-24 - Missing aria-labels on icon buttons
**Learning:** Several icon-only `<Button size="icon">` components across the app are missing `aria-label`s, which is bad for screen readers. Some buttons rely on `<span className="sr-only">` inside them, but `aria-label` directly on the button is cleaner and more robust. The mobile menu toggle, search form submit/close buttons, and potentially others in `components/layout/navbar.tsx` are missing labels entirely.
**Action:** When adding icon-only buttons, always ensure an `aria-label` property is present on the button element itself.
