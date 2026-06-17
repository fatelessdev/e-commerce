## 2024-05-18 - Optimized Array Lookups in Client Components
**Learning:** Repetitive array `find` operations inside loop iterations (e.g., finding a matching stock variant over M components or rendering loops) scale as O(N), severely impacting render performance when variants list is large and components multiply.
**Action:** Always extract and memoize such arrays into a `Map` structure using composite string keys (e.g., `${size}|${color}`) via `useMemo`. Ensure that optional nested dependencies are correctly handled to allow React Compiler optimizations.
