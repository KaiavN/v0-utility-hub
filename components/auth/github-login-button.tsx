"use client"

import { useState } from "react"
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
  const pathname = usePathname()

  const handleLogin = async () => {
    if (isLoading || isClicked) return

    try {
      setIsClicked(true)
      console.log("GitHub login button clicked")

      // Store current path for redirect after login
      if (typeof window !== "undefined") {
        localStorage.setItem("redirectAfterLogin", pathname || "/")
      }

      // Get the absolute URL for the callback
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const callbackUrl = `${origin}/auth/callback`
      console.log("Using callback URL:", callbackUrl)

      await loginWithGitHub()
      // No need to reset isClicked as we'll be redirected to GitHub
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
