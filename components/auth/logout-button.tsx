"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { Loader2 } from "lucide-react"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function LogoutButton({ variant = "default", size = "default", className }: LogoutButtonProps) {
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()

      // Force a hard reload after a short delay if the page hasn't changed
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/"
        }
      }, 1000)
    } catch (error) {
      console.error("Error during logout:", error)

      // Force reload anyway as a fallback
      if (typeof window !== "undefined") {
        window.location.href = "/"
      }
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleLogout} disabled={isLoggingOut}>
      {isLoggingOut ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Logging out...
        </>
      ) : (
        "Logout"
      )}
    </Button>
  )
}
