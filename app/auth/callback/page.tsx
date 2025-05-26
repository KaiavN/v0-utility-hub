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

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        console.log("Auth callback page loaded")
        console.log("Current URL:", window.location.href)
        console.log("Search params:", window.location.search)

        // Make sure Supabase client is initialized
        await initSupabaseClient()
        const supabase = getSupabaseClient()

        // Get all URL parameters for debugging
        const urlParams = new URLSearchParams(window.location.search)
        console.log("All URL parameters:", Object.fromEntries(urlParams.entries()))

        // Get the code from URL - try multiple parameter names
        const code = searchParams.get("code") || urlParams.get("code")
        const error_code = searchParams.get("error") || urlParams.get("error")
        const error_description = searchParams.get("error_description") || urlParams.get("error_description")

        console.log("Code from URL:", code)
        console.log("Error from URL:", error_code)
        console.log("Error description:", error_description)

        // Check for OAuth errors first
        if (error_code) {
          const errorMsg = error_description || error_code || "OAuth authentication failed"
          console.error("OAuth error:", errorMsg)
          setError(errorMsg)
          setIsProcessing(false)
          return
        }

        if (!code) {
          console.error("No code found in URL parameters")
          console.log("Available search params:", Array.from(searchParams.entries()))
          setError("No authorization code received from GitHub. Please try logging in again.")
          setIsProcessing(false)
          return
        }

        console.log("Processing GitHub auth callback with code:", code.substring(0, 10) + "...")

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error("Error exchanging code for session:", exchangeError)
          setError(`Authentication failed: ${exchangeError.message}`)
          toast({
            title: "Authentication Error",
            description: exchangeError.message,
            variant: "destructive",
          })
          setIsProcessing(false)
          return
        }

        if (!data.session) {
          console.error("No session returned after code exchange")
          setError("Failed to create session. Please try logging in again.")
          setIsProcessing(false)
          return
        }

        console.log("Authentication successful, session established")
        console.log("User:", data.session.user.email)

        // Redirect to the stored path or home
        const redirectPath = localStorage.getItem("redirectAfterLogin") || "/"
        localStorage.removeItem("redirectAfterLogin")
        console.log("Redirecting to:", redirectPath)

        // Small delay to ensure session is properly stored
        setTimeout(() => {
          router.push(redirectPath)
        }, 1000)
      } catch (err) {
        console.error("Unexpected error in auth callback:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  // If there's an error, show it
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h1 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Authentication Failed</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Show loading state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Completing Sign In</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">Please wait while we authenticate your account...</p>
        <div className="flex justify-center">
          <div className="h-8 w-8 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  )
}
