"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { clientConfig } from "@/lib/client-config"

export function ClientConfigDebug() {
  const [showDebug, setShowDebug] = useState(false)

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setShowDebug(true)}>
          Debug Config
        </Button>
      </div>
    )
  }

  // Check if client config is available
  const configStatus = {
    "supabase.url": !!clientConfig.supabase.url,
    "supabase.anonKey": !!clientConfig.supabase.anonKey,
    "app.url": !!clientConfig.app.url,
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            Client Configuration
            <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>
              Close
            </Button>
          </CardTitle>
          <CardDescription>Debug information for client configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-2">Client Config Status</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(configStatus).map(([key, available]) => (
              <li key={key}>
                <span className="font-medium">{key}:</span> {available ? "✅ Available" : "❌ Missing"}
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                console.log("Client Config:", {
                  supabase: {
                    url: clientConfig.supabase.url ? clientConfig.supabase.url.substring(0, 10) + "..." : "Missing",
                    anonKey: clientConfig.supabase.anonKey
                      ? clientConfig.supabase.anonKey.substring(0, 10) + "..."
                      : "Missing",
                  },
                  app: clientConfig.app,
                })
                alert("Check console for client config details (partially redacted for security)")
              }}
            >
              Log Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
