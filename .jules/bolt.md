
## 2026-05-30 - O(1) Variant Lookups in React Client Components
**Learning:** Repetitive array `.find()` calls for variant data (e.g., matching product sizes and colors) inside React render loops and component maps can cause significant performance degradation due to O(N) lookup complexity, especially when rendering multiple product cards.
**Action:** When extracting data based on composite keys (like size + color), map the target array into a Javascript `Map` using `useMemo` with composite string keys (e.g., `${size}|${color}`) to enable O(1) lookups. To maintain React Compiler compatibility, extract the array to a local variable first to avoid using optional chaining in the `useMemo` dependency array.
