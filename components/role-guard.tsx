"use client"

import type React from "react"

import { useUserPreferences } from "@/contexts/user-preferences-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface RoleGuardProps {
  allowedRoles: Array<"student" | "professional">
  children: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({ allowedRoles, children, redirectTo = "/" }: RoleGuardProps) {
  const { preferences, isLoading } = useUserPreferences()
  const router = useRouter()
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false)

  // Wait for preferences to load before checking access
  useEffect(() => {
    if (!isLoading) {
      const userRole = preferences?.role || "student" // Default to student if no role is set
      const hasAccess = allowedRoles.includes(userRole)
      setHasCheckedAccess(true)

      if (!hasAccess && redirectTo) {
        router.push(redirectTo)
      }
    }
  }, [allowedRoles, isLoading, preferences, redirectTo, router])

  // Show loading or nothing while checking access
  if (isLoading || !hasCheckedAccess) {
    return null // Or a loading spinner if preferred
  }

  // Get current role with fallback
  const currentRole = preferences?.role || "student"
  const hasAccess = allowedRoles.includes(currentRole)

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            This feature is only available to {allowedRoles.join(" or ")} accounts. Please switch your role to access
            this page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push(redirectTo)}>Return to Dashboard</Button>
      </div>
    )
  }

  return <>{children}</>
}
