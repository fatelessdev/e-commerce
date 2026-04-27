## 2024-04-27 - N+1 Query in Order Fetching
**Learning:** Drizzle ORM executes queries inside `Promise.all(array.map(...))` resulting in N+1 database queries.
**Action:** Use `inArray` to fetch related records efficiently and group them in-memory.
