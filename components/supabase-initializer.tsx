"use client"

import { useEffect, useState } from "react"
import { initSupabaseClient } from "@/lib/supabase-client"
import { useToast } from "@/components/ui/use-toast"

export function SupabaseInitializer() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const initialize = async () => {
      try {
        await initSupabaseClient()
        setIsInitialized(true)
        console.log("Supabase client initialized successfully")
      } catch (err) {
        console.error("Failed to initialize Supabase:", err)
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)

        // Only show toast for non-development errors to avoid confusion during normal development
        if (!errorMessage.includes("supabaseUrl is required")) {
          toast({
            title: "Connection Error",
            description: "Unable to connect to the database. Some features may not work.",
            variant: "destructive",
          })
        }
      }
    }

    initialize()
  }, [toast])

  // This component doesn't render anything visible
  return null
}
