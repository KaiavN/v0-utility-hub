"use client"

import { useEffect, useState } from "react"
import { initSupabaseClient } from "@/lib/supabase-client"

export function SupabaseInitializer() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        await initSupabaseClient()
        setIsInitialized(true)
      } catch (err) {
        console.error("Failed to initialize Supabase:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    }

    initialize()
  }, [])

  // This component doesn't render anything visible
  return null
}
