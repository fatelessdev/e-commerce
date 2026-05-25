## 2026-05-25 - Optimize Checkout Validation Queries
**Learning:** Checking stock sequentially per-item in cart validation creates an N+1 query problem, increasing latency with larger carts. Drizzle's `inArray` can be paired with early exits for empty arrays.
**Action:** Replace loop queries with batched `inArray` queries. Create `Map` instances from the results to allow O(1) in-memory checks over items. Ensure there is an early exit condition before executing an `inArray` query with an empty array.
