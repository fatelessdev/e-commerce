"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCoupon, type CouponInput } from "@/lib/actions/admin";
import { Loader2 } from "lucide-react";

export default function NewCouponPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    discountType: "fixed" as "fixed" | "percentage",
    discountValue: "",
    maxDiscount: "",
    minOrderValue: "",
    validUntil: "",
    maxUses: "",
    forNewUsersOnly: false,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const couponData: CouponInput = {
        code: formData.code,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        maxDiscount: formData.maxDiscount || undefined,
        minOrderValue: formData.minOrderValue || undefined,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        forNewUsersOnly: formData.forNewUsersOnly,
        isActive: formData.isActive,
      };

      await createCoupon(couponData);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
      router.push("/admin/coupons");
      router.refresh();
    } catch (err) {
      console.error("Failed to create coupon:", err);
      setError(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Coupon</h1>
        <p className="text-muted-foreground">
          Create a new discount code for your customers
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Coupon Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Coupon Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 border rounded-lg bg-background uppercase"
                placeholder="XILAR10"
              />
              <p className="text-xs text-muted-foreground">
                Customers will enter this code at checkout
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Type *</label>
                <select
                  required
                  value={formData.discountType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountType: e.target.value as "fixed" | "percentage",
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="fixed">Fixed Amount (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Discount Value *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step={formData.discountType === "percentage" ? "1" : "0.01"}
                  max={formData.discountType === "percentage" ? "100" : undefined}
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({ ...formData, discountValue: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder={formData.discountType === "percentage" ? "10" : "100"}
                />
              </div>
            </div>

            {formData.discountType === "percentage" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={(e) =>
                    setFormData({ ...formData, maxDiscount: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum discount amount for percentage-based coupons
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Order Value (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minOrderValue}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderValue: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg bg-background"
                placeholder="2500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valid Until</label>
                <input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Uses</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUses: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.forNewUsersOnly}
                  onChange={(e) =>
                    setFormData({ ...formData, forNewUsersOnly: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">New users only</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Coupon"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
