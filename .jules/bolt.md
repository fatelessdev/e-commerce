## 2026-05-03 - Parallelizing Query and Count in Pagination
**Learning:** In Drizzle ORM applications like this codebase, executing the paginated data fetch and total count queries sequentially creates an unnecessary N+1 pattern that increases request latency.
**Action:** When implementing paginated endpoints or queries, always batch independent sequential database operations (like data fetch and count) using `Promise.all()` to parallelize execution and minimize round trips.
