"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

// This component is for debugging environment variables in the browser
export default function EnvVariablesDebug() {
  const [publicVars, setPublicVars] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkPublicEnvVars = () => {
    setIsLoading(true)
    setError(null)

    try {
      // Only check public environment variables that should be accessible in the browser
      const vars: Record<string, boolean> = {
        NEXT_PUBLIC_GOOGLE_CLIENT_ID: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        STORAGE_NEXT_PUBLIC_SUPABASE_URL: !!process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL,
        STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_VERCEL_URL: !!process.env.NEXT_PUBLIC_VERCEL_URL,
        NEXT_PUBLIC_AUTH_DEBUG: !!process.env.NEXT_PUBLIC_AUTH_DEBUG,
      }

      setPublicVars(vars)
    } catch (err) {
      setError("Error checking environment variables: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  const checkServerEnvVars = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/debug/env-check")
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const data = await response.json()
      setPublicVars(data.variables || {})
    } catch (err) {
      setError("Error checking server environment variables: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Environment Variables Debug</CardTitle>
        <CardDescription>Check if environment variables are properly loaded</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="client">
          <TabsList className="mb-4">
            <TabsTrigger value="client">Client Variables</TabsTrigger>
            <TabsTrigger value="server">Server Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="client">
            <div className="space-y-4">
              <Button onClick={checkPublicEnvVars} disabled={isLoading}>
                {isLoading ? "Checking..." : "Check Client Environment Variables"}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {Object.keys(publicVars).length > 0 && (
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-2">Public Environment Variables</h3>
                  <div className="space-y-2">
                    {Object.entries(publicVars).map(([key, exists]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-mono text-sm">{key}</span>
                        {exists ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="server">
            <div className="space-y-4">
              <Button onClick={checkServerEnvVars} disabled={isLoading}>
                {isLoading ? "Checking..." : "Check Server Environment Variables"}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {Object.keys(publicVars).length > 0 && (
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-2">Server Environment Variables</h3>
                  <div className="space-y-2">
                    {Object.entries(publicVars).map(([key, exists]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="font-mono text-sm">{key}</span>
                        {exists ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
