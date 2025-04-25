import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-8 w-64 rounded-md bg-muted animate-pulse mb-2" />
          <Skeleton className="h-4 w-96 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-40 rounded-md bg-muted animate-pulse" />
          <Skeleton className="h-10 w-40 rounded-md bg-muted animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="h-96 rounded-md bg-muted animate-pulse"></div>
        </div>
        <div className="md:col-span-3">
          <div className="h-[600px] rounded-md bg-muted animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
