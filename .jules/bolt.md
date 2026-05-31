## 2025-02-18 - Resolve N+1 query bottleneck in order creation
**Learning:** Untrusted cart validation logic iterating through items often causes severe N+1 database querying for product active states, variant checks, and stock thresholds.
**Action:** When validating multi-item payloads, extract distinct IDs using `[...new Set(items.map(i => i.id))]`, pre-fetch data parallelly via `Promise.all` and Drizzle's `inArray`, and index into JavaScript `Map`s for O(1) loop validation to effectively eliminate N+1 bottlenecks.
