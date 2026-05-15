## 2026-05-15 - Add aria-labels to icon-only buttons
**Learning:** Icon-only buttons (e.g., using shadcn's `size="icon"`) often lack accessible names for screen readers in this app's UI components.
**Action:** When implementing icon-only buttons, always ensure an `aria-label` is provided describing the action, and add `aria-hidden="true"` to the internal SVG icon to prevent redundant announcements.
