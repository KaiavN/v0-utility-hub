"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

export function SearchComponent() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  )
}

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  return (
    <div>
      <p>Search query: {query}</p>
      {/* Rest of the component */}
    </div>
  )
}
