import { useMemo } from 'react';

// Using a specific interface to type variants and avoid "any" per memory constraints
interface Variant {
  id: string;
  productId: string;
  size: string;
  color: string | null;
  stock: number;
}

export function useVariantStock(variantsA: Variant[] | undefined, variantsB: Variant[] | undefined) {
  const variantMapA = useMemo(() => {
    const map = new Map<string, number>();
    variantsA?.forEach(v => map.set(`${v.size}|${v.color}`, v.stock));
    return map;
  }, [variantsA]);

  const variantMapB = useMemo(() => {
    const map = new Map<string, number>();
    variantsB?.forEach(v => map.set(`${v.size}|${v.color}`, v.stock));
    return map;
  }, [variantsB]);

  const getVariantStockA = (size: string, color: string | null) => {
    if (!variantsA || variantsA.length === 0) return 0;
    return variantMapA.get(`${size}|${color}`) ?? 0;
  };

  const getVariantStockB = (size: string, color: string | null) => {
    if (!variantsB || variantsB.length === 0) return 0;
    return variantMapB.get(`${size}|${color}`) ?? 0;
  };

  const isColorAvailableA = (colorName: string, selectedSize: string | null) => {
    if (!selectedSize) return false;
    return getVariantStockA(selectedSize, colorName) > 0;
  };

  const isColorAvailableB = (colorName: string, selectedSize: string | null) => {
    if (!selectedSize) return false;
    return getVariantStockB(selectedSize, colorName) > 0;
  };

  return { getVariantStockA, getVariantStockB, isColorAvailableA, isColorAvailableB };
}
