"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Mail, Search, Send, TestTube2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMarketingAudiencePreview,
  getMarketingCampaigns,
  getMarketingProductOptions,
  sendMarketingCampaign,
  sendMarketingTestEmail,
} from "@/lib/actions/marketing";
import { ADMIN_QUERY_OPTIONS } from "@/lib/admin-query-options";
import {
  DEFAULT_HIGH_SPENDER_MINIMUM,
  MARKETING_FINAL_SEND_LIMIT,
  MARKETING_PRODUCT_SELECTION_LIMIT,
  RECENT_BUYER_DAYS,
  type CampaignAudience,
  type CampaignDraftInput,
} from "@/lib/marketing/types";
import { cn } from "@/lib/utils";

type Campaign = Awaited<ReturnType<typeof getMarketingCampaigns>>[number];
type CustomerOption = {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  totalSpent: string;
};
type ProductOptionsPage = Awaited<ReturnType<typeof getMarketingProductOptions>>;
type ProductOption = ProductOptionsPage["items"][number];
type ProductFilter = "premium" | "bestSeller" | "new";

const PRODUCT_PICKER_PAGE_SIZE = 8;

const productFilterOptions: { label: string; value: ProductFilter }[] = [
  { label: "Premium", value: "premium" },
  { label: "Best seller", value: "bestSeller" },
  { label: "New", value: "new" },
];

const audienceOptions: { label: string; value: CampaignAudience["type"] }[] = [
  { label: "Selected", value: "selected" },
  { label: "All", value: "all" },
  { label: "Buyers", value: "buyers" },
  { label: "Non-buyers", value: "nonBuyers" },
  { label: "Recent", value: "recentBuyers" },
  { label: "High spend", value: "highSpenders" },
];

function audienceLabel(audience: Campaign["audience"]) {
  switch (audience.type) {
    case "selected":
      return `Selected (${audience.userIds?.length ?? 0})`;
    case "nonBuyers":
      return "Non-buyers";
    case "recentBuyers":
      return `Recent ${audience.days ?? RECENT_BUYER_DAYS}d`;
    case "highSpenders":
      return `High spend ₹${audience.minimumSpend ?? DEFAULT_HIGH_SPENDER_MINIMUM}`;
    case "buyers":
      return "Buyers";
    case "all":
      return "All";
  }
}

