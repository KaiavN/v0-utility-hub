"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Get the code from the URL
        const code = searchParams.get("code")

        if (!code) {
          setError("No authentication code found")
          return
        }

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error("Error processing auth callback:", error)
          setError(error.message)
          return
        }

        // Check if we have a redirect path stored
        const redirectPath = sessionStorage.getItem("redirectAfterLogin")

        // Redirect to the stored path or home page
        if (redirectPath) {
          sessionStorage.removeItem("redirectAfterLogin")
          router.push(redirectPath)
        } else {
          router.push("/")
        }
      } catch (error: any) {
        console.error("Unexpected error in auth callback:", error)
        setError(error.message || "An unexpected error occurred")
        setTimeout(() => router.push("/"), 3000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-500">Authentication Error</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p>Redirecting you to the home page...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-4">Completing login...</h1>
            <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
          </>
        )}
      </div>
    </div>
  )
}
