export default function ComboLoading() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-12 lg:px-16">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-[3/4] animate-pulse bg-muted" />
        <div className="aspect-[3/4] animate-pulse bg-muted" />
      </div>
      <div className="mt-8 max-w-2xl space-y-4">
        <div className="h-4 w-32 animate-pulse bg-muted" />
        <div className="h-10 w-4/5 animate-pulse bg-muted" />
        <div className="h-14 w-full animate-pulse bg-muted" />
      </div>
    </div>
  )
}
