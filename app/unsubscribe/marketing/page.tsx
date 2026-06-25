import { redirect } from "next/navigation";
import { unsubscribeFromMarketing } from "@/lib/actions/marketing";

export const dynamic = "force-dynamic";

export default async function MarketingUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string; email?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  async function confirmUnsubscribe() {
    "use server";
    const result = await unsubscribeFromMarketing(token);
    if (!result.success) {
      redirect("/unsubscribe/marketing?status=invalid");
    }
    redirect(`/unsubscribe/marketing?status=success&email=${encodeURIComponent(result.email ?? "")}`);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-20 text-foreground">
      <div className="mx-auto max-w-xl border-y border-border/40 py-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
          XILAR // EMAIL PREFERENCES
        </p>
        <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-tight">
          Marketing Emails
        </h1>

        {params.status === "success" ? (
          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            {params.email ? `${params.email} has` : "You have"} been unsubscribed from XILAR marketing emails.
          </p>
        ) : params.status === "invalid" || !token ? (
          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            This unsubscribe link is invalid or expired.
          </p>
        ) : (
          <form action={confirmUnsubscribe} className="mt-7 space-y-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Confirm that you want to stop receiving XILAR drop announcements, promos, and product emails.
            </p>
            <button
              type="submit"
              className="h-11 bg-foreground px-5 text-[10px] font-bold uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
            >
              Unsubscribe
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
