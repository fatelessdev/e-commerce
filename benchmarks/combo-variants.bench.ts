import { run, bench, group } from 'mitata';

// Generate mock data
const generateVariants = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `v${i}`,
    productId: 'p1',
    size: `size-${i % 10}`,
    color: `color-${i % 5}`,
    stock: i % 10
  }));
};

const variants = generateVariants(100);

// N array traversal
const getVariantStockFind = (size: string, color: string | null) => {
  if (!variants || variants.length === 0) return 0;
  const variant = variants.find(
    (row) => row.size === size && (row.color === color || (row.color === null && color === null))
  );
  return variant?.stock ?? 0;
};

// O(1) map lookup
const variantMap = new Map();
variants.forEach(v => variantMap.set(`${v.size}|${v.color}`, v.stock));

const getVariantStockMap = (size: string, color: string | null) => {
  const key = `${size}|${color}`;
  return variantMap.has(key) ? variantMap.get(key) : 0;
};

group('Variant Lookup', () => {
  bench('Array .find() (O(N))', () => {
    // worst case: not found
    getVariantStockFind('size-99', 'color-99');
    // best case: found early
    getVariantStockFind('size-0', 'color-0');
    // average case
    getVariantStockFind('size-5', 'color-2');
  });

  bench('Map .get() (O(1))', () => {
    getVariantStockMap('size-99', 'color-99');
    getVariantStockMap('size-0', 'color-0');
    getVariantStockMap('size-5', 'color-2');
  });
});

await run();
