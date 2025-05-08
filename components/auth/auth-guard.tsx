"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

export function AuthGuard({ children, fallback, redirectTo = "/", requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip the check if we're still loading auth state
    if (isLoading) return

    // If we require authentication and user is not authenticated
    if (requireAuth && !isAuthenticated) {
      if (redirectTo) {
        // Store the current path to redirect back after login
        sessionStorage.setItem("redirectAfterLogin", pathname || "/")
        router.push(redirectTo)
      }
    }

    // If we require user to be NOT authenticated (like login page) and user IS authenticated
    if (!requireAuth && isAuthenticated) {
      // Check if we have a stored redirect path
      const redirectPath = sessionStorage.getItem("redirectAfterLogin")
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin")
        router.push(redirectPath)
      } else {
        router.push("/")
      }
    }

    setIsChecking(false)
  }, [isAuthenticated, isLoading, requireAuth, router, redirectTo, pathname])

  // Show loading state
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If we require auth and user is not authenticated, show fallback
  if (requireAuth && !isAuthenticated) {
    return fallback || null
  }

  // If we require user to be NOT authenticated and user IS authenticated, return null
  if (!requireAuth && isAuthenticated) {
    return null
  }

  // Otherwise, render children
  return <>{children}</>
}
