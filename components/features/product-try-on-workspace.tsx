"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  Download,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getRequiredTryOnMode,
  isTryOnBodyModeAllowed,
  type TryOnBodyMode,
} from "@/lib/try-on";

/* ─── Types ─── */

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

/* ─── Constants ─── */

const BODY_MODE_LABELS: Record<TryOnBodyMode, string> = {
  upper: "Upper",
  lower: "Lower",
  full: "Full",
};

/* ─── Helpers ─── */

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

/* ─── Component ─── */

export function ProductTryOnWorkspace({
  open,
  onClose,
  product,
}: ProductTryOnWorkspaceProps) {
  const shouldReduceMotion = useReducedMotion();
  const requiredMode = getRequiredTryOnMode(product.category);
  const allowedModes = useMemo(
    () =>
      (["upper", "lower", "full"] as TryOnBodyMode[]).filter((mode) =>
        isTryOnBodyModeAllowed(requiredMode, mode),
      ),
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
        const payload = await readJsonResponse<{ error?: string; runs?: TryOnRun[] }>(
          res,
          "Could not load previews.",
        );
        if (!res.ok) throw new Error(payload.error || "Could not load previews.");
        if (!cancelled) setRuns(payload.runs ?? []);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load previews.");
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
      const payload = await readJsonResponse<{ error?: string; run?: TryOnRun }>(
        res,
        "Could not generate preview.",
      );

      if (!res.ok || !payload.run) {
        throw new Error(payload.error || "Could not generate preview.");
      }

      const run = payload.run;
      setLatestRun(run);
      setRuns((current) => [run, ...current.filter((r) => r.id !== run.id)]);
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
      const payload = await readJsonResponse<{ error?: string }>(
        res,
        "Could not delete preview.",
      );

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

  /* ─── Render ─── */

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
        transition={{
          duration: shouldReduceMotion ? 0.01 : 0.24,
          ease: [0.32, 0.72, 0, 1],
        }}
      >
        <div className="flex h-full flex-col">
          {/* ─── Header ─── */}
          <header className="flex flex-none items-center justify-between px-5 py-3 md:px-8">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Try it on
              </p>
              <h2 className="truncate font-display text-xl leading-snug md:text-2xl">
                {product.name}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none"
              onClick={onClose}
              aria-label="Close try-on"
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          {/* ─── Workspace ─── */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
            <div className="mx-auto flex w-full max-w-[82rem] flex-1 flex-col px-5 pb-5 md:px-8 md:pb-6 lg:pb-8">

              {/* ── Visual flow: [Garment] [You] [Result] ── */}
              <div className="flex-1 lg:min-h-0">
                <div
                  className={cn(
                    "grid gap-3 md:gap-4",
                    /* Mobile: 2-col, result spans full row below */
                    "grid-cols-2",
                    /* Desktop: 3-col with result wider */
                    "lg:grid-cols-[1fr_1fr_1.5fr] lg:gap-5 lg:h-full",
                  )}
                >
                  {/* ── Slot 1: Garment reference ── */}
                  <div className="flex flex-col lg:min-h-0">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      Garment
                      <span className="ml-2 tabular-nums tracking-[0.14em] text-muted-foreground/40">
                        {productImageIndex + 1}/{product.images.length}
                      </span>
                    </p>

                    <div className="relative aspect-[3/4] overflow-hidden bg-muted/10 lg:aspect-auto lg:flex-1 lg:min-h-0">
                      {selectedProductImage && (
                        <Image
                          src={selectedProductImage}
                          alt={product.name}
                          fill
                          sizes="(max-width: 1024px) 45vw, 28vw"
                          className="object-cover"
                        />
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    <div className="mt-2 flex gap-1 overflow-x-auto">
                      {product.images.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          className={cn(
                            "relative h-10 w-7 flex-none overflow-hidden bg-muted/10 transition-all duration-200",
                            productImageIndex === index
                              ? "ring-1 ring-foreground ring-offset-1 ring-offset-background"
                              : "opacity-40 hover:opacity-80",
                          )}
                          onClick={() => setProductImageIndex(index)}
                          aria-label={`Product image ${index + 1}`}
                        >
                          <Image src={image} alt="" fill sizes="28px" className="object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Slot 2: Your photo ── */}
                  <div className="flex flex-col lg:min-h-0">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      You
                    </p>

                    <label className="group relative flex cursor-pointer items-center justify-center overflow-hidden bg-muted/6 transition-colors duration-200 hover:bg-muted/12 aspect-[3/4] lg:aspect-auto lg:flex-1 lg:min-h-0">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                        disabled={generating || isUnsupported}
                      />

                      {filePreviewUrl ? (
                        <>
                          <Image
                            src={filePreviewUrl}
                            alt="Your body photo"
                            fill
                            sizes="(max-width: 1024px) 45vw, 28vw"
                            className="object-cover"
                          />
                          {/* Replace overlay on hover */}
                          <span className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                              Replace
                            </span>
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-4 text-center">
                          <Upload className="h-4 w-4 text-muted-foreground/40" />
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                            Upload photo
                          </p>
                          <p className="text-[10px] leading-snug text-muted-foreground/30">
                            {requiredMode === "upper"
                              ? "Upper or full body"
                              : requiredMode === "lower"
                                ? "Lower or full body"
                                : "Not available"}
                          </p>
                        </div>
                      )}
                    </label>

                    {/* Body mode toggle */}
                    <div className="mt-2 flex gap-1">
                      {allowedModes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={cn(
                            "h-7 flex-1 text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors duration-150",
                            bodyMode === mode
                              ? "bg-foreground text-background"
                              : "bg-muted/10 text-muted-foreground/60 hover:bg-muted/20 hover:text-muted-foreground",
                          )}
                          onClick={() => setBodyMode(mode)}
                        >
                          {BODY_MODE_LABELS[mode]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Slot 3: Result (hero) ── */}
                  <div className="col-span-2 flex flex-col lg:col-span-1 lg:min-h-0">
                    <div className="mb-2 flex items-baseline justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        Result
                      </p>
                      {latestRun && (
                        <a
                          href={latestRun.outputImageUrl}
                          download={downloadFileName}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground/40 transition-colors duration-150 hover:text-foreground"
                          aria-label="Download preview"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    <div
                      className={cn(
                        "relative overflow-hidden bg-muted/6 aspect-[3/4] lg:aspect-auto lg:flex-1 lg:min-h-0",
                        generating && "after:absolute after:inset-0 after:z-10 after:bg-foreground/[0.02] after:animate-pulse",
                      )}
                    >
                      {latestRun ? (
                        <Image
                          src={latestRun.outputImageUrl}
                          alt="Generated try-on preview"
                          fill
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          className="object-contain"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2.5 p-6 text-center">
                          <Camera className="h-5 w-5 text-muted-foreground/20" />
                          <p className="max-w-[16rem] text-[11px] leading-relaxed text-muted-foreground/40">
                            Upload your photo and generate to see yourself in this look.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Generate bar ── */}
              <div className="mt-4 flex-none md:mt-5">
                <Button
                  size="lg"
                  className="h-12 w-full rounded-none text-[10px] font-semibold uppercase tracking-[0.22em]"
                  onClick={handleGenerate}
                  disabled={!file || generating || isUnsupported}
                >
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {generating ? "Generating" : "Generate preview"}
                </Button>
                {error && (
                  <p className="mt-2 text-xs leading-relaxed text-destructive">{error}</p>
                )}
              </div>

              {/* ── History filmstrip ── */}
              {(runs.length > 0 || loadingRuns) && (
                <div className="mt-5 flex-none md:mt-6">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/50">
                      History
                    </p>
                    {runs.length > 0 && (
                      <span className="text-[9px] tabular-nums text-muted-foreground/30">
                        {runs.length}
                      </span>
                    )}
                    {loadingRuns && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/30" />
                    )}
                  </div>

                  {runs.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {runs.map((run) => (
                        <div key={run.id} className="group relative flex-none">
                          <button
                            type="button"
                            className={cn(
                              "relative h-16 w-12 overflow-hidden bg-muted/10 transition-all duration-200",
                              latestRun?.id === run.id
                                ? "ring-1 ring-foreground ring-offset-1 ring-offset-background"
                                : "opacity-50 hover:opacity-90",
                            )}
                            onClick={() => setLatestRun(run)}
                            title={formatRunDate(run.createdAt)}
                            aria-label={`View preview from ${formatRunDate(run.createdAt)}`}
                          >
                            <Image
                              src={run.outputImageUrl}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-background/90 transition-opacity duration-150",
                              "opacity-60 lg:opacity-0 lg:group-hover:opacity-100",
                              deletingId === run.id && "opacity-100",
                            )}
                            onClick={() => handleDelete(run.id)}
                            disabled={deletingId === run.id}
                            aria-label="Delete preview"
                          >
                            {deletingId === run.id ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-2.5 w-2.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(overlay, portalTarget);
}
