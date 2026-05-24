import { getProducts } from "@/lib/actions/admin";
import { AdminProductsClient } from "./products-client";

export default async function ProductsPage() {
  const products = await getProducts();

  return <AdminProductsClient initialProducts={products} />;
}
