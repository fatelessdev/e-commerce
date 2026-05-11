## 2024-05-11 - Optimize repetitive data lookups in React client components
**Learning:** Repetitive array traversals (e.g., using `.find()`) inside frequently-called functions or loops during React's render phase (e.g. `getVariantStock` checking size and color combinations) can create O(N²) scaling issues causing noticeable lag for entities with large data structures.
**Action:** Always use a memoized `Map` via `useMemo` to index related item arrays by composite keys (e.g., `${size}|${color}`) for O(1) access when a search must happen repeatedly during rendering.
