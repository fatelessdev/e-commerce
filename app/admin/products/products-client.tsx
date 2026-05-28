"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProduct, getProducts } from "@/lib/actions/admin";
import { normalizeProductImage } from "@/lib/image";

type AdminProduct = Awaited<ReturnType<typeof getProducts>>[number];

function invalidateProductSurfaces(queryClient: ReturnType<typeof useQueryClient>, productId?: string) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const [scope] = query.queryKey;
      return (
        scope === "products" ||
        scope === "shop-products" ||
        scope === "shop-catalog" ||
        scope === "shop-the-reels" ||
        scope === "combos" ||
        scope === "combo" ||
        scope === "admin-products" ||
        scope === "admin-dashboard" ||
        (scope === "product" && (!productId || query.queryKey[1] === productId))
      );
    },
  });

  if (productId) {
    queryClient.removeQueries({ queryKey: ["product", productId] });
  }
}

export function AdminProductsClient({ initialProducts }: { initialProducts: AdminProduct[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getProducts(),
    initialData: initialProducts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-products"] });
      const previousProducts = queryClient.getQueryData<AdminProduct[]>(["admin-products"]);
      queryClient.setQueryData<AdminProduct[]>(["admin-products"], (current = []) =>
        current.filter((product) => product.id !== productId)
      );
      return { previousProducts };
    },
    onError: (_error, _productId, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(["admin-products"], context.previousProducts);
      }
      alert("Failed to delete product");
    },
    onSuccess: (_result, productId) => {
      invalidateProductSurfaces(queryClient, productId);
      router.refresh();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const handleDelete = (product: AdminProduct) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    deleteMutation.mutate(product.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium">Product</th>
              <th className="text-left p-4 font-medium">Category</th>
              <th className="text-left p-4 font-medium">Price</th>
              <th className="text-left p-4 font-medium">Stock</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No products yet. Add your first product to get started.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isDeleting = deleteMutation.variables === product.id && deleteMutation.isPending;

                return (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <Image
                            src={normalizeProductImage(product.images[0])}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded object-cover"
                            unoptimized
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="capitalize">{product.category}</span>
                      <span className="text-muted-foreground"> / {product.gender}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">₹{product.sellingPrice}</div>
                      {product.mrp !== product.sellingPrice && (
                        <div className="text-sm text-muted-foreground line-through">
                          ₹{product.mrp}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={product.stock > 0 ? "" : "text-destructive"}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      {product.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-500">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                          Inactive
                        </span>
                      )}
                      {product.isNew && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                          New
                        </span>
                      )}
                      {product.isFeatured && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-red-accent/10 px-2 py-1 text-xs text-red-accent">
                          Best Seller
                        </span>
                      )}
                      {product.isPremium && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-600 dark:text-amber-400">
                          Premium
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="icon" aria-label="Edit product">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product)}
                          disabled={isDeleting}
                          className="text-destructive hover:text-destructive disabled:cursor-not-allowed"
                          aria-label="Delete product"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
