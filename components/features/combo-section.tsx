"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCart } from "@/lib/cart-context";
import { normalizeProductImage } from "@/lib/image";
import { ViewportPrefetchLink } from "@/components/ui/viewport-prefetch-link";

interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string | null;
  stock: number;
}

interface ComboProduct {
  id: string;
  name: string;
  sellingPrice: string;
  mrp: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  variants: ProductVariant[];
  category: string;
}

export interface Combo {
  id: string;
  discountAmount: string;
  productA: ComboProduct;
  productB: ComboProduct;
}

const NUMBER_SIZE_CATEGORIES = ["jogger", "jeans", "cargo", "shorts"];

function formatPrice(value: string | number) {
  const amount = typeof value === "number" ? value : Number(value);
  return `₹${amount.toLocaleString("en-IN")}`;
}

function getVariantStock(variantMap: Map<string, number>, size: string, color: string | null) {
  const exactKey = `${size}|${color}`;
  if (variantMap.has(exactKey)) return variantMap.get(exactKey)!;

  return 0;
}

function isColorAvailable(variantMap: Map<string, number>, colorName: string, selectedSize: string | null) {
  if (!selectedSize) return false;
  return getVariantStock(variantMap, selectedSize, colorName) > 0;
}

function sizeOptions(product: ComboProduct) {
  if (NUMBER_SIZE_CATEGORIES.includes(product.category)) {
    return product.sizes.filter((size) => /^\d+$/.test(size));
  }
  return product.sizes;
}

