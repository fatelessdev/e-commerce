## 2026-05-12 - Optimize checkout product validation (Fix N+1 queries)
**Learning:** Found N+1 query problems in the cart validation loops for both COD orders and Razorpay verified orders where every product in the cart was fetched individually in a loop.
**Action:** Always use `inArray` to fetch related entities in a single batch query before a loop, and map the results to a JavaScript `Map` for O(1) lookups to optimize performance and prevent N+1 database bottlenecks.
