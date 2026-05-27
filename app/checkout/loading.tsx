export default function CheckoutLoading() {
  return (
    <div className="grid min-h-screen gap-8 px-6 py-10 md:grid-cols-[1fr_24rem] md:px-12">
      <div className="space-y-4">
        <div className="h-10 w-56 animate-pulse bg-muted" />
        <div className="h-64 w-full animate-pulse bg-muted" />
        <div className="h-40 w-full animate-pulse bg-muted" />
      </div>
      <div className="h-80 animate-pulse bg-muted" />
    </div>
  )
}
