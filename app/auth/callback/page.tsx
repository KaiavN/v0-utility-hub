"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from the URL
        const code = searchParams.get("code")
        const errorParam = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (errorParam) {
          setError(`${errorParam}: ${errorDescription || "Unknown error"}`)
          return
        }

        if (!code) {
          setError("No authentication code found")
          return
        }

        // Create a Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error("Error processing auth callback:", error)
          setError(error.message)
          setDebugInfo(JSON.stringify({ error, code }, null, 2))
          return
        }

        if (!data.session) {
          setError("No session returned from authentication")
          return
        }

        // Check if we have a redirect path stored
        let redirectPath = "/"

        if (typeof window !== "undefined") {
          const storedPath = sessionStorage.getItem("redirectAfterLogin")
          if (storedPath) {
            redirectPath = storedPath
            sessionStorage.removeItem("redirectAfterLogin")
          }
        }

        // Redirect to the stored path or home page
        router.push(redirectPath)
      } catch (error: any) {
        console.error("Unexpected error in auth callback:", error)
        setError(error.message || "An unexpected error occurred")
        setDebugInfo(JSON.stringify(error, null, 2))
        setTimeout(() => router.push("/"), 5000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md p-6 bg-card rounded-lg shadow-lg">
        {error ? (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-500">Authentication Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            {debugInfo && (
              <div className="mb-4 p-2 bg-muted rounded text-left overflow-auto max-h-40 text-xs">
                <pre>{debugInfo}</pre>
              </div>
            )}
            <p>Redirecting you to the home page in 5 seconds...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-4">Completing login...</h1>
            <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
          </>
        )}
      </div>
    </div>
  )
}
