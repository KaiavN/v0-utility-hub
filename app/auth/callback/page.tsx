"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { logAuthDebug, logAuthError, extractAuthInfoFromUrl } from "@/lib/auth-debug"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Create a Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error("Missing Supabase environment variables")
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Extract and log auth info from URL for debugging
        const authInfo = extractAuthInfoFromUrl()
        logAuthDebug("Auth callback URL info:", authInfo)

        // Check for error in URL or hash
        if (authInfo?.error) {
          logAuthError("Auth callback error:", {
            error: authInfo.error,
            description: authInfo.errorDescription,
          })

          setError(authInfo.errorDescription || "Authentication failed")
          toast({
            title: "Authentication Error",
            description: authInfo.errorDescription || "Authentication failed",
            variant: "destructive",
          })
          setIsProcessing(false)
          return
        }

        // First try to get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          logAuthError("Error getting session:", sessionError)
        }

        // If we already have a valid session, we can redirect
        if (sessionData?.session) {
          logAuthDebug("Session already exists, redirecting...")
          const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/"
          sessionStorage.removeItem("redirectAfterLogin")
          router.push(redirectPath)
          return
        }

        // Handle code in query params (typical OAuth flow)
        if (authInfo?.code) {
          logAuthDebug("Processing OAuth code")
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authInfo.code)

          if (exchangeError) {
            logAuthError("Error exchanging code for session:", exchangeError)
            setError("Failed to complete authentication")
            toast({
              title: "Authentication Error",
              description: "Failed to complete authentication",
              variant: "destructive",
            })
            setIsProcessing(false)
            return
          }
        }
        // Handle hash fragment (often used by GitHub)
        else if (window.location.hash && authInfo?.accessToken) {
          logAuthDebug("Processing hash fragment with access token")
          try {
            // We have an access token in the hash, try to set the session manually
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: authInfo.accessToken,
              refresh_token: authInfo.refreshToken || "",
              expires_in: authInfo.expiresIn ? Number.parseInt(authInfo.expiresIn) : 3600,
            })

            if (setSessionError) {
              logAuthError("Error setting session from hash:", setSessionError)
              throw setSessionError
            }
          } catch (hashError) {
            logAuthError("Error processing hash with access token:", hashError)

            // Try the full hash as a fallback
            logAuthDebug("Trying to exchange full hash for session")
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.hash)

            if (exchangeError) {
              logAuthError("Error exchanging hash for session:", exchangeError)
              setError("Failed to process authentication data")
              toast({
                title: "Authentication Error",
                description: "Failed to process authentication data",
                variant: "destructive",
              })
              setIsProcessing(false)
              return
            }
          }
        } else {
          logAuthError("No code or hash found in URL", { url: window.location.href })
          setError("No authentication data found")
          toast({
            title: "Authentication Error",
            description: "No authentication data found",
            variant: "destructive",
          })
          setIsProcessing(false)
          return
        }

        // Check if we have a session now
        const { data: finalSessionData, error: finalSessionError } = await supabase.auth.getSession()

        if (finalSessionError) {
          logAuthError("Error getting final session:", finalSessionError)
          setError("Failed to verify authentication")
          toast({
            title: "Authentication Error",
            description: "Failed to verify authentication",
            variant: "destructive",
          })
          setIsProcessing(false)
          return
        }

        if (!finalSessionData.session) {
          logAuthError("No session after authentication", { authInfo })
          setError("Authentication completed but no session was created")
          toast({
            title: "Authentication Error",
            description: "Authentication completed but no session was created",
            variant: "destructive",
          })
          setIsProcessing(false)
          return
        }

        // Ensure profile exists for this user
        await ensureUserProfile(supabase, finalSessionData.session.user)

        // Redirect to the stored path or home
        const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/"
        sessionStorage.removeItem("redirectAfterLogin")

        logAuthDebug("Authentication successful, redirecting to:", redirectPath)
        toast({
          title: "Authentication Successful",
          description: "You have been successfully logged in",
        })
        router.push(redirectPath)
      } catch (err) {
        logAuthError("Unexpected error during auth callback:", err)
        setError("An unexpected error occurred")
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
        setIsProcessing(false)
      }
    }

    // Helper function to ensure user profile exists
    async function ensureUserProfile(supabase: any, user: any) {
      try {
        logAuthDebug("Ensuring user profile exists for:", { id: user.id, email: user.email })

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          logAuthError("Error checking profile:", profileError)
        }

        // If profile doesn't exist, create it manually
        if (!profile) {
          logAuthDebug("Profile not found, creating manually")
          const displayName =
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            (user.email ? user.email.split("@")[0] : "User")

          const { error: insertError } = await supabase.from("profiles").insert([
            {
              id: user.id,
              email: user.email,
              display_name: displayName,
              avatar_url: user.user_metadata?.avatar_url || null,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              role: "user",
            },
          ])

          if (insertError) {
            logAuthError("Error creating profile manually:", insertError)
          } else {
            logAuthDebug("Profile created successfully")
          }
        } else {
          logAuthDebug("Profile already exists")
        }
      } catch (error) {
        logAuthError("Error ensuring user profile:", error)
      }
    }

    processAuth()
  }, [router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h1 className="text-xl font-semibold text-red-700 mb-2">Authentication Error</h1>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Completing authentication...</h1>
        <p className="text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  )
}
