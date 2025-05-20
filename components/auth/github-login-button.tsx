"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Github } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { usePathname } from "next/navigation"

interface GitHubLoginButtonProps {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function GitHubLoginButton({ className = "", variant = "default", size = "default" }: GitHubLoginButtonProps) {
  const { loginWithGitHub, isLoading } = useAuth()
  const [isClicked, setIsClicked] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const pathname = usePathname()

  // Get the GitHub client ID from environment variables
  useEffect(() => {
    if (typeof window !== "undefined") {
      const envClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ""
      setClientId(envClientId)

      if (!envClientId) {
        console.warn("NEXT_PUBLIC_GITHUB_CLIENT_ID is not set. GitHub login may not work correctly.")
      } else {
        console.log("GitHub client ID is configured:", envClientId.substring(0, 4) + "...")
      }
    }
  }, [])

  const handleLogin = async () => {
    if (isLoading || isClicked) return

    try {
      setIsClicked(true)
      console.log("GitHub login button clicked")

      // Store current path for redirect after login
      if (typeof window !== "undefined") {
        localStorage.setItem("redirectAfterLogin", pathname || "/")

        // Clear any existing auth state to prevent conflicts
        localStorage.removeItem("supabase.auth.token")
        localStorage.removeItem("sb-access-token")
        localStorage.removeItem("sb-refresh-token")
        sessionStorage.removeItem("supabase.auth.token")
      }

      // Get the absolute URL for the callback
      const siteUrl = typeof window !== "undefined" ? window.location.origin : ""
      const redirectUrl = `${siteUrl}/auth/callback`
      console.log("Using redirect URL:", redirectUrl)

      // Add a small delay to ensure any previous auth state is cleared
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Pass the client ID to the login function
      await loginWithGitHub(redirectUrl, clientId || undefined)
    } catch (error) {
      console.error("Error in GitHub login button:", error)
      toast({
        title: "Login Failed",
        description: "Failed to initiate GitHub login. Please try again.",
        variant: "destructive",
      })
      setIsClicked(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
      onClick={handleLogin}
      disabled={isLoading || isClicked}
    >
      <Github className="h-4 w-4" />
      {isLoading || isClicked ? "Connecting..." : "Sign in with GitHub"}
    </Button>
  )
}
