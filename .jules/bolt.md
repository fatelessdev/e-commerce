## 2024-05-15 - [Database Query Optimization: Resolving N+1 Problems]
**Learning:** Performing database queries within a loop (`Promise.all` with `map`) leads to an N+1 query problem, increasing latency and database load linearly with the size of the initial result set.
**Action:** Use Drizzle ORMs `inArray` operator to batch related records into a single query and group them in memory using `reduce`, significantly reducing the number of roundtrips and overall execution time.
