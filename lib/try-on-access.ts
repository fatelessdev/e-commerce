import { requireAuth } from "@/lib/auth-server";

export async function requireTryOnAccess() {
  return requireAuth();
}
