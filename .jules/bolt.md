## 2025-06-21 - Optimize repetitive variant array lookups
**Learning:** Repetitive array `.find` lookups for `getVariantStock` inside render functions (especially loops like colors/sizes mapping) create unnecessary O(N * M) overhead. The React Compiler does not automatically optimize external un-memoized utility functions operating on nested arrays.
**Action:** Always pre-compute a variant stock Map using `useMemo` indexed by a composite key (e.g. `${size}|${color}`) to achieve O(1) lookups during rendering.
