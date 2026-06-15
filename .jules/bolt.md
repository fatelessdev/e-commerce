## 2024-06-15 - Use Map indexing for fast access in React components
**Learning:** Repetitive array transversals (like `.find()` or `.filter()`) inside client components rendering dynamic lists or checking stock frequently can cause performance bottlenecks.
**Action:** When optimizing repetitive data lookups in React client components (e.g., product variants), use a memoized `Map` via `useMemo` to index data by composite keys for O(1) access instead of O(N) array traversals.
