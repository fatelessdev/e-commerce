## 2024-05-24 - N+1 Insert Optimization
**Learning:** In Drizzle ORM, looping over an array to run `.insert()` statements creates an N+1 query problem, increasing round trips and latency.
**Action:** Instead of `for (item of items) { await tx.insert(...) }`, construct an array of objects and use bulk insert: `await tx.insert(table).values(itemsArray)`
