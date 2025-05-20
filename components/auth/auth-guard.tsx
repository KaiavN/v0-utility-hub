"use client"

import type { ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading, debugAuthState } = useAuth()
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    // Update debug info
    setDebugInfo(debugAuthState())

    // Check if we're in development mode
    setShowDebug(process.env.NODE_ENV === "development")

    console.log("AuthGuard state:", { isAuthenticated, isLoading })
  }, [isAuthenticated, isLoading, debugAuthState])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>

          {/* Debug information */}
          {showDebug && (
            <div className="mt-4 p-2 border rounded text-left text-xs">
              <details>
                <summary className="font-bold cursor-pointer">Auth Debug</summary>
                <pre className="mt-2">{JSON.stringify(debugInfo, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </div>
    )
  }

  // If not authenticated, show fallback
  if (!isAuthenticated) {
    return (
      <>
        {fallback}

        {/* Debug information */}
        {showDebug && (
          <div className="mt-4 p-2 border rounded text-left text-xs">
            <details>
              <summary className="font-bold cursor-pointer">Auth Debug</summary>
              <pre className="mt-2">{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          </div>
        )}
      </>
    )
  }

  // If authenticated, show children
  return (
    <>
      {children}

      {/* Debug information */}
      {showDebug && (
        <div className="mt-4 p-2 border rounded text-left text-xs">
          <details>
            <summary className="font-bold cursor-pointer">Auth Debug</summary>
            <pre className="mt-2">{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        </div>
      )}
    </>
  )
}
