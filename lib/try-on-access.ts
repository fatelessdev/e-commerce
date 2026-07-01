import { requireAuth } from "@/lib/auth-server";

export async function requireTryOnAccess() {
  const session = await requireAuth();

  // Temporary v1 gate. Keep this policy isolated so public signed-in rollout can
  // replace it with generation allowances without moving routes or data.
  if (session.user.role !== "admin") {
    throw new Error("Forbidden: Try-on testing is currently admin-only");
  }

  return session;
}
