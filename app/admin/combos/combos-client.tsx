"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProducts } from "@/lib/actions/admin";
import { createCombo, deleteCombo, getAdminCombos, updateCombo } from "@/lib/actions/combos";

type AdminCombo = Awaited<ReturnType<typeof getAdminCombos>>[number];
type AdminProduct = Awaited<ReturnType<typeof getProducts>>[number];

export function AdminCombosClient({
  initialCombos,
  initialProducts,
}: {
  initialCombos: AdminCombo[];
  initialProducts: AdminProduct[];
}) {
  const queryClient = useQueryClient();
  const { data: comboRows = initialCombos } = useQuery({
    queryKey: ["admin-combos"],
    queryFn: getAdminCombos,
    initialData: initialCombos,
  });
  const { data: productRows = initialProducts } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getProducts({ isActive: true, limit: 200 }),
    initialData: initialProducts,
  });

  const invalidateCombos = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-combos"] });
    queryClient.invalidateQueries({ queryKey: ["combos"] });
    queryClient.invalidateQueries({ queryKey: ["combo"] });
    queryClient.invalidateQueries({ queryKey: ["product"] });
  };

  const createMutation = useMutation({
    mutationFn: createCombo,
    onSuccess: invalidateCombos,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { discountAmount: number; displayOrder: number; isActive: boolean } }) =>
      updateCombo(id, updates),
    onSuccess: invalidateCombos,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCombo,
    onSuccess: invalidateCombos,
  });

  const clothingProducts = productRows.filter((product) => product.category !== "accessory");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Combos</h1>
        <p className="text-muted-foreground">
          Pair two clothing products and set a max bargain discount amount.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Create Combo</CardTitle></CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              createMutation.mutate({
                productAId: String(formData.get("productAId") || ""),
                productBId: String(formData.get("productBId") || ""),
                discountAmount: Number(formData.get("discountAmount") || "0"),
                displayOrder: Number(formData.get("displayOrder") || "0"),
              });
              event.currentTarget.reset();
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Product A</label>
              <select name="productAId" required className="w-full px-3 py-2 border rounded-lg bg-background">
                <option value="">Select product</option>
                {clothingProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Product B</label>
              <select name="productBId" required className="w-full px-3 py-2 border rounded-lg bg-background">
                <option value="">Select product</option>
                {clothingProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Bargain Discount (₹)</label>
              <input type="number" name="discountAmount" min="0" step="0.01" required defaultValue="0" className="w-full px-3 py-2 border rounded-lg bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Order</label>
              <input type="number" name="displayOrder" min="0" step="1" defaultValue="0" className="w-full px-3 py-2 border rounded-lg bg-background" />
            </div>
            <div className="md:col-span-4">
              <Button type="submit" disabled={createMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Create Combo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Existing Combos</CardTitle></CardHeader>
        <CardContent>
          {comboRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No combos yet.</p>
          ) : (
            <div className="space-y-3">
              {comboRows.map((combo) => (
                <div key={combo.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-medium">
                      {combo.productA?.name || "Missing Product A"} + {combo.productB?.name || "Missing Product B"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {combo.productA ? `₹${combo.productA.sellingPrice}` : "N/A"} + {combo.productB ? `₹${combo.productB.sellingPrice}` : "N/A"}
                    </p>
                    <p className="text-xs text-red-accent">
                      Max bargain discount: ₹{Number(combo.discountAmount).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full">
                    <form
                      className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-end w-full sm:w-auto"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        updateMutation.mutate({
                          id: combo.id,
                          updates: {
                            discountAmount: Number(formData.get("discountAmount") || "0"),
                            displayOrder: Number(formData.get("displayOrder") || "0"),
                            isActive: formData.get("isActive") === "on",
                          },
                        });
                      }}
                    >
                      <div className="space-y-1 col-span-1">
                        <label className="text-xs text-muted-foreground">Max Bargain Discount (₹)</label>
                        <input type="number" name="discountAmount" min="0" step="0.01" defaultValue={Number(combo.discountAmount)} className="w-full sm:w-28 px-3 py-2 border rounded-lg bg-background text-sm" />
                      </div>
                      <div className="space-y-1 col-span-1">
                        <label className="text-xs text-muted-foreground">Display Order</label>
                        <input type="number" name="displayOrder" min="0" step="1" defaultValue={combo.displayOrder} className="w-full sm:w-28 px-3 py-2 border rounded-lg bg-background text-sm" />
                      </div>
                      <label className="flex items-center gap-2 pb-2 text-sm col-span-2">
                        <input type="checkbox" name="isActive" defaultChecked={combo.isActive} />
                        Active
                      </label>
                      <Button type="submit" variant="outline" size="sm" className="col-span-2 sm:w-auto" disabled={updateMutation.isPending}>Save</Button>
                    </form>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="w-full sm:w-auto h-9"
                      onClick={() => deleteMutation.mutate(combo.id)}
                      disabled={deleteMutation.variables === combo.id && deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
