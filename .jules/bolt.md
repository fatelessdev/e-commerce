## 2024-05-09 - N+1 Query Fix for Order Creation and Payment Verification
**Learning:** Checking product prices inside loop during checkout/order-creation leads to N+1 queries. When recalculating values securely on the server-side against an untrusted cart payload, queries scale poorly with cart size.
**Action:** Use `inArray` to fetch all products associated with a cart payload in a single batched query before the verification loop, mapping them to a JS Map for O(1) lookups.
