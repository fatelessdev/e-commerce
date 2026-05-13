## 2024-05-19 - Resolve N+1 query in getUserOrders
**Learning:** In `getUserOrders`, an N+1 query pattern was identified where `Promise.all` inside a `.map` loop fetched related records individually, causing multiple database queries.
**Action:** Use the `inArray` operator provided by Drizzle ORM to batch queries, and a `Map` structure for O(1) in-memory grouping. Always use early returns if the ID list is empty to prevent executing invalid SQL queries with an empty IN clause.
