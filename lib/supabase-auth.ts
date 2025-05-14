import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"

// Store the current auth state in memory to avoid unnecessary calls
let cachedUser: User | null = null

// Function to ensure consistent state parameter generation
export function generateStateParameter(): string {
  // Create a random state parameter for CSRF protection
  const state = crypto
    .getRandomValues(new Uint8Array(16))
    .reduce((acc, val) => acc + val.toString(16).padStart(2, "0"), "")

  // Store in sessionStorage for verification during callback
  try {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("supabaseAuthState", state)
    }
  } catch (e) {
    console.warn("Failed to store state parameter", e)
  }

  return state
}

// Function to verify state parameter during callback
export function verifyStateParameter(returnedState: string): boolean {
  try {
    if (typeof window !== "undefined") {
      const storedState = sessionStorage.getItem("supabaseAuthState")
      // Clean up after checking
      sessionStorage.removeItem("supabaseAuthState")

      return storedState === returnedState
    }
  } catch (e) {
    console.warn("Failed to verify state parameter", e)
  }

  return false
}

// Function to get current user with caching
export async function getCurrentUser(): Promise<User | null> {
  // Return cached user if available
  if (cachedUser) return cachedUser

  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error.message)
      return null
    }

    // Cache the user
    cachedUser = data.user
    return data.user
  } catch (e) {
    console.error("Unexpected error getting user:", e)
    return null
  }
}

// Function to sign in with Google using OAuth
export async function signInWithGoogle() {
  const supabase = createClient()

  // Get origin for redirect
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const redirectUrl = `${origin}/auth/callback`

  try {
    // First try standard OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          // Request minimum necessary scopes
          scope: "email profile",
          // Force account selection to avoid cached credentials issues
          prompt: "select_account",
          // Request offline access for refresh tokens
          access_type: "offline",
          // Include state parameter for CSRF protection
          state: generateStateParameter(),
        },
      },
    })

    if (error) {
      console.error("Google sign-in error:", error.message)
      throw error
    }

    // Redirect to Google's OAuth page
    if (data?.url) {
      window.location.href = data.url
    } else {
      throw new Error("No redirect URL returned from Supabase")
    }

    return true
  } catch (e) {
    console.error("Failed to sign in with Google:", e)
    throw e
  }
}

// Function to sign out
export async function signOut() {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Sign out error:", error.message)
      throw error
    }

    // Clear cached user
    cachedUser = null

    // Clear any auth-related storage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("supabaseAuthState")
      // Clear any other auth-related items
      localStorage.removeItem("supabase.auth.token")
    }

    return true
  } catch (e) {
    console.error("Failed to sign out:", e)
    throw e
  }
}

// Function to handle auth state change
export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  const supabase = createClient()

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event)

    // Update cached user
    cachedUser = session?.user || null

    // Call the callback with the user
    callback(cachedUser)
  })

  // Return unsubscribe function
  return () => {
    data.subscription.unsubscribe()
  }
}

// Function to get idToken for server-side verification
export async function getIdToken(): Promise<string | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
      console.error("Error getting session for ID token:", error?.message)
      return null
    }

    return data.session.provider_token || null
  } catch (e) {
    console.error("Failed to get ID token:", e)
    return null
  }
}

// Helper function to check if authentication is ready
export function isAuthReady(): boolean {
  return typeof window !== "undefined" && !!createClient()
}
