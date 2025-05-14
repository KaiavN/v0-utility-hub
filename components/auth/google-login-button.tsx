"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface GoogleLoginButtonProps {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function GoogleLoginButton({ className = "", variant = "default", size = "default" }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isClientReady, setIsClientReady] = useState(false)
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)

  useEffect(() => {
    // Check if Google Client ID is available
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    setGoogleClientId(clientId || null)

    if (!clientId) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set")
    }

    // Initialize Supabase client after component mounts to avoid SSR issues
    setSupabase(createClient())
    setIsClientReady(true)
  }, [])

  const handleLogin = async () => {
    if (isLoading || !isClientReady || !supabase) return

    try {
      setIsLoading(true)
      console.log("Google login button clicked")

      // Store the current path to redirect back after login
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
        } catch (storageError) {
          console.warn("Error storing redirect path:", storageError)
        }
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("Google login error:", error)
        toast({
          title: "Login Failed",
          description: error.message || "Failed to login with Google",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      } else {
        setIsLoading(false)
        toast({
          title: "Login Failed",
          description: "Failed to initiate Google login",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Google login unexpected error:", error)
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
        onClick={handleLogin}
        disabled={isLoading || !isClientReady}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg
            className="h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
        )}
        {isLoading ? "Connecting..." : "Sign in with Google"}
      </Button>

      {!googleClientId && !isLoading && (
        <div className="text-xs text-red-500 mt-1">Warning: Google Client ID not configured</div>
      )}
    </>
  )
}
