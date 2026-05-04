## 2024-05-20 - [Batch related database queries to prevent N+1 issues]
**Learning:** Resolving multiple database rows that each require related child rows via `Promise.all(rows.map(async () => db.select(...)))` causes an N+1 query problem, increasing latency with each parent row.
**Action:** Use `inArray` from `drizzle-orm` to fetch all related child rows in a single batch query, then group them in memory by parent ID.
