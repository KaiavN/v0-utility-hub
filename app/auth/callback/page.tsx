"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient, initSupabaseClient } from "@/lib/supabase-client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        console.log("Auth callback page loaded")
        console.log("Current URL:", window.location.href)

        // Make sure Supabase client is initialized
        await initSupabaseClient()
        const supabase = getSupabaseClient()

        // Check for error parameters in URL
        const urlParams = new URLSearchParams(window.location.search)
        const error_code = urlParams.get("error")
        const error_description = urlParams.get("error_description")

        if (error_code) {
          console.error("OAuth error:", error_code, error_description)
          setError(error_description || error_code || "Authentication failed")
          setIsProcessing(false)
          return
        }

        // Supabase should have already processed the GitHub callback and created a session
        // We just need to check if we have a valid session now
        console.log("Checking for session after OAuth callback...")

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setError(`Session error: ${sessionError.message}`)
          setIsProcessing(false)
          return
        }

        if (session) {
          console.log("Session found! User authenticated:", session.user.email)

          // The AuthProvider will handle the session via onAuthStateChange
          // Just redirect to the stored path or home
          const redirectPath = localStorage.getItem("redirectAfterLogin") || "/"
          localStorage.removeItem("redirectAfterLogin")

          console.log("Redirecting to:", redirectPath)

          // Small delay to ensure the AuthProvider processes the session
          setTimeout(() => {
            router.push(redirectPath)
          }, 1000)
        } else {
          console.error("No session found after OAuth callback")
          setError("Authentication completed but no session was created. Please try again.")
          setIsProcessing(false)
        }
      } catch (err) {
        console.error("Unexpected error in auth callback:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
        setIsProcessing(false)
      }
    }

    // Small delay to ensure URL parameters are available
    const timeoutId = setTimeout(handleAuthCallback, 100)

    return () => clearTimeout(timeoutId)
  }, [router])

  // If there's an error, show it
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h1 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Authentication Failed</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Completing Sign In</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">Please wait while we complete your authentication...</p>
        <div className="flex justify-center">
          <div className="h-8 w-8 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  )
}
