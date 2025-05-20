"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseClientAsync, getSupabaseClient } from "@/lib/supabase-client"
import { toast } from "@/components/ui/use-toast"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsProcessing(true)
        console.log("Auth callback page loaded")

        // Collect debug information
        const debug = {
          url: typeof window !== "undefined" ? window.location.href : "SSR",
          hasSearchParams: !!searchParams,
          searchParamsEntries: Array.from(searchParams.entries()),
          timestamp: new Date().toISOString(),
        }

        setDebugInfo(debug)
        console.log("Debug info:", debug)

        // Check if we have a hash fragment that might contain the token
        // This is a fallback for some OAuth providers
        if (typeof window !== "undefined" && window.location.hash) {
          console.log("Hash fragment found:", window.location.hash)

          // Let Supabase handle the hash fragment
          const supabase = getSupabaseClient()

          // This will trigger the onAuthStateChange listener in auth-context.tsx
          const { error: hashError } = await supabase.auth.getSession()

          if (hashError) {
            console.error("Error processing hash fragment:", hashError)
          } else {
            console.log("Hash fragment processed, redirecting...")

            // Get redirect path from localStorage or default to home
            const redirectTo = localStorage.getItem("redirectAfterLogin") || "/"
            localStorage.removeItem("redirectAfterLogin")

            // Redirect to the stored path
            router.push(redirectTo)
            return
          }
        }

        // Get the code from the URL
        const code = searchParams.get("code")

        if (!code) {
          console.error("No code found in URL")
          setError("No authentication code found in the callback URL. Please try logging in again.")
          return
        }

        console.log("Code found in URL, exchanging for session")

        // Get Supabase client
        const supabase = await createSupabaseClientAsync()

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error("Error exchanging code for session:", exchangeError)
          setError(`Authentication error: ${exchangeError.message}`)
          toast({
            title: "Authentication Error",
            description: exchangeError.message,
            variant: "destructive",
          })
          return
        }

        if (!data.session) {
          console.error("No session returned after code exchange")
          setError("Failed to create session. The authentication code may have expired.")
          return
        }

        console.log("Successfully authenticated user")

        // Get redirect path from localStorage or default to home
        let redirectTo = "/"
        if (typeof window !== "undefined") {
          redirectTo = localStorage.getItem("redirectAfterLogin") || "/"
          localStorage.removeItem("redirectAfterLogin")
        }

        // Redirect to the stored path
        console.log("Redirecting to:", redirectTo)
        router.push(redirectTo)
      } catch (err) {
        console.error("Unexpected error in auth callback:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center">
          {isProcessing ? "Completing Login..." : error ? "Authentication Error" : "Login Successful"}
        </h2>

        {isProcessing && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        )}

        {error && (
          <div className="p-4 text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-100">
            <p>{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Return to Home
            </button>
          </div>
        )}

        {!isProcessing && !error && <p className="text-center">Redirecting you to the application...</p>}

        {/* Debug information in development */}
        {process.env.NODE_ENV !== "production" && error && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-xs overflow-auto">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
