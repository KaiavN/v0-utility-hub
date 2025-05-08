import { Skeleton } from "@/components/ui/skeleton"

export default function MessagesLoading() {
  return (
    <div className="flex h-full">
      {/* Conversation list skeleton */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="p-2 space-y-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="p-2 flex items-center">
                <Skeleton className="h-9 w-9 rounded-full mr-3" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Conversation view skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
          <Skeleton className="h-5 w-40" />
        </div>

        <div className="flex-1 p-4 space-y-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton className={`h-16 w-2/3 rounded-lg`} />
              </div>
            ))}
        </div>

        <div className="border-t p-4">
          <Skeleton className="h-[60px] w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
