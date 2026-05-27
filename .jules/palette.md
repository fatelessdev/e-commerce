## 2024-05-27 - Added aria-labels to Bargain Checkout Modal
**Learning:** Found that the checkout-bargain modal had missing ARIA labels on its "Close" and "Send" icon-only buttons, making them inaccessible to screen readers.
**Action:** Always verify that every `size="icon"` Button has an `aria-label` or `.sr-only` text alternative to ensure keyboard and screen reader accessibility.
