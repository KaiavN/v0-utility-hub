"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSupabaseClient } from "@/lib/supabase-client"

export function AuthConfigChecker() {
  const [config, setConfig] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkConfiguration = async () => {
    setIsChecking(true)
    try {
      // Check Supabase configuration
      const response = await fetch("/api/config/supabase")
      const supabaseConfig = await response.json()

      // Check current URL and expected redirect
      const currentOrigin = window.location.origin
      const expectedRedirectUrl = `${currentOrigin}/auth/callback`

      // Get Supabase client info
      const supabase = getSupabaseClient()

      setConfig({
        supabaseUrl: supabaseConfig.url,
        hasAnonKey: !!supabaseConfig.anonKey,
        currentOrigin,
        expectedRedirectUrl,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error checking configuration:", error)
      setConfig({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConfiguration()
  }, [])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Authentication Configuration Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkConfiguration} disabled={isChecking}>
          {isChecking ? "Checking..." : "Refresh Configuration"}
        </Button>

        {config && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Supabase URL:</span>
              <Badge variant={config.supabaseUrl ? "default" : "destructive"}>
                {config.supabaseUrl ? "✓ Configured" : "✗ Missing"}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">Anon Key:</span>
              <Badge variant={config.hasAnonKey ? "default" : "destructive"}>
                {config.hasAnonKey ? "✓ Configured" : "✗ Missing"}
              </Badge>
            </div>

            <div className="space-y-1">
              <span className="font-medium">Expected Redirect URL:</span>
              <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                {config.expectedRedirectUrl}
              </code>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This URL must be configured in your GitHub OAuth app and Supabase project.
              </p>
            </div>

            {config.error && (
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded">
                <span className="text-red-800 dark:text-red-200">Error: {config.error}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded">
          <h4 className="font-medium mb-2">Configuration Steps:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>In your GitHub OAuth app, set the Authorization callback URL to the redirect URL above</li>
            <li>In Supabase, go to Authentication → Providers → GitHub</li>
            <li>Enter your GitHub OAuth app's Client ID and Client Secret</li>
            <li>Ensure the redirect URL matches exactly (including https://)</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
