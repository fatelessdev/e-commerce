"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCoupon, getCoupons } from "@/lib/actions/admin";

type AdminCoupon = Awaited<ReturnType<typeof getCoupons>>[number];

export function AdminCouponsClient({ initialCoupons }: { initialCoupons: AdminCoupon[] }) {
  const queryClient = useQueryClient();
  const { data: coupons = initialCoupons } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => getCoupons(),
    initialData: initialCoupons,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });

  const handleDelete = (coupon: AdminCoupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
    deleteMutation.mutate(coupon.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes and promotions</p>
        </div>
        <Link href="/admin/coupons/new">
          <Button><Plus className="h-4 w-4 mr-2" />Create Coupon</Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium">Code</th>
              <th className="text-left p-4 font-medium">Discount</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Min Order</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Usage</th>
              <th className="text-left p-4 font-medium hidden md:table-cell">Valid Until</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Status</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No coupons yet. Create your first coupon to offer discounts.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const isDeleting = deleteMutation.variables === coupon.id && deleteMutation.isPending;
                return (
                  <tr key={coupon.id} className="border-b last:border-0">
                    <td className="p-4">
                      <span className="font-mono font-bold">{coupon.code}</span>
                      {coupon.isBargainGenerated && <span className="ml-2 text-xs text-muted-foreground">(AI Generated)</span>}
                    </td>
                    <td className="p-4">
                      {coupon.discountType === "percentage" ? (
                        <>
                          {coupon.discountValue}%
                          {coupon.maxDiscount && <span className="text-muted-foreground text-sm"> (max ₹{coupon.maxDiscount})</span>}
                        </>
                      ) : <>₹{coupon.discountValue}</>}
                    </td>
                    <td className="p-4 hidden sm:table-cell">{coupon.minOrderValue ? `₹${coupon.minOrderValue}` : "-"}</td>
                    <td className="p-4 hidden sm:table-cell">{coupon.usedCount}{coupon.maxUses && ` / ${coupon.maxUses}`}</td>
                    <td className="p-4 hidden md:table-cell">{coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : "No expiry"}</td>
                    <td className="p-4 hidden sm:table-cell">
                      {coupon.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">Inactive</span>
                      )}
                      {coupon.forNewUsersOnly && <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">New Users</span>}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon)}
                        disabled={isDeleting}
                        className="text-destructive hover:text-destructive"
                        aria-label="Delete coupon"
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
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
