"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useCart } from "@/lib/cart-context";

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

interface Combo {
  id: string;
  discountPercentage: string;
  productA: ComboProduct;
  productB: ComboProduct;
}

const NUMBER_SIZE_CATEGORIES = ["jogger", "jeans", "cargo", "shorts"];

function formatPrice(value: string | number) {
  const amount = typeof value === "number" ? value : Number(value);
  return `₹${amount.toLocaleString("en-IN")}`;
}

function getVariantStock(product: ComboProduct, size: string, color: string | null) {
  if (!product.variants || product.variants.length === 0) {
    return 0;
  }

  const variant = product.variants.find(
    (row) => row.size === size && (row.color === color || (row.color === null && color === null))
  );
  return variant?.stock ?? 0;
}

function isColorAvailable(product: ComboProduct, colorName: string, selectedSize: string | null) {
  if (!selectedSize) return false;
  return getVariantStock(product, selectedSize, colorName) > 0;
}

function sizeOptions(product: ComboProduct) {
  if (NUMBER_SIZE_CATEGORIES.includes(product.category)) {
    return product.sizes.filter((size) => /^\d+$/.test(size));
  }
  return product.sizes;
}

function ComboCard({ combo }: { combo: Combo }) {
  const { addCombo } = useCart();
  const [selectedSizeA, setSelectedSizeA] = useState<string | null>(null);
  const [selectedColorA, setSelectedColorA] = useState<string | null>(null);
  const [selectedSizeB, setSelectedSizeB] = useState<string | null>(null);
  const [selectedColorB, setSelectedColorB] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const discountPercentage = Number(combo.discountPercentage);
  const originalTotal = Number(combo.productA.sellingPrice) + Number(combo.productB.sellingPrice);
  const discountValue = (originalTotal * discountPercentage) / 100;
  const discountedTotal = originalTotal - discountValue;

  const requiredColorA = combo.productA.colors.length > 0;
  const requiredColorB = combo.productB.colors.length > 0;

  const selectedStockA = selectedSizeA
    ? getVariantStock(combo.productA, selectedSizeA, requiredColorA ? selectedColorA : null)
    : null;
  const selectedStockB = selectedSizeB
    ? getVariantStock(combo.productB, selectedSizeB, requiredColorB ? selectedColorB : null)
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

  return (
    <Card className="rounded-none border-border/60">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/product/${combo.productA.id}`} className="group space-y-2">
            <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
              <Image
                src={combo.productA.images?.[0] || "/clothes/placeholder.jpeg"}
                alt={combo.productA.name}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="text-xs font-medium line-clamp-2">{combo.productA.name}</p>
            <p className="text-xs text-muted-foreground">{formatPrice(combo.productA.sellingPrice)}</p>
          </Link>

          <Link href={`/product/${combo.productB.id}`} className="group space-y-2">
            <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
              <Image
                src={combo.productB.images?.[0] || "/clothes/placeholder.jpeg"}
                alt={combo.productB.name}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="text-xs font-medium line-clamp-2">{combo.productB.name}</p>
            <p className="text-xs text-muted-foreground">{formatPrice(combo.productB.sellingPrice)}</p>
          </Link>
        </div>

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
                  const available = isColorAvailable(combo.productA, color.name, selectedSizeA);
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
                  const available = isColorAvailable(combo.productB, color.name, selectedSizeB);
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
      </CardContent>

      <CardFooter className="border-t border-border/60 pt-4 pb-4 px-4 flex-col items-start gap-3">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-red-accent font-semibold">
            {discountPercentage}% Combo Discount
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs line-through text-muted-foreground tabular-nums">
              {formatPrice(originalTotal)}
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {formatPrice(discountedTotal)}
            </span>
            <span className="text-[10px] text-green-600 dark:text-green-400">
              Save {formatPrice(discountValue)}
            </span>
          </div>
        </div>

        <Button
          className="w-full rounded-none text-[10px] uppercase tracking-[0.15em]"
          disabled={!canAdd}
          onClick={() => {
            if (!selectedSizeA || !selectedSizeB) return;

            addCombo({
              comboId: combo.id,
              comboName: `${combo.productA.name} + ${combo.productB.name}`,
              discountPercentage,
              items: [
                {
                  id: combo.productA.id,
                  name: combo.productA.name,
                  price: Number(combo.productA.sellingPrice),
                  displayPrice: formatPrice(combo.productA.sellingPrice),
                  image: combo.productA.images?.[0] || "/clothes/placeholder.jpeg",
                  size: selectedSizeA,
                  color: selectedColorA || undefined,
                },
                {
                  id: combo.productB.id,
                  name: combo.productB.name,
                  price: Number(combo.productB.sellingPrice),
                  displayPrice: formatPrice(combo.productB.sellingPrice),
                  image: combo.productB.images?.[0] || "/clothes/placeholder.jpeg",
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
      </CardFooter>
    </Card>
  );
}

export function ComboSection() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCombos() {
      try {
        setLoading(true);
        const response = await fetch("/api/combos?limit=6");
        if (!response.ok) {
          throw new Error("Failed to load combos");
        }
        const data = await response.json();
        setCombos(data.combos || []);
      } catch (error) {
        console.error("Failed to fetch combos:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCombos();
  }, []);

  const hasCombos = useMemo(() => combos.length > 0, [combos.length]);

  if (!loading && !hasCombos) {
    return null;
  }

  return (
    <section className="py-20 md:py-28 px-6 md:px-12 bg-background">
      <div className="flex flex-col items-center mb-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium mb-3">Bundle deals</p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase">Combo</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      )}
    </section>
  );
}
