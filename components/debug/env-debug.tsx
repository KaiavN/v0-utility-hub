"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function EnvDebug() {
  const [showDebug, setShowDebug] = useState(false)
  const [configStatus, setConfigStatus] = useState<any>({ loading: true })

  useEffect(() => {
    if (showDebug) {
      fetch("/api/config/supabase")
        .then((res) => res.json())
        .then((data) => {
          setConfigStatus({
            loading: false,
            success: !data.error,
            data,
          })
        })
        .catch((error) => {
          setConfigStatus({
            loading: false,
            success: false,
            error: error.message,
          })
        })
    }
  }, [showDebug])

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setShowDebug(true)}>
          Debug Env
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            Environment Variables
            <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>
              Close
            </Button>
          </CardTitle>
          <CardDescription>Debug information for environment variables</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-2">Supabase Configuration</h3>

          {configStatus.loading ? (
            <p>Loading configuration...</p>
          ) : configStatus.success ? (
            <div>
              <p className="text-green-600 mb-2">✅ Configuration loaded successfully</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="font-medium">URL:</span> {configStatus.data.url ? "Available" : "Missing"}
                </li>
                <li>
                  <span className="font-medium">Anon Key:</span> {configStatus.data.anonKey ? "Available" : "Missing"}
                </li>
              </ul>
            </div>
          ) : (
            <div>
              <p className="text-red-600 mb-2">❌ Error loading configuration</p>
              <p className="text-sm">{configStatus.error || configStatus.data?.error || "Unknown error"}</p>

              {configStatus.data?.debug && (
                <div className="mt-4">
                  <h4 className="font-medium mb-1">Debug Information:</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(configStatus.data.debug, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fetch("/api/config/supabase")
                  .then((res) => res.json())
                  .then((data) => {
                    console.log("Supabase Config API Response:", data)
                    setConfigStatus({
                      loading: false,
                      success: !data.error,
                      data,
                    })
                    alert("Check console for config details")
                  })
                  .catch((error) => {
                    console.error("Error fetching config:", error)
                    alert("Error fetching config: " + error.message)
                  })
              }}
            >
              Refresh Config
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
