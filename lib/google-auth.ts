// Direct Google OAuth implementation
import { getSupabaseClient } from "@/lib/supabase-client"

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ""
const REDIRECT_URI = typeof window !== "undefined" ? `${window.location.origin}/api/auth/google/callback` : ""

export async function initiateGoogleAuth() {
  // Generate a random state value for security
  const state = Math.random().toString(36).substring(2, 15)

  // Store state in sessionStorage for verification later
  if (typeof window !== "undefined") {
    sessionStorage.setItem("googleOAuthState", state)
    sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
  }

  // Construct the Google OAuth URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  googleAuthUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID)
  googleAuthUrl.searchParams.append("redirect_uri", REDIRECT_URI)
  googleAuthUrl.searchParams.append("response_type", "code")
  googleAuthUrl.searchParams.append("scope", "email profile openid")
  googleAuthUrl.searchParams.append("access_type", "offline")
  googleAuthUrl.searchParams.append("prompt", "consent select_account")
  googleAuthUrl.searchParams.append("state", state)

  return googleAuthUrl.toString()
}

export async function handleGoogleCallback(code: string, state: string) {
  // Verify state parameter to prevent CSRF attacks
  const storedState = sessionStorage.getItem("googleOAuthState")
  if (state !== storedState) {
    throw new Error("Invalid state parameter")
  }

  // Clear state from storage
  sessionStorage.removeItem("googleOAuthState")

  try {
    // Exchange code for tokens
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`)
    }

    const tokens = await response.json()

    // Get user info with the access token
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info")
    }

    const userInfo = await userInfoResponse.json()

    // Sign in to Supabase with the Google ID token
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: tokens.id_token,
    })

    if (error) {
      throw error
    }

    return { success: true, user: data.user }
  } catch (error) {
    console.error("Google auth callback error:", error)
    return { success: false, error }
  }
}
