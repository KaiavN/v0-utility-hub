"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { verifyStateParameter } from "@/lib/supabase-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    // Define the cleanup function
    const cleanup = async () => {
      try {
        // Get the redirect destination from sessionStorage
        const redirectTo = sessionStorage.getItem("redirectAfterLogin") || "/"

        // Redirect the user
        router.push(redirectTo)
      } catch (e) {
        console.error("Error during auth callback cleanup:", e)
        // Default fallback if there's an error with sessionStorage
        router.push("/")
      }
    }

    const handleCallback = async () => {
      try {
        // Check if we have a code in URL params - this indicates OAuth callback
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        // Handle error from OAuth provider
        if (error) {
          console.error("OAuth error:", error, errorDescription)
          setStatus("error")
          setErrorMessage(errorDescription || "Authentication failed. Please try again.")
          return
        }

        // If we don't have a code, there's nothing to process
        if (!code) {
          console.error("No code parameter found in URL")
          setStatus("error")
          setErrorMessage("Authentication code missing. Please try again.")
          return
        }

        // Verify state parameter if present (CSRF protection)
        if (state && !verifyStateParameter(state)) {
          console.error("State parameter verification failed")
          setStatus("error")
          setErrorMessage("Security verification failed. Please try again.")
          return
        }

        // Supabase client should handle the code exchange automatically
        const supabase = createClient()

        // Check if the session was created
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !data.session) {
          console.error("Error getting session after code exchange:", sessionError)
          setStatus("error")
          setErrorMessage("Failed to complete authentication. Please try again.")
          return
        }

        console.log("Authentication successful")
        setStatus("success")

        // Short delay before redirect for better UX
        setTimeout(cleanup, 1500)
      } catch (e) {
        console.error("Unexpected error during auth callback:", e)
        setStatus("error")
        setErrorMessage("An unexpected error occurred. Please try again.")
      }
    }

    handleCallback()
  }, [router, searchParams])

  // Helper for manual redirect if auto-redirect fails
  const handleManualRedirect = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            {status === "loading" && "Completing your sign in..."}
            {status === "success" && "Successfully signed in!"}
            {status === "error" && "Authentication Error"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Please wait while we complete your authentication</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm text-muted-foreground">You are now being redirected...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center gap-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <Button onClick={handleManualRedirect} className="mt-2">
                Return to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
