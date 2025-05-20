"use client"

import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function AuthDebug() {
  const { debugAuthState, refreshSession } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  const handleDebug = () => {
    const info = debugAuthState()
    setDebugInfo(info)
    setIsVisible(true)
  }

  const handleRefresh = async () => {
    await refreshSession()
    handleDebug()
  }

  if (!isVisible) {
    return (
      <Button variant="outline" size="sm" onClick={handleDebug}>
        Debug Auth
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Auth Debug Info</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
          Close
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleDebug}>
            Refresh Info
          </Button>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            Refresh Session
          </Button>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto max-h-80">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
