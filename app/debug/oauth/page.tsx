"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { OAuthTroubleshooter } from "@/components/auth/oauth-troubleshooter"
import { useAuth } from "@/contexts/auth-context"

export default function OAuthDebugPage() {
  const { debugAuthState } = useAuth()
  const [authState, setAuthState] = useState<any>(null)
  const [envVars, setEnvVars] = useState<any>({})

  useEffect(() => {
    // Check for environment variables
    setEnvVars({
      NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
        ? `${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID.substring(0, 4)}...`
        : null,
    })
  }, [])

  const handleDebug = () => {
    const state = debugAuthState()
    setAuthState(state)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">OAuth Debug Page</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Check if environment variables are properly loaded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">NEXT_PUBLIC_GITHUB_CLIENT_ID:</span>
                <span>{envVars.NEXT_PUBLIC_GITHUB_CLIENT_ID || "Not set"}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auth State</CardTitle>
            <CardDescription>Debug your current authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            {authState ? (
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-60">
                {JSON.stringify(authState, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">Click "Debug Auth State" to view your current auth state</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleDebug}>Debug Auth State</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8">
        <OAuthTroubleshooter />
      </div>
    </div>
  )
}
