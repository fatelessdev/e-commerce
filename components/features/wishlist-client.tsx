"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { removeWishlistItem } from "@/lib/actions/wishlist";
import { normalizeProductImage } from "@/lib/image";
import { buildProductPath } from "@/lib/seo";
import type { WishlistProductItem } from "@/lib/wishlist";

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function EmptyWishlist() {
  return (
    <div className="py-24 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
        <Heart className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="mb-1 text-sm font-medium">No saved items yet</p>
      <p className="mx-auto mb-6 max-w-[260px] text-xs text-muted-foreground">
        Tap the heart icon on any product to save it here.
      </p>
      <Button asChild variant="outline" className="rounded-none text-xs uppercase tracking-[0.1em]">
        <Link href="/shop">Browse products</Link>
      </Button>
    </div>
  );
}

export function WishlistClient({
  initialAuthenticated,
  initialItems,
}: {
  initialAuthenticated: boolean;
  initialItems: WishlistProductItem[];
}) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(initialItems);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const removeItem = async (productId: string) => {
    setPendingProductId(productId);
    setError(null);
    const result = await removeWishlistItem(productId);

    if (!result.success) {
      setError(result.error);
      setPendingProductId(null);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== productId));
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wishlist-nav"] }),
      queryClient.invalidateQueries({ queryKey: ["wishlist-product", productId] }),
    ]);
    setPendingProductId(null);
  };

  return (
    <div className="min-h-screen">
      <div className="border-b border-border/60 px-6 py-14 md:px-12 md:py-20">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">Saved</p>
        <h1 className="font-display text-4xl md:text-6xl">Wishlist</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {initialAuthenticated ? `${items.length} saved items` : "Sign in to save products across devices"}
        </p>
      </div>

      <div className="p-6 md:px-12">
        {error && (
          <div className="mb-6 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!initialAuthenticated ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
              <Heart className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mb-1 text-sm font-medium">Sign in to view your wishlist</p>
            <p className="mx-auto mb-6 max-w-[300px] text-xs text-muted-foreground">
              Wishlist is account-backed, so saved products follow you across devices.
            </p>
            <Button asChild variant="outline" className="rounded-none text-xs uppercase tracking-[0.1em]">
              <Link href="/account?redirect=/wishlist">Sign in</Link>
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {items.map((item) => (
              <Card key={item.id} className="rounded-none border-0 bg-transparent">
                <CardContent className="relative aspect-[3/4] overflow-hidden bg-muted/30 p-0">
                  <Link href={buildProductPath(item.slug)}>
                    <Image
                      src={normalizeProductImage(item.images[0])}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105"
                    />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-3 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                    aria-label={`Remove ${item.name} from wishlist`}
                    disabled={pendingProductId === item.id}
                    onClick={() => void removeItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
                <CardFooter className="flex flex-col items-start space-y-3 px-1 pb-2 pt-4 sm:px-2">
                  <div className="w-full space-y-1">
                    <h3 className="text-sm font-medium leading-tight tracking-tight">{item.name}</h3>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold tabular-nums">{formatPrice(item.sellingPrice)}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${item.stock > 0 ? "text-muted-foreground" : "text-red-accent"}`}>
                        {item.stock > 0 ? "In stock" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="h-10 w-full rounded-none text-[10px] uppercase tracking-[0.15em]">
                    <Link href={buildProductPath(item.slug)}>Choose variant</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
