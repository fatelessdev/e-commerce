import { WishlistClient } from "@/components/features/wishlist-client";
import { getServerSession } from "@/lib/auth-server";
import { getWishlistProducts } from "@/lib/wishlist";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await getServerSession();
  const initialItems = session?.user?.id
    ? await getWishlistProducts(session.user.id)
    : [];

  return (
    <WishlistClient
      initialAuthenticated={Boolean(session?.user?.id)}
      initialItems={initialItems}
    />
  );
}
