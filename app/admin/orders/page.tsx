import { getOrders } from "@/lib/actions/admin";
import { AdminOrdersClient } from "./orders-client";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await getOrders();
  return <AdminOrdersClient initialOrders={orders} />;
}
