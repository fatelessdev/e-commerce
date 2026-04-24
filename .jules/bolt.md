## 2024-04-24 - Parallelize Independent Database Queries
**Learning:** Sequential independent database queries (e.g., getting paginated data and the total count separately) unnecessarily increase latency. In endpoints like `/api/products` and `lib/combos.ts`, executing these sequentially causes the API response time to be the sum of both query latencies.
**Action:** Always use `Promise.all()` for independent database queries to run them concurrently, effectively reducing the latency to the longest query rather than the sum of both.
