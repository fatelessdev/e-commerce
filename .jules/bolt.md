## 2024-05-18 - [Fix N+1 Query in Order Fetching]
**Learning:** Performing database queries inside an array `map` block paired with `Promise.all` can create extreme inefficiencies, particularly on lists of arbitrary sizes (N+1 Query Issue).
**Action:** Replace `Promise.all` loops fetching related items with a singular SQL `inArray` query grouping items correctly in memory.
