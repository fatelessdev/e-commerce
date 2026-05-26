## 2024-05-26 - Optimized Checkout N+1 Query Bottleneck
**Learning:** The `createOrder` logic originally fired 5 separate queries (validation + transaction state) per item in a loop. With Drizzle ORM, `inArray` can fetch all items in just 2 queries, and caching via JS `Map` reduces transaction duration significantly.
**Action:** Always pre-fetch and cache related entities using `inArray` before entering loops or transactions to prevent database timeouts or slow checkout experiences. Always check array length before using `inArray` to prevent SQL errors.
