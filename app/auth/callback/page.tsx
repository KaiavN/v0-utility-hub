"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const supabase = getSupabaseClient()

  const handleAuth = async () => {
    try {
      console.log("Auth callback processing started")
      setIsProcessing(true)

      // Check for error in URL
      const url = new URL(window.location.href)
      const errorParam = url.searchParams.get("error")
      const errorDescription = url.searchParams.get("error_description")

      if (errorParam) {
        console.error("Auth callback error:", errorParam, errorDescription)
        setError(errorDescription || "Authentication failed")
        toast({
          title: "Authentication Failed",
          description: errorDescription || "An error occurred during authentication",
          variant: "destructive",
        })
        setIsProcessing(false)
        return
      }

      // Handle hash fragment (GitHub often returns tokens this way)
      if (window.location.hash) {
        console.log("Processing hash fragment")

        try {
          // Try to exchange the hash for a session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.hash)

          if (exchangeError) {
            console.error("Error exchanging hash for session:", exchangeError)
            throw exchangeError
          }
        } catch (hashError) {
          console.error("Error processing hash:", hashError)

          // Let's try to get the session directly
          const { data, error } = await supabase.auth.getSession()

          if (error) {
            console.error("Error getting session after hash processing:", error)
            throw error
          }

          if (!data.session) {
            console.error("No session found after hash processing")
            throw new Error("No session found after hash processing")
          }
        }
      }

      // Handle code in query params (typical OAuth flow)
      const code = url.searchParams.get("code")
      if (code) {
        console.log("Processing OAuth code")

        try {
          // Add a small delay before exchanging the code (helps with timing issues)
          await new Promise((resolve) => setTimeout(resolve, 500))

          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error("Error exchanging code for session:", exchangeError)

            // If this is a transient error, we might want to retry
            if (
              retryCount < 2 &&
              (exchangeError.message.includes("Unable to exchange") ||
                exchangeError.message.includes("network") ||
                exchangeError.message.includes("timeout"))
            ) {
              setRetryCount((prev) => prev + 1)
              console.log(`Retrying code exchange (attempt ${retryCount + 1})...`)

              // Wait a bit longer before retrying
              await new Promise((resolve) => setTimeout(resolve, 1000))
              handleAuth()
              return
            }

            throw exchangeError
          }
        } catch (codeError) {
          console.error("Error processing OAuth code:", codeError)

          // Try to recover by checking if we have a session anyway
          const { data: sessionData } = await supabase.auth.getSession()

          if (!sessionData.session) {
            throw codeError
          }

          console.log("Found session despite code exchange error, continuing...")
        }
      }

      // Verify we have a session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error verifying session:", sessionError)
        throw sessionError
      }

      if (!sessionData.session) {
        console.error("No session found after authentication")
        throw new Error("No session found after authentication")
      }

      // Get the redirect path from session storage or default to home
      const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/"
      sessionStorage.removeItem("redirectAfterLogin")

      console.log("Authentication successful, redirecting to:", redirectPath)

      toast({
        title: "Authentication Successful",
        description: "You have been successfully authenticated",
      })

      // Redirect to the original page or home
      router.push(redirectPath)
    } catch (error) {
      console.error("Auth callback unexpected error:", error)
      setError("An error occurred during authentication. Please try again.")
      toast({
        title: "Authentication Failed",
        description: "An error occurred during authentication",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    handleAuth()

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isProcessing) {
        console.log("Auth callback timeout reached")
        setIsProcessing(false)
        setError("Authentication is taking longer than expected. Please try again.")
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeoutId)
  }, [router, retryCount])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold">Authentication Error</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <div className="flex flex-col space-y-2">
            <Button onClick={() => router.push("/")} className="w-full">
              Return to Home
            </Button>
            <Button
              onClick={() => {
                setError(null)
                setIsProcessing(true)
                setRetryCount(0)
                handleAuth()
              }}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Completing authentication...</h1>
        <p className="text-muted-foreground">Please wait while we log you in.</p>
        {retryCount > 0 && <p className="text-sm text-muted-foreground">Retrying... (Attempt {retryCount})</p>}
      </div>
    </div>
  )
}
