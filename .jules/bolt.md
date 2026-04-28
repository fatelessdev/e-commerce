## 2025-02-28 - [Drizzle ORM] N+1 Query Optimization
**Learning:** Found an N+1 performance bottleneck when fetching user orders and their associated order items inside `lib/actions/orders.ts`. Iterating over `userOrders` and executing separate `await db.select()` queries per order using `Promise.all` can degrade performance significantly as the number of orders increases.
**Action:** Used Drizzle's `inArray` to batch queries, replacing loop-based fetching with a single database roundtrip for all items, and mapping them in application memory.
