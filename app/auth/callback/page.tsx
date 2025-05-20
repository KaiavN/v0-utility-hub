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
        // Make sure Supabase client is initialized
        await initSupabaseClient()
        const supabase = getSupabaseClient()

        // Get the code from URL
        const code = searchParams.get("code")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        console.log("Auth callback received:", {
          hasCode: !!code,
          error,
          errorDescription,
          fullUrl: typeof window !== "undefined" ? window.location.href : "server-side",
        })

        if (error) {
          setError(`Authentication error: ${error}${errorDescription ? ` - ${errorDescription}` : ""}`)
          setIsProcessing(false)
          return
        }

        if (!code) {
          setError("No code provided in callback URL. Please try logging in again.")
          setIsProcessing(false)
          return
        }

        console.log("Processing auth callback with code")

        // Try to handle the URL directly first
        try {
          const { data: urlData, error: urlError } = await supabase.auth.getSessionFromUrl({
            storeSession: true,
          })

          if (urlData?.session) {
            console.log("Successfully got session from URL")
            handleSuccessfulLogin(urlData.session)
            return
          }

          if (urlError) {
            console.warn("Error getting session from URL:", urlError)
            // Continue to try code exchange as fallback
          }
        } catch (urlErr) {
          console.warn("Error in getSessionFromUrl:", urlErr)
          // Continue to try code exchange as fallback
        }

        // Exchange code for session as fallback
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error("Error exchanging code for session:", exchangeError)

          // If we get an "unable to exchange external code" error, try a different approach
          if (exchangeError.message.includes("unable to exchange external code")) {
            try {
              // Try to refresh the Supabase client and try again
              await initSupabaseClient(true) // Pass true to force refresh
              const freshSupabase = getSupabaseClient()

              const { data: retryData, error: retryError } = await freshSupabase.auth.exchangeCodeForSession(code)

              if (retryError) {
                throw retryError
              }

              if (retryData.session) {
                console.log("Successfully exchanged code on retry")
                handleSuccessfulLogin(retryData.session)
                return
              }
            } catch (retryErr) {
              console.error("Error on retry:", retryErr)
              setError("Unable to complete authentication. Please try logging in again.")
              setIsProcessing(false)
              return
            }
          } else {
            setError(exchangeError.message)
            toast({
              title: "Authentication Error",
              description: exchangeError.message,
              variant: "destructive",
            })
            setIsProcessing(false)
            return
          }
        }

        if (!data.session) {
          console.error("No session returned after code exchange")
          setError("Unable to establish a session. Please try again.")
          setIsProcessing(false)
          return
        }

        handleSuccessfulLogin(data.session)
      } catch (err) {
        console.error("Unexpected error in auth callback:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
        setIsProcessing(false)
      }
    }

    function handleSuccessfulLogin(session) {
      console.log("Authentication successful, session established")

      // Redirect to the stored path or home
      const redirectPath = localStorage.getItem("redirectAfterLogin") || "/"
      localStorage.removeItem("redirectAfterLogin")

      // Small delay to ensure session is properly stored
      setTimeout(() => {
        router.push(redirectPath)
      }, 500)
    }

    // Store current path for redirect after login if not already set
    if (typeof window !== "undefined" && !localStorage.getItem("redirectAfterLogin")) {
      localStorage.setItem("redirectAfterLogin", "/")
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
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <p>This could be due to:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>An expired authentication session</li>
              <li>Missing or invalid callback parameters</li>
              <li>Browser cookie or storage issues</li>
            </ul>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Home
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
