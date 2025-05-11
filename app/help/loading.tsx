import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container py-8 max-w-5xl">
      <Skeleton className="h-10 w-64 mb-6" />

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[180px] w-full" />
        ))}
      </div>

      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-12 w-full mb-4" />

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[120px] w-full" />
        ))}
      </div>

      <Skeleton className="h-[120px] w-full" />
    </div>
  )
}
