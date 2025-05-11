"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase-client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const processAuth = async () => {
      try {
        console.log("Auth callback processing started")

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
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error("Error exchanging code for session:", exchangeError)
            throw exchangeError
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
        setError("An unexpected error occurred. Please try again.")
        toast({
          title: "Authentication Failed",
          description: "An unexpected error occurred during authentication",
          variant: "destructive",
        })
        setIsProcessing(false)
      }
    }

    processAuth()
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold">Authentication Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Return to Home
          </button>
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
      </div>
    </div>
  )
}
