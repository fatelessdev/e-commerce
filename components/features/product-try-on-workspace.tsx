"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, Download, Loader2, Sparkles, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getRequiredTryOnMode,
  isTryOnBodyModeAllowed,
  type TryOnBodyMode,
} from "@/lib/try-on";

type TryOnRun = {
  id: string;
  bodyImageUrl: string;
  outputImageUrl: string;
  productImageUrl: string;
  productImageIndex: number;
  tryOnMode: TryOnBodyMode;
  modelId: string;
  createdAt: string;
};

type ProductTryOnWorkspaceProps = {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    category: string;
    images: string[];
  };
};

const BODY_MODE_LABELS: Record<TryOnBodyMode, string> = {
  upper: "Upper",
  lower: "Lower",
  full: "Full",
};

function formatRunDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function readJsonResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (contentType.includes("application/json") && text) {
    return JSON.parse(text) as T;
  }

  if (!res.ok) {
    throw new Error(fallbackError);
  }

  return {} as T;
}

export function ProductTryOnWorkspace({ open, onClose, product }: ProductTryOnWorkspaceProps) {
  const shouldReduceMotion = useReducedMotion();
  const requiredMode = getRequiredTryOnMode(product.category);
  const allowedModes = useMemo(
    () => (["upper", "lower", "full"] as TryOnBodyMode[]).filter((mode) => isTryOnBodyModeAllowed(requiredMode, mode)),
    [requiredMode],
  );
  const [productImageIndex, setProductImageIndex] = useState(0);
  const [bodyMode, setBodyMode] = useState<TryOnBodyMode>(allowedModes[0] ?? "full");
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [runs, setRuns] = useState<TryOnRun[]>([]);
  const [latestRun, setLatestRun] = useState<TryOnRun | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!allowedModes.includes(bodyMode)) {
      setBodyMode(allowedModes[0] ?? "full");
    }
  }, [allowedModes, bodyMode]);

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingRuns(true);
    setError(null);

    fetch(`/api/products/${product.id}/try-ons`)
      .then(async (res) => {
        const payload = await readJsonResponse<{ error?: string; runs?: TryOnRun[] }>(res, "Could not load previews.");
        if (!res.ok) throw new Error(payload.error || "Could not load previews.");
        if (!cancelled) setRuns(payload.runs ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load previews.");
      })
      .finally(() => {
        if (!cancelled) setLoadingRuns(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, product.id]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !portalTarget) return null;

  const selectedProductImage = product.images[productImageIndex] ?? product.images[0];
  const isUnsupported = requiredMode === "unsupported";
  const inputFrameClass = "relative aspect-[3/4] w-full overflow-hidden bg-muted/25";
  const resultFrameClass = "relative aspect-[3/4] w-full overflow-hidden bg-muted/25";
  const downloadFileName = `xilar-${
    product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "try-on"
  }-preview.jpg`;

  async function handleGenerate() {
    if (!file || isUnsupported) return;

    setGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("bodyImage", file);
      formData.append("productImageIndex", String(productImageIndex));
      formData.append("bodyMode", bodyMode);

      const res = await fetch(`/api/products/${product.id}/try-ons`, {
        method: "POST",
        body: formData,
      });
      const payload = await readJsonResponse<{ error?: string; run?: TryOnRun }>(res, "Could not generate preview.");

      if (!res.ok || !payload.run) {
        throw new Error(payload.error || "Could not generate preview.");
      }

      const run = payload.run;
      setLatestRun(run);
      setRuns((current) => [run, ...current.filter((savedRun) => savedRun.id !== run.id)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate preview.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(runId: string) {
    setDeletingId(runId);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}/try-ons/${runId}`, {
        method: "DELETE",
      });
      const payload = await readJsonResponse<{ error?: string }>(res, "Could not delete preview.");

      if (!res.ok) {
        throw new Error(payload.error || "Could not delete preview.");
      }

      setRuns((current) => current.filter((run) => run.id !== runId));
      setLatestRun((current) => (current?.id === runId ? null : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete preview.");
    } finally {
      setDeletingId(null);
    }
  }

  const overlay = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[130] bg-background text-foreground"
        role="dialog"
        aria-modal="true"
        aria-label="Try it on"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-border/70 px-4 py-2.5 md:px-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Try it on</p>
              <h2 className="truncate font-display text-xl leading-none md:text-2xl">{product.name}</h2>
            </div>
            <Button variant="ghost" size="icon" className="rounded-none" onClick={onClose} aria-label="Close try-on">
              <X className="h-5 w-5" />
            </Button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
            <div className="grid min-h-full lg:h-full lg:grid-cols-[18rem_minmax(0,1fr)_20rem]">
              <aside className="border-b border-border/70 bg-muted/10 p-4 md:p-5 lg:h-full lg:overflow-y-auto lg:border-b-0 lg:border-r">
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Product reference</p>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {productImageIndex + 1}/{product.images.length}
                    </span>
                  </div>
                    <div className={inputFrameClass}>
                    {selectedProductImage && (
                      <Image
                        src={selectedProductImage}
                        alt={product.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 35vw"
                          className="object-cover"
                      />
                    )}
                  </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {product.images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        className={cn(
                          "relative h-16 w-12 flex-none overflow-hidden border bg-muted/30 transition-colors",
                          productImageIndex === index ? "border-foreground" : "border-border/70 hover:border-foreground/60",
                        )}
                        onClick={() => setProductImageIndex(index)}
                        aria-label={`Use product image ${index + 1}`}
                      >
                        <Image src={image} alt="" fill sizes="64px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                  </section>

                  <section className="space-y-3 border-t border-border/70 pt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Body photo</p>
                    <div className="flex flex-wrap gap-2">
                      {allowedModes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={cn(
                            "h-8 border px-3 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors",
                            bodyMode === mode ? "border-foreground bg-foreground text-background" : "border-border/70 hover:border-foreground",
                          )}
                          onClick={() => setBodyMode(mode)}
                        >
                          {BODY_MODE_LABELS[mode]}
                        </button>
                      ))}
                    </div>

                  <label
                    className={cn(
                      "group flex cursor-pointer items-center justify-center border border-dashed border-border/80 bg-muted/15 transition-colors hover:border-foreground/70",
                      inputFrameClass,
                    )}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      disabled={generating || isUnsupported}
                    />
                    {filePreviewUrl ? (
                      <Image
                        src={filePreviewUrl}
                        alt="Selected body photo"
                        fill
                        sizes="(max-width: 1024px) 100vw, 18rem"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex max-w-xs flex-col items-center gap-2.5 text-center p-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70">
                          <Upload className="h-4 w-4" />
                        </span>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Upload body photo</p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {requiredMode === "upper"
                              ? "Upper-body or full-body photo. JPEG, PNG, or WebP."
                              : requiredMode === "lower"
                                ? "Lower-body or full-body photo. JPEG, PNG, or WebP."
                                : "Try-on is not available for this category yet."}
                          </p>
                        </div>
                      </div>
                    )}
                  </label>

                    <Button
                      size="lg"
                      className="h-10 w-full rounded-none text-[10px] font-semibold uppercase tracking-[0.22em]"
                      onClick={handleGenerate}
                      disabled={!file || generating || isUnsupported}
                    >
                      {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {generating ? "Generating" : "Generate preview"}
                    </Button>
                    {error && <p className="text-xs leading-relaxed text-destructive mt-2">{error}</p>}
                  </section>
                </div>
              </aside>

              <main className="flex min-h-[38rem] flex-col bg-background p-4 md:p-6 lg:h-full lg:min-h-0 lg:overflow-hidden">
                <div className="flex items-center justify-between gap-3 pb-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Latest preview</p>
                    <p className="truncate text-sm text-muted-foreground">Generated from your selected product and body photo.</p>
                  </div>
                    {latestRun && (
                      <a
                        href={latestRun.outputImageUrl}
                        download={downloadFileName}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center border border-border/70 transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                        aria-label="Download generated preview"
                        title="Download preview"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <div className={cn(resultFrameClass, "max-h-full max-w-[min(34rem,100%)]")}>
                    {latestRun ? (
                      <Image
                        src={latestRun.outputImageUrl}
                        alt="Generated try-on preview"
                        fill
                        sizes="(max-width: 1024px) 100vw, 34rem"
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-muted-foreground">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border/70 bg-background">
                          <Camera className="h-5 w-5" />
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">Preview stage</p>
                          <p className="max-w-[16rem] text-xs leading-relaxed">Choose the reference, upload a body photo, then generate the try-on here.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </main>

              <aside className="border-t border-border/70 bg-muted/10 p-4 md:p-5 lg:h-full lg:overflow-y-auto lg:border-l lg:border-t-0">
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">My previews</p>
                    {loadingRuns && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  </div>
                  <div className="grid gap-2 lg:pr-1">
                    {runs.length === 0 && !loadingRuns ? (
                      <p className="border border-border/70 p-3 text-xs leading-relaxed text-muted-foreground">Saved previews for this product will stack here.</p>
                    ) : (
                      runs.map((run) => (
                        <div key={run.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_2rem] items-center gap-2 border border-border/70 p-1.5 bg-muted/5">
                          <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
                            <Image src={run.outputImageUrl} alt="" fill sizes="56px" className="object-cover" />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <p className="truncate text-[11px] font-semibold">{formatRunDate(run.createdAt)}</p>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{BODY_MODE_LABELS[run.tryOnMode]} body</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-none"
                            onClick={() => handleDelete(run.id)}
                            disabled={deletingId === run.id}
                            aria-label="Delete try-on preview"
                          >
                            {deletingId === run.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(overlay, portalTarget);
}
