## 2024-03-24 - Memoize Combo Variants
**Learning:** React component `ComboClient` performed an O(N) array lookup for variants upon every render when checking availability, identical to an issue fixed previously in `product-client.tsx`. This causes unnecessary performance overhead, particularly when switching colors/sizes.
**Action:** When working with nested array fields (variants) that require lookup by composite keys, use a `useMemo`-backed `Map` indexing the array using string interpolated composite keys (`${size}|${color}`) to achieve O(1) reads without altering core logic.
