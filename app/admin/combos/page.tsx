import { getProducts } from "@/lib/actions/admin";
import { createCombo, deleteCombo, getAdminCombos, updateCombo } from "@/lib/actions/combos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

async function createComboAction(formData: FormData) {
  "use server";

  const productAId = String(formData.get("productAId") || "");
  const productBId = String(formData.get("productBId") || "");
  const discountAmount = Number(formData.get("discountAmount") || "0");
  const displayOrder = Number(formData.get("displayOrder") || "0");

  await createCombo({
    productAId,
    productBId,
    discountAmount,
    displayOrder,
  });
}

async function updateComboAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  const discountAmount = Number(formData.get("discountAmount") || "0");
  const displayOrder = Number(formData.get("displayOrder") || "0");
  const isActive = formData.get("isActive") === "on";

  await updateCombo(id, {
    discountAmount,
    displayOrder,
    isActive,
  });
}

async function deleteComboAction(formData: FormData) {
  "use server";
  await deleteCombo(String(formData.get("id") || ""));
}

export default async function AdminCombosPage() {
  const [comboRows, productRows] = await Promise.all([
    getAdminCombos(),
    getProducts({ isActive: true, limit: 200 }),
  ]);

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
        <CardHeader>
          <CardTitle>Create Combo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createComboAction} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product A</label>
              <select
                name="productAId"
                required
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="">Select product</option>
                {clothingProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product B</label>
              <select
                name="productBId"
                required
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="">Select product</option>
                {clothingProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Bargain Discount (₹)</label>
              <input
                type="number"
                name="discountAmount"
                min="0"
                step="0.01"
                required
                defaultValue="0"
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Display Order</label>
              <input
                type="number"
                name="displayOrder"
                min="0"
                step="1"
                defaultValue="0"
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
            </div>

            <div className="md:col-span-4">
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Create Combo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Combos</CardTitle>
        </CardHeader>
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

                  <div className="flex flex-wrap gap-3">
                    <form action={updateComboAction} className="flex flex-wrap gap-3 items-end">
                      <input type="hidden" name="id" value={combo.id} />

                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Max Bargain Discount (₹)</label>
                        <input
                          type="number"
                          name="discountAmount"
                          min="0"
                          step="0.01"
                          defaultValue={Number(combo.discountAmount)}
                          className="w-28 px-3 py-2 border rounded-lg bg-background text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Display Order</label>
                        <input
                          type="number"
                          name="displayOrder"
                          min="0"
                          step="1"
                          defaultValue={combo.displayOrder}
                          className="w-28 px-3 py-2 border rounded-lg bg-background text-sm"
                        />
                      </div>

                      <label className="flex items-center gap-2 pb-2 text-sm">
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={combo.isActive}
                        />
                        Active
                      </label>

                      <Button type="submit" variant="outline" size="sm">
                        Save
                      </Button>
                    </form>

                    <form action={deleteComboAction}>
                      <input type="hidden" name="id" value={combo.id} />
                      <Button type="submit" variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </form>
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
