## 2024-05-23 - Accessibility of icon-only buttons
**Learning:** Found that `<Button size="icon">` elements are frequently used throughout the app for varied tasks (close menus, send messages, copy text) but sometimes omit either an `aria-label` or hidden text inside them (`<span className="sr-only">`), making them completely invisible to screen readers since they only contain SVG icons.
**Action:** When auditing or building icon-only buttons across the Next.js/shadcn application, enforce the inclusion of either an `aria-label` attribute on the button itself or nested `.sr-only` text.
