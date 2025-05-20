"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseClientAsync } from "@/lib/supabase-client"
import { toast } from "@/components/ui/use-toast"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Auth callback page loaded")
        setIsProcessing(true)

        // Check for error in URL
        const errorParam = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (errorParam) {
          console.error("OAuth error:", errorParam, errorDescription)
          setError(errorDescription || "Authentication failed")
          toast({
            title: "Authentication Error",
            description: errorDescription || "There was a problem with the authentication process",
            variant: "destructive",
          })
          setTimeout(() => router.push("/"), 2000)
          return
        }

        // Get code from URL
        const code = searchParams.get("code")
        if (!code) {
          console.error("No code found in URL")
          setError("No authentication code received")
          toast({
            title: "Authentication Error",
            description: "No authentication code received",
            variant: "destructive",
          })
          setTimeout(() => router.push("/"), 2000)
          return
        }

        console.log("Code received, exchanging for session...")

        // Initialize Supabase client
        const supabase = await createSupabaseClientAsync()

        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error("Error exchanging code for session:", exchangeError)
          setError(exchangeError.message)
          toast({
            title: "Authentication Error",
            description: exchangeError.message || "Failed to complete authentication",
            variant: "destructive",
          })
          setTimeout(() => router.push("/"), 2000)
          return
        }

        if (!data.session) {
          console.error("No session returned after code exchange")
          setError("Failed to establish session")
          toast({
            title: "Authentication Error",
            description: "Failed to establish session",
            variant: "destructive",
          })
          setTimeout(() => router.push("/"), 2000)
          return
        }

        console.log("Authentication successful, session established")

        // Get redirect path from localStorage or default to home
        let redirectPath = "/"
        try {
          const storedPath = localStorage.getItem("redirectAfterLogin")
          if (storedPath) {
            redirectPath = storedPath
            localStorage.removeItem("redirectAfterLogin")
          }
        } catch (e) {
          console.warn("Error accessing localStorage:", e)
        }

        // Show success message
        toast({
          title: "Authentication Successful",
          description: "You have been successfully logged in",
        })

        // Redirect to the stored path
        console.log("Redirecting to:", redirectPath)
        router.push(redirectPath)
      } catch (err) {
        console.error("Unexpected error in auth callback:", err)
        setError("An unexpected error occurred")
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication",
          variant: "destructive",
        })
        setTimeout(() => router.push("/"), 2000)
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <h1 className="mb-4 text-center text-2xl font-bold">
          {error ? "Authentication Failed" : "Completing Authentication"}
        </h1>

        {isProcessing && !error && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            <p className="text-center text-muted-foreground">
              Please wait while we complete the authentication process...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive">
            <p>{error}</p>
            <p className="mt-2 text-sm">Redirecting you to the home page...</p>
          </div>
        )}
      </div>
    </div>
  )
}
