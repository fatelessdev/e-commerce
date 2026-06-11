## 2025-02-20 - Memoizing Map Lookups with Composite Keys

**Learning:** When using `useMemo` in Next.js client components optimized by the React Compiler, optional chaining (`?.`) in the dependency array (e.g., `[combo?.productA?.variants]`) will cause dependency mismatch warnings and prevent compiler optimization.
**Action:** Extract the target nested array to a local variable first (`const variantsA = combo.productA.variants;`) and use that variable in the `useMemo` dependency array (`[variantsA]`). Also, note that JavaScript string interpolation safely handles null values for composite keys (e.g. `${v.size}|${v.color}` where color is null evaluates to `Size|null`), making it robust for O(1) map lookups.
