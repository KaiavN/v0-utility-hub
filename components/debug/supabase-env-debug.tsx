"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SupabaseEnvDebug() {
  const [showDebug, setShowDebug] = useState(false)
  const [envStatus, setEnvStatus] = useState<any>(null)

  const checkEnvVariables = async () => {
    try {
      const response = await fetch("/api/config/supabase")
      const data = await response.json()

      setEnvStatus({
        success: !data.error,
        data,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setEnvStatus({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  if (!showDebug) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setShowDebug(true)}>
          Debug Supabase Env
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-96">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            Supabase Environment Variables
            <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>
              Close
            </Button>
          </CardTitle>
          <CardDescription>Check if Supabase environment variables are correctly set</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" size="sm" onClick={checkEnvVariables} className="mb-4">
            Check Environment Variables
          </Button>

          {envStatus && (
            <div className="mt-4">
              {envStatus.success ? (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription>✅ Supabase environment variables are correctly set</AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription>
                    ❌ Error: {envStatus.error || envStatus.data?.error || "Unknown error"}
                  </AlertDescription>
                </Alert>
              )}

              {envStatus.data?.debug && (
                <div className="mt-4 text-sm">
                  <h4 className="font-medium mb-1">Debug Information:</h4>
                  <div className="bg-gray-50 p-2 rounded border">
                    <p>URL available: {envStatus.data.debug.hasUrl ? "Yes" : "No"}</p>
                    <p>Anon Key available: {envStatus.data.debug.hasAnonKey ? "Yes" : "No"}</p>
                    <p>Environment keys:</p>
                    <ul className="list-disc pl-5 text-xs">
                      {envStatus.data.debug.envKeys.map((key: string) => (
                        <li key={key}>{key}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
