import { getCoupons } from "@/lib/actions/admin";
import { AdminCouponsClient } from "./coupons-client";

export default async function CouponsPage() {
  const coupons = await getCoupons();
  return <AdminCouponsClient initialCoupons={coupons} />;
}
