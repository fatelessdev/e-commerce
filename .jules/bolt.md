## 2024-06-12 - Memoize Combo Variant Lookups
**Learning:** React Server Component client side repetitive data lookups inside a render loop should use a memoized `Map` via `useMemo` and composite keys to achieve O(1) time complexity, especially when working with product variants.
**Action:** Extract deeply nested dependencies like `product.variants` to local variables before supplying them to `useMemo` dependencies array to allow React Compiler optimizations to function.
