## 2025-01-28 - N+1 Query Resolution with Drizzle ORM
**Learning:** Resolving N+1 query issues with Drizzle ORM when fetching related items inside a loop using `Promise.all` can be effectively optimized by leveraging the `inArray` operator to batch database queries.
**Action:** When working with nested models mapping over `Promise.all` for database calls, use `inArray` to fetch relationships at once and then assemble them in memory, ensuring to check `if (array.length === 0) return []` first to prevent an empty `IN()` clause error.
