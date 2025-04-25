"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUserPreferences } from "@/contexts/user-preferences-context"

interface RoleGuardProps {
  requiredRole: "student" | "professional"
  children: React.ReactNode
  fallbackPath?: string
}

export default function RoleGuard({ requiredRole, children, fallbackPath = "/" }: RoleGuardProps) {
  const router = useRouter()
  const { preferences, isLoading } = useUserPreferences()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    // Don't check access until preferences are loaded
    if (isLoading) {
      return
    }

    // Check if user has the required role
    const userHasAccess = preferences.role === requiredRole
    setHasAccess(userHasAccess)

    // Redirect if user doesn't have access
    if (!userHasAccess) {
      router.push(fallbackPath)
    }
  }, [requiredRole, fallbackPath, router, preferences, isLoading])

  // Show nothing while checking access or if user doesn't have access
  if (isLoading || hasAccess === null || hasAccess === false) {
    return null
  }

  // User has access, show children
  return <>{children}</>
}
