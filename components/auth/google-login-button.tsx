"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

interface GoogleLoginButtonProps {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function GoogleLoginButton({ className = "", variant = "default", size = "default" }: GoogleLoginButtonProps) {
  const { loginWithGoogle, isLoading } = useAuth()
  const [isClicked, setIsClicked] = useState(false)

  const handleLogin = async () => {
    if (isLoading || isClicked) return

    setIsClicked(true)
    await loginWithGoogle()
    // No need to reset isClicked as we'll be redirected to Google
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
      onClick={handleLogin}
      disabled={isLoading || isClicked}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
        <path
          fill="currentColor"
          d="M12.545 12.151L12.545 12.151L12.545 12.151L12.545 12.151L12.545 12.151L12.545 12.151L12.545 12.151L12.545 12.151M12.545 12.151L12.545 12.151L12.545 12.151M12.545 12.151L12.545 12.151L12.545 12.151M12.545 12.151L12.545 12.151L12.545 12.151M22.54 12.234c0-.705-.06-1.39-.173-2.045H12v3.868h5.92a5.068 5.068 0 0 1-2.195 3.32v2.76h3.554c2.08-1.915 3.28-4.735 3.28-7.903Z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.966 0 5.455-.984 7.27-2.663l-3.554-2.76c-.986.66-2.248 1.05-3.716 1.05-2.857 0-5.275-1.927-6.143-4.517H2.17v2.85A10.996 10.996 0 0 0 12 23Z"
        />
        <path
          fill="currentColor"
          d="M5.857 14.11c-.218-.658-.345-1.36-.345-2.09s.127-1.432.345-2.09V7.08H2.17A10.996 10.996 0 0 0 1 12.02c0 1.777.425 3.462 1.17 4.95l3.687-2.86Z"
        />
        <path
          fill="currentColor"
          d="M12 5.423c1.607 0 3.054.55 4.19 1.636l3.155-3.155C17.454 2.09 14.965 1 12 1a10.996 10.996 0 0 0-9.83 6.08l3.687 2.86C6.725 7.35 9.143 5.423 12 5.423Z"
        />
      </svg>
      {isLoading || isClicked ? "Connecting..." : "Sign in with Google"}
    </Button>
  )
}
