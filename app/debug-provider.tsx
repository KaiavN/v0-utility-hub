"use client"

import { ClientConfigDebug } from "@/components/debug/client-config-debug"

export function DebugProvider() {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return <ClientConfigDebug />
}
