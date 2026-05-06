## 2024-05-06 - Fixing N+1 Queries in User Orders
**Learning:** In Drizzle ORM, querying related items within a loop (e.g., fetching order items for each order inside `Promise.all(orders.map(...))`) creates a classic N+1 query bottleneck. This codebase's serverless Neon PostgreSQL setup makes query round-trip times especially punitive.
**Action:** Always batch related fetches. Use `inArray` to query all related items in a single shot (e.g., `where(inArray(orderItems.orderId, orderIds))`) and then map them in memory using a hash map or `Map` structure for O(1) assignment.
