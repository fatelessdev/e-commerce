## 2025-05-15 - Batched Queries in Validation
**Learning:** Resolving N+1 query problems when validating untrusted cart payloads during checkout via `inArray` to batch DB queries before loops mapped to `Map`s for O(1) lookups reduces DB latency and protects the app under heavy load.
**Action:** Always extract unique IDs from arrays and use `inArray` to perform one bulk database query instead of querying per item. Always include an early return condition to check if the provided array is empty.
