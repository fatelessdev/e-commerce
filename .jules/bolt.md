## 2026-05-23 - Parallelize Drizzle ORM Queries
**Learning:** Independent sequential database queries (e.g., fetching related records like products and variants that don't depend on each other's results) cause unnecessary latency.
**Action:** Always wrap independent Drizzle ORM queries in `Promise.all()` to execute them concurrently and reduce overall request time.
