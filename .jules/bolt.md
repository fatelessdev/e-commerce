## 2024-05-18 - Fix N+1 Query in getUserOrders
**Learning:** Found an N+1 query vulnerability when iterating over fetched entities and dispatching separate requests to fetch child entities (fetching orderItems for each order). In serverless setups using Drizzle ORM this causes a database request amplification that degrades performance severely at scale.
**Action:** Replace `Promise.all` loops running queries with single batch requests utilizing Drizzle's `inArray` operator, then map the data back using reduce maps grouping by foreign key.
