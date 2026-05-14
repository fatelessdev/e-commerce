import { getProducts } from "@/lib/actions/admin";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { DeleteProductButton } from "./delete-button";
import { normalizeProductImage } from "@/lib/image";

export default async function ProductsPage() {
  const products = await getProducts();

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

      {/* Products Table */}
      <div className="border rounded-lg">
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
              products.map((product) => (
                <tr key={product.id} className="border-b last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] && (
                        <Image
                          src={normalizeProductImage(product.images[0])}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded"
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
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        Inactive
                      </span>
                    )}
                    {product.isNew && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        New
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-accent/10 text-red-accent">
                        Best Seller
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="ghost" size="icon" aria-label={`Edit ${product.name}`}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </Link>
                      <DeleteProductButton productId={product.id} productName={product.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
