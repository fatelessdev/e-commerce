## 2024-07-05 - Optimize useMemo usage for Derived State Arrays
**Learning:** Wrapping derived state arrays (such as O(N) object/array mappings or `.reduce()` calls) inside `useMemo` in context providers prevents unnecessary recalculations of the derived properties when context consumers re-render, solving the O(N) computation over multiple consumer renders.
**Action:** When defining values inside a React context provider, explicitly apply `useMemo` for any complex derivation of existing arrays or states to memoize its outcome.
