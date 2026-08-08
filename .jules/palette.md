## 2024-07-04 - Adding ARIA labels to search and chat inputs
**Learning:** Found that custom search and chat input components were relying only on placeholder text for context, causing accessibility issues for screen readers.
**Action:** Added explicit `aria-label` attributes to the inputs to ensure they are properly announced by assistive technologies.
