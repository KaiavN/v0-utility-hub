"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Github } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface GitHubLoginButtonProps {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function GitHubLoginButton({ className = "", variant = "default", size = "default" }: GitHubLoginButtonProps) {
  const { loginWithGitHub, isLoading } = useAuth()
  const [isClicked, setIsClicked] = useState(false)

  const handleLogin = async () => {
    if (isLoading || isClicked) return

    try {
      setIsClicked(true)
      console.log("GitHub login button clicked")
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
