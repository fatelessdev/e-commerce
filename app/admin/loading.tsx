export default function AdminLoading() {
  return (
    <div className="min-h-screen space-y-6 p-6 md:p-10">
      <div className="h-10 w-64 animate-pulse bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-32 animate-pulse bg-muted" />
        ))}
      </div>
      <div className="h-96 animate-pulse bg-muted" />
    </div>
  )
}
