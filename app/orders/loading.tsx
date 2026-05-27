export default function OrdersLoading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border/60 px-6 py-14 md:px-12 md:py-20">
        <div className="mb-3 h-3 w-20 animate-pulse bg-muted" />
        <div className="h-10 w-56 animate-pulse bg-muted" />
      </div>
      <div className="max-w-4xl space-y-4 p-6 md:px-12">
        {[0, 1, 2].map((item) => (
          <div key={item} className="space-y-4 border border-border/60 p-6">
            <div className="h-4 w-40 animate-pulse bg-muted" />
            <div className="flex gap-2.5">
              {[0, 1, 2].map((thumb) => (
                <div key={thumb} className="h-18 w-14 animate-pulse bg-muted" />
              ))}
            </div>
            <div className="h-16 w-full animate-pulse bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
