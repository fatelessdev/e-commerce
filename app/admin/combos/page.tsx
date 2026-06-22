import { getProducts } from "@/lib/actions/admin";
import { getAdminCombos } from "@/lib/actions/combos";
import { AdminCombosClient } from "./combos-client";

export const dynamic = "force-dynamic";

export default async function AdminCombosPage() {
  const [comboRows, productRows] = await Promise.all([
    getAdminCombos(),
    getProducts({ isActive: true, limit: 200 }),
  ]);

  return <AdminCombosClient initialCombos={comboRows} initialProducts={productRows} />;
}
