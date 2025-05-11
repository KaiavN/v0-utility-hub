"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { toast } from "@/components/ui/use-toast"

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Processing authentication...")
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Create a Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error("Missing Supabase environment variables")
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Get the auth code from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const queryParams = new URLSearchParams(window.location.search)

        // Check for errors
        const error = hashParams.get("error") || queryParams.get("error")
        const errorDescription = hashParams.get("error_description") || queryParams.get("error_description")

        if (error) {
          console.error("Auth callback error:", error, errorDescription)
          setMessage(`Authentication failed: ${errorDescription || error}`)
          toast({
            title: "Authentication Failed",
            description: errorDescription || "An error occurred during authentication",
            variant: "destructive",
          })

          // Redirect to home after a delay
          setTimeout(() => {
            router.push("/")
          }, 3000)

          return
        }

        // Exchange the code for a session
        const { error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          setMessage("Failed to get session. Please try again.")
          toast({
            title: "Authentication Failed",
            description: "Failed to establish a session. Please try again.",
            variant: "destructive",
          })

          // Redirect to home after a delay
          setTimeout(() => {
            router.push("/")
          }, 3000)

          return
        }

        // Success! Get the redirect path from session storage or default to home
        const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/"
        sessionStorage.removeItem("redirectAfterLogin")

        setMessage("Authentication successful! Redirecting...")
        toast({
          title: "Authentication Successful",
          description: "You have been successfully authenticated",
        })

        // Redirect to the original page or home
        router.push(redirectPath)
      } catch (error) {
        console.error("Auth callback unexpected error:", error)
        setMessage("An unexpected error occurred. Please try again.")
        toast({
          title: "Authentication Failed",
          description: "An unexpected error occurred during authentication",
          variant: "destructive",
        })

        // Redirect to home after a delay
        setTimeout(() => {
          router.push("/")
        }, 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold">Authentication</h1>
        <p className="text-muted-foreground">{message}</p>
        <div className="mt-4 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      </div>
    </div>
  )
}