export function AdminCampaignsClient({
  initialCampaigns,
  customers,
  initialProducts,
}: {
  initialCampaigns: Campaign[];
  customers: CustomerOption[];
  initialProducts: ProductOptionsPage;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Shop now");
  const [ctaUrl, setCtaUrl] = useState("/new");
  const [audienceType, setAudienceType] = useState<CampaignAudience["type"]>("selected");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [recentDays, setRecentDays] = useState(RECENT_BUYER_DAYS);
  const [minimumSpend, setMinimumSpend] = useState(DEFAULT_HIGH_SPENDER_MINIMUM);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productFilters, setProductFilters] = useState<ProductFilter[]>([]);
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [selectedProductById, setSelectedProductById] = useState<Record<string, ProductOption>>({});
  const [lastTestSignature, setLastTestSignature] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedProductSearch(productSearch.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [productSearch]);

  const audience = useMemo<CampaignAudience>(() => {
    if (audienceType === "selected") {
      return { type: "selected", userIds: selectedUserIds };
    }
    if (audienceType === "recentBuyers") {
      return { type: "recentBuyers", days: recentDays };
    }
    if (audienceType === "highSpenders") {
      return { type: "highSpenders", minimumSpend };
    }
    return { type: audienceType };
  }, [audienceType, selectedUserIds, recentDays, minimumSpend]);

  const draft = useMemo<CampaignDraftInput>(() => ({
    name,
    subject,
    previewText,
    headline,
    body,
    ctaLabel,
    ctaUrl,
    productIds: selectedProductIds,
    audience,
  }), [name, subject, previewText, headline, body, ctaLabel, ctaUrl, selectedProductIds, audience]);

  const draftSignature = useMemo(() => JSON.stringify(draft), [draft]);
  const selectedAudienceReady = audience.type !== "selected" || audience.userIds.length > 0;

  const { data: campaigns = initialCampaigns } = useQuery({
    queryKey: ["admin-marketing-campaigns"],
    queryFn: getMarketingCampaigns,
    initialData: initialCampaigns,
    ...ADMIN_QUERY_OPTIONS,
  });

  const { data: preview, isFetching: isPreviewing } = useQuery({
    queryKey: ["admin-marketing-audience-preview", audience],
    queryFn: () => getMarketingAudiencePreview(audience),
    enabled: selectedAudienceReady,
    ...ADMIN_QUERY_OPTIONS,
  });

  const {
    data: productPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isFetchingProducts,
  } = useInfiniteQuery({
    queryKey: ["admin-marketing-product-options", debouncedProductSearch, productFilters],
    queryFn: ({ pageParam }) =>
      getMarketingProductOptions({
        search: debouncedProductSearch,
        filters: productFilters,
        limit: PRODUCT_PICKER_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialData: debouncedProductSearch || productFilters.length > 0
      ? undefined
      : {
          pages: [initialProducts],
          pageParams: [0],
        },
    ...ADMIN_QUERY_OPTIONS,
  });

  const testMutation = useMutation({
    mutationFn: () => sendMarketingTestEmail(draft),
    onSuccess: (result) => {
      setLastTestSignature(draftSignature);
      setNotice(`Test sent to ${result.email}`);
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : "Test email failed");
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => sendMarketingCampaign(draft),
    onSuccess: (result) => {
      setNotice(`Campaign ${result.status}: ${result.sentCount}/${result.recipientCount} sent`);
      setLastTestSignature(null);
      queryClient.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-marketing-audience-preview"] });
      router.refresh();
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : "Campaign send failed");
    },
  });

  const filteredCustomers = customers.filter((customer) => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return true;
    return `${customer.name} ${customer.email}`.toLowerCase().includes(query);
  });
  const visibleCustomers = [
    ...filteredCustomers.filter((customer) => selectedUserIds.includes(customer.id)),
    ...filteredCustomers.filter((customer) => !selectedUserIds.includes(customer.id)),
  ];

  const loadedProductOptions = productPages?.pages.flatMap((page) => page.items) ?? initialProducts.items;
  const loadedProductById = new Map(loadedProductOptions.map((product) => [product.id, product]));
  const selectedProductOptions = selectedProductIds
    .map((id) => selectedProductById[id] ?? loadedProductById.get(id))
    .filter(Boolean) as ProductOption[];
  const productOptions = [
    ...selectedProductOptions,
    ...loadedProductOptions.filter((product) => !selectedProductIds.includes(product.id)),
  ];

  const canSend =
    preview &&
    preview.count > 0 &&
    preview.count <= MARKETING_FINAL_SEND_LIMIT &&
    lastTestSignature === draftSignature &&
    !sendMutation.isPending;

  const toggleUser = (userId: string) => {
    setLastTestSignature(null);
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  };

  const toggleProductFilter = (filter: ProductFilter) => {
    setProductFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]
    );
  };

  const toggleProduct = (product: ProductOption) => {
    setLastTestSignature(null);
    const productId = product.id;
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : current.length >= MARKETING_PRODUCT_SELECTION_LIMIT
          ? current
          : [...current, productId]
    );
    setSelectedProductById((current) => {
      if (selectedProductIds.includes(productId)) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      if (selectedProductIds.length >= MARKETING_PRODUCT_SELECTION_LIMIT) return current;
      return { ...current, [productId]: product };
    });
    if (
      selectedProductIds.length >= MARKETING_PRODUCT_SELECTION_LIMIT &&
      !selectedProductIds.includes(productId)
    ) {
      setNotice(`Campaign emails can feature up to ${MARKETING_PRODUCT_SELECTION_LIMIT} products.`);
    }
  };

  const sendCampaign = () => {
    const count = preview?.count ?? 0;
    if (!confirm(`Send this campaign to ${count} recipients?`)) return;
    sendMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-2 py-10 sm:px-4 md:py-14">
      <div className="border-b border-border/40 pb-7">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
          XILAR LEDGER // CAMPAIGN DESK
        </span>
        <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tight md:text-6xl">
              Campaigns
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Compose Resend-powered customer emails with audience controls, test sends, and delivery logs.
            </p>
          </div>
          <div className="border border-border/40 px-5 py-4 text-sm">
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Audience</p>
            <p className="mt-1 text-2xl font-black tabular-nums">
              {isPreviewing ? "..." : (preview?.count ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {notice && (
        <div className="border border-border/50 bg-secondary/20 px-4 py-3 text-sm text-foreground">
          {notice}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Campaign name</span>
              <input value={name} onChange={(event) => { setLastTestSignature(null); setName(event.target.value); }} className="h-11 w-full border border-input bg-secondary/20 px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Subject</span>
              <input value={subject} onChange={(event) => { setLastTestSignature(null); setSubject(event.target.value); }} className="h-11 w-full border border-input bg-secondary/20 px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preview text</span>
              <input value={previewText} onChange={(event) => { setLastTestSignature(null); setPreviewText(event.target.value); }} className="h-11 w-full border border-input bg-secondary/20 px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Headline</span>
              <input value={headline} onChange={(event) => { setLastTestSignature(null); setHeadline(event.target.value); }} className="h-11 w-full border border-input bg-secondary/20 px-3 text-sm uppercase outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Body</span>
              <textarea value={body} onChange={(event) => { setLastTestSignature(null); setBody(event.target.value); }} rows={8} className="w-full border border-input bg-secondary/20 px-3 py-3 text-sm leading-6 outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">CTA label</span>
              <input value={ctaLabel} onChange={(event) => { setLastTestSignature(null); setCtaLabel(event.target.value); }} className="h-11 w-full border border-input bg-secondary/20 px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">CTA URL</span>
              <input value={ctaUrl} onChange={(event) => { setLastTestSignature(null); setCtaUrl(event.target.value); }} className="h-11 w-full border border-input bg-secondary/20 px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
            </label>
          </div>

          <div className="space-y-3 border-y border-border/30 py-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em]">Featured products</h2>
              <span className="text-xs text-muted-foreground">
                {selectedProductIds.length}/{MARKETING_PRODUCT_SELECTION_LIMIT} selected
              </span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search products"
                className="h-11 w-full border border-input bg-secondary/20 pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {productFilterOptions.map((filter) => {
                const active = productFilters.includes(filter.value);

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => toggleProductFilter(filter.value)}
                    className={cn(
                      "h-8 border px-3 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <div className="h-[360px] overflow-y-auto border border-border/30 bg-secondary/5 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {productOptions.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const selectionLimitReached = selectedProductIds.length >= MARKETING_PRODUCT_SELECTION_LIMIT;

                  return (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => toggleProduct(product)}
                      disabled={!isSelected && selectionLimitReached}
                      className={cn(
                        "flex min-h-20 items-center gap-3 border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border/40 bg-background/60 hover:bg-secondary/25"
                      )}
                    >
                      <div className="h-14 w-11 shrink-0 overflow-hidden bg-secondary">
                        {product.image ? (
                          <Image src={product.image} alt="" width={44} height={56} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs opacity-70">
                          <span>₹{product.sellingPrice}</span>
                          {product.isPremium && <span>Premium</span>}
                          {product.isFeatured && <span>Best seller</span>}
                          {product.isNew && <span>New</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {productOptions.length === 0 && !isFetchingProducts && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No products found.
                </div>
              )}
              {(hasNextPage || isFetchingProducts) && (
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    disabled={!hasNextPage || isFetchingNextPage}
                  >
                    {isFetchingNextPage || (isFetchingProducts && productOptions.length === 0) ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Load more
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="border border-border/40 bg-card/10 p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em]">Audience</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {audienceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { setLastTestSignature(null); setAudienceType(option.value); }}
                  className={cn(
                    "h-10 border text-[10px] font-bold uppercase tracking-[0.16em] transition-colors",
                    audienceType === option.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {audienceType === "selected" && (
              <div className="mt-4 space-y-3">
                <input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Search customers"
                  className="h-10 w-full border border-input bg-secondary/20 px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{selectedUserIds.length} selected</span>
                  <span>{visibleCustomers.length} eligible</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Admin accounts are excluded from marketing audiences.
                </p>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {visibleCustomers.map((customer) => (
                    <label key={customer.id} className="flex cursor-pointer items-center gap-3 border border-border/30 p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(customer.id)}
                        onChange={() => toggleUser(customer.id)}
                        className="size-4 accent-foreground"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{customer.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{customer.email}</span>
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">{customer.ordersCount}</span>
                    </label>
                  ))}
                  {visibleCustomers.length === 0 && (
                    <div className="border border-border/30 p-4 text-center text-sm text-muted-foreground">
                      No customers found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {audienceType === "recentBuyers" && (
              <label className="mt-4 block space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Days</span>
                <input type="number" min={1} max={365} value={recentDays} onChange={(event) => { setLastTestSignature(null); setRecentDays(Number(event.target.value)); }} className="h-10 w-full border border-input bg-secondary/20 px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
              </label>
            )}

            {audienceType === "highSpenders" && (
              <label className="mt-4 block space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Minimum spend</span>
                <input type="number" min={1} value={minimumSpend} onChange={(event) => { setLastTestSignature(null); setMinimumSpend(Number(event.target.value)); }} className="h-10 w-full border border-input bg-secondary/20 px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
              </label>
            )}

            <div className="mt-5 border-t border-border/30 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Eligible recipients</span>
                <span className="font-mono text-lg font-bold">{isPreviewing ? "..." : (preview?.count ?? 0)}</span>
              </div>
              {preview?.capped && (
                <p className="mt-2 text-xs text-destructive">Audience exceeds the v1 cap of {MARKETING_FINAL_SEND_LIMIT}.</p>
              )}
              {preview?.sample && preview.sample.length > 0 && (
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {preview.sample.slice(0, 5).map((recipient) => (
                    <p key={recipient.email} className="truncate">{recipient.name} · {recipient.email}</p>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3 border border-border/40 bg-card/10 p-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="w-full justify-center"
            >
              {testMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube2 className="mr-2 h-4 w-4" />}
              Send Test
            </Button>
            <Button
              type="button"
              onClick={sendCampaign}
              disabled={!canSend}
              className="w-full justify-center"
            >
              {sendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Campaign
            </Button>
            {lastTestSignature !== draftSignature && (
              <p className="text-xs text-muted-foreground">Send a test after your latest edits before final delivery.</p>
            )}
          </section>
        </aside>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-[0.18em]">History</h2>
        </div>
        <div className="overflow-x-auto border border-border/40">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/20 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="p-4">Campaign</th>
                <th className="p-4">Audience</th>
                <th className="p-4">Status</th>
                <th className="p-4">Sent</th>
                <th className="p-4">Failed</th>
                <th className="p-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No campaigns sent yet.</td>
                </tr>
              ) : campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-border/30 last:border-0">
                  <td className="p-4">
                    <p className="font-semibold">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">{campaign.subject}</p>
                  </td>
                  <td className="p-4 text-sm">{audienceLabel(campaign.audience)}</td>
                  <td className="p-4 text-sm uppercase tracking-[0.12em]">{campaign.status}</td>
                  <td className="p-4 font-mono text-sm">{campaign.sentCount}/{campaign.recipientCount}</td>
                  <td className="p-4 font-mono text-sm">{campaign.failedCount}</td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(campaign.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
