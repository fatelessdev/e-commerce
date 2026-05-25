import { getDashboardStats } from "@/lib/actions/admin";
import { AdminDashboardClient } from "./dashboard-client";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  return <AdminDashboardClient initialStats={stats} />;
}
