import { getDashboardStats } from "@/lib/actions/admin";
import { AdminDashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  return <AdminDashboardClient initialStats={stats} />;
}
