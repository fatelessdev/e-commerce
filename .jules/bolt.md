## 2024-06-18 - O(1) React Variant Lookups
**Learning:** React Compiler doesn't optimize optional chaining in dependency arrays well, and O(N) array traversals for color options cause bad render performance.
**Action:** Use string interpolation composite keys (`size|color`) with `useMemo` Maps for O(1) indexing, extracting nested arrays to local variables before the dependency array.
