## 2024-05-18 - Batching Database Inserts in Drizzle
**Learning:** Drizzle ORM supports batching `insert` operations by passing an array of objects to `.values()`. Looping over items and awaiting individual `.insert().values()` calls causes unnecessary N database queries (an N+1 insert problem).
**Action:** When inserting multiple related records (e.g., order items for a new order), map the items to an array of objects and execute a single batch `.insert().values(array)` to reduce database roundtrips and improve transaction performance.
