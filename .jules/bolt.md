## 2026-05-21 - Batched database queries for checkout validation
**Learning:** Checking stock during checkout used a N+1 query pattern (3 database queries per cart item inside a loop), causing unnecessary database load and request latency.
**Action:** Replaced loop queries with Drizzle ORM's inArray() operator to fetch all products and variants beforehand, then map them into an O(1) Javascript Map for fast lookups.
