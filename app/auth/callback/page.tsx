"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [processingStage, setProcessingStage] = useState<string>("Initializing")
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setProcessingStage("Processing authentication")
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

        // Get the session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          throw sessionError
        }

        if (!session) {
          console.error("No session found after authentication")
          throw new Error("No session found after authentication")
        }

        console.log("Authentication successful")
        setProcessingStage("Authentication successful")

        // Get the redirect path from session storage or default to home
        let redirectPath = "/"
        try {
          if (typeof window !== "undefined" && window.sessionStorage) {
            redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/"
            sessionStorage.removeItem("redirectAfterLogin")
          }
        } catch (storageError) {
          console.warn("Error accessing sessionStorage:", storageError)
        }

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

    handleAuthCallback()

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isProcessing) {
        console.log("Auth callback timeout reached")
        setIsProcessing(false)
        setError(`Authentication is taking longer than expected. Please try again.`)
      }
    }, 15000) // 15 second timeout

    return () => clearTimeout(timeoutId)
  }, [router])

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
        <p className="text-muted-foreground">{processingStage}</p>
      </div>
    </div>
  )
}
