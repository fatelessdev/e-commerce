## 2026-05-20 - Resolve N+1 Query in createOrder
**Learning:** Checking stock availability for variants in `createOrder` inside a `for...of` loop creates an N+1 query vulnerability for multi-item carts during checkout.
**Action:** Extract all `productId`s, fetch needed products and variants with `inArray()` in two single queries, map results to a `Map` for O(1) lookups, and reuse boolean flags inside the subsequent loop instead of issuing `SELECT count(*)` statements repeatedly.
