"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseClient, initSupabaseClient } from "@/lib/supabase-client"
import { toast } from "@/components/ui/use-toast"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [processingStep, setProcessingStep] = useState("Initializing")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsProcessing(true)
        console.log("Auth callback page loaded")
        setProcessingStep("Page loaded")

        // Collect debug information
        const debug = {
          url: typeof window !== "undefined" ? window.location.href : "SSR",
          hasSearchParams: !!searchParams,
          searchParamsEntries: Array.from(searchParams.entries()),
          timestamp: new Date().toISOString(),
        }

        setDebugInfo(debug)
        console.log("Debug info:", debug)

        // Make sure Supabase client is initialized
        setProcessingStep("Initializing Supabase client")
        await initSupabaseClient()
        const supabase = getSupabaseClient()

        // Get the code from URL
        const code = searchParams.get("code")

        if (!code) {
          console.error("No code found in URL")
          setError("No authentication code found in the callback URL. Please try logging in again.")
          setProcessingStep("Error: No code found")
          return
        }

        console.log("Code found in URL, exchanging for session")
        setProcessingStep("Exchanging code for session")

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error("Error exchanging code for session:", exchangeError)
          setError(`Authentication error: ${exchangeError.message}`)
          setProcessingStep(`Error: ${exchangeError.message}`)
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
          setProcessingStep("Error: No session returned")
          return
        }

        console.log("Successfully authenticated user, session established")
        setProcessingStep("Session established")

        // Get redirect path from localStorage or default to home
        let redirectTo = "/"
        if (typeof window !== "undefined") {
          redirectTo = localStorage.getItem("redirectAfterLogin") || "/"
          localStorage.removeItem("redirectAfterLogin")
          console.log("Will redirect to:", redirectTo)
        }

        // Force a refresh of the auth state
        setProcessingStep("Refreshing auth state")
        const { data: refreshData } = await supabase.auth.getSession()
        console.log("Session refresh result:", refreshData.session ? "Session exists" : "No session")

        // Add a small delay to ensure everything is processed
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Redirect to the stored path
        setProcessingStep("Redirecting")
        console.log("Redirecting to:", redirectTo)

        // Use window.location for a hard redirect to ensure a fresh state
        window.location.href = redirectTo
      } catch (err) {
        console.error("Unexpected error in auth callback:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
        setProcessingStep(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  // Add a manual retry button
  const handleManualRedirect = () => {
    const redirectTo = localStorage.getItem("redirectAfterLogin") || "/"
    localStorage.removeItem("redirectAfterLogin")
    window.location.href = redirectTo
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center">
          {isProcessing ? "Completing Login..." : error ? "Authentication Error" : "Login Successful"}
        </h2>

        {isProcessing && (
          <>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-300">{processingStep}</p>
          </>
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

        {!isProcessing && !error && (
          <>
            <p className="text-center">Authentication successful! Redirecting you to the application...</p>
            <button
              onClick={handleManualRedirect}
              className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Click here if you're not redirected automatically
            </button>
          </>
        )}

        {/* Debug information */}
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-xs overflow-auto">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <p>Current step: {processingStep}</p>
          <p>Processing: {isProcessing ? "Yes" : "No"}</p>
          <p>Error: {error || "None"}</p>
          <pre className="mt-2 overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
