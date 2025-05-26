"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export function GitHubAuthDebug() {
  const { user, isAuthenticated, debugAuthState } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [gitHubInfo, setGitHubInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchGitHubInfo = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()

      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`)
      }

      if (!sessionData.session) {
        throw new Error("No active session found")
      }

      // Get user
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        throw new Error(`User error: ${userError.message}`)
      }

      // Get profile from database
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.warn("Profile fetch error:", profileError)
      }

      // Compile debug info
      const info = {
        auth: {
          provider: userData.user.app_metadata?.provider || "none",
          isGitHub: userData.user.app_metadata?.provider === "github",
          email: userData.user.email,
          emailConfirmed: userData.user.email_confirmed_at ? true : false,
          id: userData.user.id,
          lastSignIn: userData.user.last_sign_in_at,
          metadata: userData.user.user_metadata,
        },
        profile: profileData || null,
        session: {
          valid: !!sessionData.session,
          expires: sessionData.session?.expires_at
            ? new Date(sessionData.session.expires_at * 1000).toISOString()
            : null,
        },
      }

      setGitHubInfo(info)
      setDebugInfo(debugAuthState())
    } catch (err) {
      console.error("GitHub debug error:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchGitHubInfo()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub Authentication Debug</CardTitle>
          <CardDescription>Sign in to view GitHub authentication details</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>You must be logged in to use this tool</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Authentication Debug</CardTitle>
        <CardDescription>Troubleshoot GitHub authentication issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading authentication data...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="rounded-md bg-muted p-4">
              <div className="font-medium">Authentication Status</div>
              <div className="mt-2 flex items-center">
                {gitHubInfo?.auth?.isGitHub ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    <span>Authenticated with GitHub</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                    <span>Not using GitHub authentication (using {gitHubInfo?.auth?.provider || "email"})</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium">User Details</div>
              <pre className="rounded-md bg-muted p-4 overflow-auto text-xs">{JSON.stringify(gitHubInfo, null, 2)}</pre>
            </div>

            <div className="space-y-2">
              <div className="font-medium">Auth Context State</div>
              <pre className="rounded-md bg-muted p-4 overflow-auto text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>

            <Button onClick={fetchGitHubInfo} className="w-full">
              Refresh Debug Info
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
