export default function Loading() {
  return (
    <div className="p-6 pt-16 md:pt-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted/40 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="h-10 w-40 bg-muted/40 rounded animate-pulse" />
          <div className="h-10 w-36 bg-muted/30 rounded animate-pulse" />
          <div className="h-10 w-36 bg-muted/30 rounded animate-pulse" />
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-6 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted/40 rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted/40 rounded animate-pulse" />
            </div>
            <div className="mt-3 h-6 w-16 bg-muted/50 rounded animate-pulse" />
            <div className="mt-2 h-3 w-24 bg-muted/30 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <div className="border-b p-4">
          <div className="h-5 w-40 bg-muted/40 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-muted/40 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
