const descriptionLineWidths = [
  "w-full",
  "w-full",
  "w-[92%]",
  "w-[88%]",
  "w-[94%]",
  "w-[86%]",
  "w-[90%]",
  "w-[78%]",
  "w-[52%]",
]

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-background pb-24 lg:pt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="relative overflow-hidden bg-muted/30">
          <div className="aspect-[4/5] w-full animate-pulse bg-muted" />
        </div>
        <div className="lg:min-h-[calc(100svh-8rem)] lg:sticky lg:top-20 p-8 lg:p-14 lg:pt-10 flex flex-col justify-start space-y-8">
          <div className="space-y-7 lg:space-y-8">
            <div className="space-y-2">
              <div className="h-3 w-36 animate-pulse bg-muted" />
              <div className="h-16 w-full max-w-[700px] animate-pulse bg-muted md:h-20" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-28 animate-pulse bg-muted" />
              <div className="h-4 w-20 animate-pulse bg-muted" />
              <div className="h-4 w-16 animate-pulse bg-muted" />
            </div>
            <div className="max-w-md space-y-3">
              {descriptionLineWidths.map((width, index) => (
                <div
                  key={index}
                  className={`h-4 animate-pulse bg-muted ${width} ${index >= 4 ? "hidden md:block" : ""}`}
                />
              ))}
            </div>
            <div className="space-y-1">
              <div className="h-3 w-44 animate-pulse bg-muted" />
              <div className="h-3 w-24 animate-pulse bg-muted" />
            </div>
          </div>

          <div className="grid gap-3 rounded-sm border border-border/70 bg-background/60 p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-56 animate-pulse bg-muted" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-64 max-w-full animate-pulse bg-muted" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-60 max-w-full animate-pulse bg-muted" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-3 w-28 animate-pulse bg-muted" />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-12 w-12 animate-pulse bg-muted" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-3 w-32 animate-pulse bg-muted" />
              <div className="flex flex-wrap gap-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                ))}
              </div>
            </div>
            <div className="pt-2 space-y-3">
              <div className="flex gap-3">
                <div className="h-13 flex-1 animate-pulse bg-muted" />
                <div className="h-13 w-13 animate-pulse bg-muted" />
              </div>
              <div className="mx-auto h-3 w-64 max-w-full animate-pulse bg-muted" />
            </div>
            <div className="border-t border-border/60 pt-6 space-y-3">
              <div className="h-3 w-24 animate-pulse bg-muted" />
              <div className="h-3 w-full max-w-sm animate-pulse bg-muted" />
              <div className="h-3 w-2/3 max-w-sm animate-pulse bg-muted" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 mt-24 px-6 md:px-12 lg:px-16">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6 mt-12">
          You may also like
        </h2>
        <div className="flex gap-4 overflow-hidden pb-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="w-[200px] flex-shrink-0 space-y-3 sm:w-[240px]">
              <div className="aspect-[3/4] animate-pulse bg-muted/60" />
              <div className="space-y-2">
                <div className="h-3 w-4/5 animate-pulse bg-muted" />
                <div className="h-3 w-1/2 animate-pulse bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
