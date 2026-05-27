export default function ProductLoading() {
  return (
    <div className="min-h-screen">
      <div className="grid gap-8 px-6 py-8 md:grid-cols-2 md:px-12 lg:px-16">
        <div className="aspect-[3/4] animate-pulse bg-muted" />
        <div className="space-y-5 pt-4">
          <div className="h-3 w-24 animate-pulse bg-muted" />
          <div className="h-12 w-4/5 animate-pulse bg-muted" />
          <div className="h-5 w-40 animate-pulse bg-muted" />
          <div className="h-20 w-full animate-pulse bg-muted" />
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-12 animate-pulse bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
