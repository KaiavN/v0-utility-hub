"use client"

import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { signInWithGoogle, isAuthReady } from "@/lib/supabase-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GoogleLoginButtonProps {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  fullWidth?: boolean
  showErrors?: boolean
}

export function GoogleLoginButton({
  className = "",
  variant = "default",
  size = "default",
  fullWidth = false,
  showErrors = true,
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if auth system is ready
  useEffect(() => {
    setIsReady(isAuthReady())

    // Store the current path to redirect back after login
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
      } catch (storageError) {
        console.warn("Error storing redirect path:", storageError)
      }
    }
  }, [])

  const handleLogin = async () => {
    if (isLoading || !isReady) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("Google login button clicked")
      await signInWithGoogle()

      // If we reach here, it means we're waiting for redirect
      // The actual sign-in completion happens in the callback page
    } catch (error) {
      console.error("Google login error:", error)

      const errorMessage = error instanceof Error ? error.message : "Failed to initiate Google login"

      setError(errorMessage)

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      })

      setIsLoading(false)
    }
  }

  const widthClass = fullWidth ? "w-full" : ""

  return (
    <div className={fullWidth ? "w-full" : ""}>
      <Button
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${widthClass} ${className}`}
        onClick={handleLogin}
        disabled={isLoading || !isReady}
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

      {showErrors && error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
