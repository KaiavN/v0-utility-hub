"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"

export function OAuthTroubleshooter() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    // Check for GitHub client ID in environment variables
    const envClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ""
    setClientId(envClientId)
  }, [])

  const checkOAuthConfig = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/debug-oauth")
      if (!response.ok) {
        throw new Error(`Error checking OAuth config: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error("Error checking OAuth config:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const clearLocalStorage = () => {
    try {
      // Clear all auth-related items from localStorage
      const authItemPrefixes = ["sb-", "supabase-", "auth-"]

      // Get all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (
          key &&
          (authItemPrefixes.some((prefix) => key.startsWith(prefix)) || key.includes("auth") || key.includes("token"))
        ) {
          console.log(`Clearing localStorage item: ${key}`)
          localStorage.removeItem(key)
        }
      }

      alert("Auth storage cleared. Please try logging in again.")
    } catch (err) {
      console.error("Error clearing local storage:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>OAuth Troubleshooter</CardTitle>
        <CardDescription>Check your OAuth configuration and troubleshoot login issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>GitHub Client ID:</span>
            {clientId ? (
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs">{clientId.substring(0, 4)}...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-xs">Not found</span>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="space-y-3 text-sm mt-4">
            <div className="flex items-center justify-between">
              <span>GitHub OAuth Configured:</span>
              {result.githubConfigured ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Supabase Configured:</span>
              {result.supabaseConfigured ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>

            <div className="pt-2">
              <p className="font-semibold">Callback URL:</p>
              <p className="text-xs break-all bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">{result.callbackUrl}</p>
              <p className="text-xs mt-1 text-gray-500">
                Make sure this matches the callback URL in your GitHub OAuth app settings
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <p className="text-sm text-gray-500">If you&apos;re having trouble logging in, try these steps:</p>
          <ul className="list-disc pl-5 text-sm text-gray-500">
            <li>Clear your browser cache and cookies</li>
            <li>Try using a private/incognito window</li>
            <li>Make sure your GitHub account has a verified email</li>
            <li>Check that the callback URL is correctly configured</li>
            <li>Verify the GitHub client ID is correctly set in environment variables</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={clearLocalStorage}>
          Clear Auth Storage
        </Button>
        <Button onClick={checkOAuthConfig} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Check Configuration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
