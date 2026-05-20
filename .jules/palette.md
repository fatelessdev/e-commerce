## 2026-05-20 - Add ARIA labels to icon-only buttons
**Learning:** The codebase frequently uses `<span className="sr-only">Text</span>` for accessibility on icon-only buttons, but explicit `aria-label` attributes on the `<Button>` along with `aria-hidden="true"` on inner SVGs is equally valid and explicitly required by project constraints.
**Action:** Always check interactive elements (especially buttons without visible text) for proper `aria-label` properties and apply `aria-hidden="true"` to their icon children to improve screen reader experience without duplicating information.
