"use client"

import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export function SimpleAuthButton() {
  const handleGitHubLogin = () => {
    // Simple GitHub login redirect
    window.location.href = "/api/auth/github"
  }

  return (
    <Button onClick={handleGitHubLogin} variant="outline" size="sm" className="flex items-center gap-2">
      <Github className="h-4 w-4" />
      Sign in with GitHub
    </Button>
  )
}

export default SimpleAuthButton