export function ComboCard({ combo, interactive }: { combo: Combo; interactive: boolean }) {
  const { addCombo } = useCart();
  const [selectedSizeA, setSelectedSizeA] = useState<string | null>(null);
  const [selectedColorA, setSelectedColorA] = useState<string | null>(null);
  const [selectedSizeB, setSelectedSizeB] = useState<string | null>(null);
  const [selectedColorB, setSelectedColorB] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const maxDiscountAmount = Number(combo.discountAmount);
  const originalTotal = Number(combo.productA.sellingPrice) + Number(combo.productB.sellingPrice);
  const discountValue = Math.min(Math.max(0, maxDiscountAmount), originalTotal);

  const requiredColorA = combo.productA.colors.length > 0;
  const requiredColorB = combo.productB.colors.length > 0;

  const variantsA = combo.productA.variants;
  const variantMapA = useMemo(() => {
    const map = new Map<string, number>();
    if (!variantsA) return map;
    variantsA.forEach(v => {
        map.set(`${v.size}|${v.color}`, v.stock);
    });
    return map;
  }, [variantsA]);

  const variantsB = combo.productB.variants;
  const variantMapB = useMemo(() => {
    const map = new Map<string, number>();
    if (!variantsB) return map;
    variantsB.forEach(v => {
        map.set(`${v.size}|${v.color}`, v.stock);
    });
    return map;
  }, [variantsB]);

  const selectedStockA = selectedSizeA
    ? getVariantStock(variantMapA, selectedSizeA, requiredColorA ? selectedColorA : null)
    : null;
  const selectedStockB = selectedSizeB
    ? getVariantStock(variantMapB, selectedSizeB, requiredColorB ? selectedColorB : null)
    : null;

  const canAdd = Boolean(
    selectedSizeA &&
    selectedSizeB &&
    (!requiredColorA || selectedColorA) &&
    (!requiredColorB || selectedColorB) &&
    selectedStockA &&
    selectedStockA > 0 &&
    selectedStockB &&
    selectedStockB > 0
  );

  const previewHref = interactive ? `/product/${combo.productA.id}` : `/combo/${combo.id}`;
  const secondaryPreviewHref = interactive ? `/product/${combo.productB.id}` : `/combo/${combo.id}`;

  return (
    <Card className="rounded-none border-border/60">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ViewportPrefetchLink href={previewHref} className="group space-y-2">
            <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
              <Image
                src={normalizeProductImage(combo.productA.images?.[0])}
                alt={combo.productA.name}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="text-xs font-medium line-clamp-2">{combo.productA.name}</p>
            <p className="text-xs text-muted-foreground">{formatPrice(combo.productA.sellingPrice)}</p>
          </ViewportPrefetchLink>

          <ViewportPrefetchLink href={secondaryPreviewHref} className="group space-y-2">
            <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
              <Image
                src={normalizeProductImage(combo.productB.images?.[0])}
                alt={combo.productB.name}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="text-xs font-medium line-clamp-2">{combo.productB.name}</p>
            <p className="text-xs text-muted-foreground">{formatPrice(combo.productB.sellingPrice)}</p>
          </ViewportPrefetchLink>
        </div>

        {interactive && (
        <div className="space-y-4 border-t border-border/60 pt-4">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Product A size</p>
            <div className="flex flex-wrap gap-2">
              {sizeOptions(combo.productA).map((size) => (
                <Button
                  key={`a-${size}`}
                  type="button"
                  size="sm"
                  variant={selectedSizeA === size ? "default" : "outline"}
                  className="rounded-none text-[10px]"
                  onClick={() => setSelectedSizeA(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
            {requiredColorA && (
              <div className="flex flex-wrap gap-2">
                {combo.productA.colors.map((color) => {
                  const available = isColorAvailable(variantMapA, color.name, selectedSizeA);
                  return (
                    <button
                      key={`a-${color.name}`}
                      type="button"
                      onClick={() => {
                        if (available) setSelectedColorA(color.name);
                      }}
                      disabled={!available}
                      className={`w-7 h-7 rounded-full border transition-all ${
                        selectedColorA === color.name ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                      } ${available ? "" : "opacity-30 cursor-not-allowed"}`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Product B size</p>
            <div className="flex flex-wrap gap-2">
              {sizeOptions(combo.productB).map((size) => (
                <Button
                  key={`b-${size}`}
                  type="button"
                  size="sm"
                  variant={selectedSizeB === size ? "default" : "outline"}
                  className="rounded-none text-[10px]"
                  onClick={() => setSelectedSizeB(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
            {requiredColorB && (
              <div className="flex flex-wrap gap-2">
                {combo.productB.colors.map((color) => {
                  const available = isColorAvailable(variantMapB, color.name, selectedSizeB);
                  return (
                    <button
                      key={`b-${color.name}`}
                      type="button"
                      onClick={() => {
                        if (available) setSelectedColorB(color.name);
                      }}
                      disabled={!available}
                      className={`w-7 h-7 rounded-full border transition-all ${
                        selectedColorB === color.name ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                      } ${available ? "" : "opacity-30 cursor-not-allowed"}`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-border/60 pt-4 pb-4 px-4 flex-col items-start gap-3">
        <div className="space-y-1">
          {maxDiscountAmount > 0 && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-accent font-semibold">
              Max bargain on combo: {formatPrice(maxDiscountAmount)}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground tabular-nums">Combo total: {formatPrice(originalTotal)}</span>
            <span className="text-green-600 dark:text-green-400 tabular-nums">Bargain cap: {formatPrice(discountValue)}</span>
          </div>
        </div>

        {interactive ? (
          <Button
            className="w-full rounded-none text-[10px] uppercase tracking-[0.15em]"
            disabled={!canAdd}
            onClick={() => {
              if (!selectedSizeA || !selectedSizeB) return;

              addCombo({
                comboId: combo.id,
                comboName: `${combo.productA.name} + ${combo.productB.name}`,
                maxDiscountAmount,
                items: [
                  {
                    id: combo.productA.id,
                    name: combo.productA.name,
                    price: Number(combo.productA.sellingPrice),
                    displayPrice: formatPrice(combo.productA.sellingPrice),
                    image: normalizeProductImage(combo.productA.images?.[0]),
                    size: selectedSizeA,
                    color: selectedColorA || undefined,
                  },
                  {
                    id: combo.productB.id,
                    name: combo.productB.name,
                    price: Number(combo.productB.sellingPrice),
                    displayPrice: formatPrice(combo.productB.sellingPrice),
                    image: normalizeProductImage(combo.productB.images?.[0]),
                    size: selectedSizeB,
                    color: selectedColorB || undefined,
                  },
                ],
              });

              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
            }}
          >
            {added ? "Added Combo" : "Add Combo to Cart"}
          </Button>
        ) : (
          <Button asChild className="w-full rounded-none text-[10px] uppercase tracking-[0.15em]">
            <ViewportPrefetchLink href={`/combo/${combo.id}`}>Customize this combo</ViewportPrefetchLink>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function ComboSection({
  limit = 6,
  interactive = true,
  mobileLimit = 3,
  initialCombos,
}: {
  limit?: number;
  interactive?: boolean;
  mobileLimit?: number;
  initialCombos?: Combo[];
}) {
  const { data: combos = [], isLoading: loading } = useQuery({
    queryKey: ["combos", limit],
    queryFn: async () => {
      const response = await fetch(`/api/combos?limit=${limit}`);
      if (!response.ok) throw new Error("Failed to load combos");
      const data = await response.json();
      return (data.combos || []) as Combo[];
    },
    initialData: initialCombos,
    enabled: initialCombos === undefined,
    staleTime: 1000 * 60 * 5,
  });

  const hasCombos = useMemo(() => combos.length > 0, [combos.length]);

  if (!loading && !hasCombos) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-background">
      <div className="flex flex-col items-center mb-8 md:mb-12">
        <p className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-3">Bundle deals</p>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight">Combos</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(Math.min(limit, 2))].map((_, index) => (
            <div key={index} className="rounded-none border border-border/60 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-[3/4] animate-pulse bg-muted" />
                <div className="aspect-[3/4] animate-pulse bg-muted" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-2/3 animate-pulse bg-muted" />
                <div className="h-3 w-1/2 animate-pulse bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {combos.map((combo, index) => (
            <div key={combo.id} className={index >= mobileLimit ? "hidden md:block" : undefined}>
              <ComboCard combo={combo} interactive={interactive} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
