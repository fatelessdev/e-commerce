## 2024-06-01 - O(N) linear array scan in lists with colors and nested variants
**Learning:** Checking stock availability using a linear `Array.find()` inside mapped UI components (like colors or sizes inside a product card in a list view) results in O(C * P * V) complexity, creating significant layout thrashing on render.
**Action:** Always pre-compute and memoize nested data like variants into a composite-keyed Map (`${size}|${color}`) for O(1) hash map lookups, specifically when extracting out to variables to appease React Compiler dependency arrays.
