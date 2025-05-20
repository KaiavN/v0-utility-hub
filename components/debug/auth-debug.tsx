"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"

export function AuthDebug() {
  const auth = useAuth()
  const [debugState, setDebugState] = useState<any>({})

  useEffect(() => {
    // Update debug state every second
    const interval = setInterval(() => {
      setDebugState(auth.debugAuthState())
    }, 1000)

    return () => clearInterval(interval)
  }, [auth])

  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="p-4 border rounded bg-gray-50 text-xs">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <pre className="whitespace-pre-wrap">{JSON.stringify(debugState, null, 2)}</pre>
    </div>
  )
}
