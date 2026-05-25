"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateOrderStatus } from "@/lib/actions/admin";

const statuses = [
  { value: "pending", label: "Pending", color: "bg-yellow-500/10 text-yellow-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500/10 text-blue-500" },
  { value: "processing", label: "Processing", color: "bg-purple-500/10 text-purple-500" },
  { value: "shipped", label: "Shipped", color: "bg-cyan-500/10 text-cyan-500" },
  { value: "delivered", label: "Delivered", color: "bg-green-500/10 text-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/10 text-red-500" },
];

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(
        orderId,
        newStatus as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
      );
      setStatus(newStatus);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusConfig = statuses.find((s) => s.value === status);

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isUpdating}
      className={`px-2 py-1 rounded text-sm font-medium border-0 cursor-pointer ${
        currentStatusConfig?.color || "bg-muted"
      }`}
    >
      {statuses.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
