"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCoupon } from "@/lib/actions/admin";

export function DeleteCouponButton({
  couponId,
  couponCode,
}: {
  couponId: string;
  couponCode: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCoupon(couponId);
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      alert("Failed to delete coupon");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Delete coupon"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-destructive hover:text-destructive"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
