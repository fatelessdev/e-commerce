import {
  getMarketingCampaigns,
  getMarketingCustomerOptions,
  getMarketingProductOptions,
} from "@/lib/actions/marketing";
import { AdminCampaignsClient } from "./campaigns-client";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [campaigns, customers, products] = await Promise.all([
    getMarketingCampaigns(),
    getMarketingCustomerOptions(),
    getMarketingProductOptions({ limit: 8 }),
  ]);

  return (
    <AdminCampaignsClient
      initialCampaigns={campaigns}
      customers={customers}
      initialProducts={products}
    />
  );
}
