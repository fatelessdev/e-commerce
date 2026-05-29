import { getProductsPage } from "@/lib/actions/admin";
import { AdminProductsClient } from "./products-client";
import { ADMIN_PRODUCTS_PAGE_SIZE } from "@/lib/admin-products-pagination";

export default async function ProductsPage() {
  const initialPage = await getProductsPage({ limit: ADMIN_PRODUCTS_PAGE_SIZE });

  return <AdminProductsClient initialPage={initialPage} />;
}
