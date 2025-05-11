"use client"

import { useConfig } from "@/contexts/config-context"

export function LoadingScreen() {
  const config = useConfig()

  if (config.isLoaded) {
    return null
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-lg font-medium">Loading application...</p>
      </div>
    </div>
  )
}
