"use client"

import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function GitHubLoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    try {
      setIsLoading(true)

      // Redirect to GitHub auth endpoint
      const response = await fetch("/api/auth/login?provider=github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.url) {
        // Redirect to the authorization URL
        window.location.href = data.url
      } else {
        console.error("Failed to get authorization URL")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error during GitHub login:", error)
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleLogin} disabled={isLoading} className="w-full">
      {isLoading ? (
        <>
          <span className="animate-spin mr-2">⚪</span>
          Signing in...
        </>
      ) : (
        <>
          <Github className="h-4 w-4 mr-2" />
          Sign in with GitHub
        </>
      )}
    </Button>
  )
}
