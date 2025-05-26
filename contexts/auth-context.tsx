"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase-client"

// Simplified User type
type User = {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  loginWithGitHub: () => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<boolean>
  profile: any | null
  updateProfile: (data: any) => Promise<boolean>
  debugAuthState: () => any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<Error | null>(null)
  const router = useRouter()

  // Get Supabase client
  const supabase = getSupabaseClient()

  // Debug function to expose auth state
  const debugAuthState = () => {
    return {
      user,
      profile,
      isAuthenticated,
      isLoading,
      authError: authError?.message,
      hasSupabase: !!supabase,
      timestamp: new Date().toISOString(),
    }
  }

  // Helper function to ensure user profile exists
  const ensureUserProfile = async (userData: User) => {
    try {
      console.log("Ensuring user profile exists for:", userData.id)

      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError)
      }

      if (profileData) {
        setProfile(profileData)
        return profileData
      } else {
        // If profile doesn't exist, create one
        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: userData.id,
            email: userData.email,
            display_name: userData.name || userData.email?.split("@")[0] || "User",
            avatar_url: userData.avatarUrl || null,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            role: "user",
          },
        ])

        if (insertError) {
          console.error("Error creating profile:", insertError)
          return null
        }

        // Fetch the newly created profile
        const { data: newProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userData.id)
          .single()

        if (fetchError) {
          console.error("Error fetching new profile:", fetchError)
          return null
        }

        if (newProfile) {
          setProfile(newProfile)
          return newProfile
        }
      }
    } catch (error) {
      console.error("Error ensuring user profile:", error)
    }
    return null
  }

  // Load user data on initial mount
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true)
      setAuthError(null)

      try {
        console.log("Checking authentication state...")

        // Check if we have a session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          setAuthError(sessionError)
          throw sessionError
        }

        if (session) {
          // User is logged in
          console.log("Session found, user is authenticated")

          const userData: User = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "",
            avatarUrl: session.user.user_metadata?.avatar_url || "",
          }

          setUser(userData)
          setIsAuthenticated(true)

          // Ensure profile exists
          await ensureUserProfile(userData)
        } else {
          // No active session
          console.log("No session found, user is not authenticated")
          setUser(null)
          setProfile(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Error loading user:", error)
        setAuthError(error instanceof Error ? error : new Error(String(error)))
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
      } finally {
        console.log("Auth loading complete, state:", {
          isAuthenticated: !!user,
          hasUser: !!user,
        })
        setIsLoading(false)
      }
    }

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Auth loading timeout reached, forcing state update")
        setIsLoading(false)
      }
    }, 5000) // 5 second timeout

    loadUser()

    // Set up auth state change listener
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_IN" && session) {
        // User signed in
        console.log("User signed in event received")

        const userData: User = {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "",
          avatarUrl: session.user.user_metadata?.avatar_url || "",
        }

        setUser(userData)
        setIsAuthenticated(true)
        setIsLoading(false)

        // Ensure profile exists
        await ensureUserProfile(userData)

        // If this is a GitHub login, ensure the profile is created properly
        if (session.user.app_metadata?.provider === "github") {
          try {
            // Import dynamically to avoid circular dependencies
            const { ensureGitHubUserProfile } = await import("@/lib/github-profile-helper")
            await ensureGitHubUserProfile(session.user.id)
          } catch (error) {
            console.error("Error ensuring GitHub user profile:", error)
          }
        }

        // Show success message
        toast({
          title: "Welcome!",
          description: `Successfully signed in as ${userData.email}`,
        })
      } else if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        // User signed out
        console.log("User signed out event received")
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
        setIsLoading(false)
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed")
      }
    })

    return () => {
      clearTimeout(timeoutId)
      if (data && data.subscription) {
        data.subscription.unsubscribe()
      }
    }
  }, [router])

  // Get the correct site URL
  const getSiteUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin
    }

    // Server-side fallbacks
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    }

    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL
    }

    // Default fallback
    return "https://utilhub.vercel.app"
  }

  // GitHub OAuth login - Supabase handles the code exchange
  const loginWithGitHub = async (): Promise<void> => {
    try {
      setIsLoading(true)

      // Store the current path to redirect back after login
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname
        localStorage.setItem("redirectAfterLogin", currentPath !== "/login" ? currentPath : "/")
        console.log("Stored redirect path:", currentPath)
      }

      const siteUrl = getSiteUrl()
      console.log("Site URL:", siteUrl)

      // The redirectTo URL is where Supabase will send the user after processing the GitHub OAuth
      const redirectUrl = `${siteUrl}/auth/callback`
      console.log("Redirect URL:", redirectUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
          // Request the scopes we need
          scopes: "read:user user:email",
        },
      })

      if (error) {
        console.error("GitHub login error:", error)
        setAuthError(error)
        toast({
          title: "Login Failed",
          description: error.message || "Failed to login with GitHub",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      console.log("OAuth initiated successfully:", data)
      // User will be redirected to GitHub, then to Supabase, then back to our callback
      // Don't reset loading state here as the page will redirect
    } catch (error) {
      console.error("GitHub login unexpected error:", error)
      setAuthError(error instanceof Error ? error : new Error(String(error)))
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred during GitHub login",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Comprehensive logout function that ensures complete session termination
  const logout = async () => {
    try {
      console.log("Starting logout process...")

      // Immediately update UI state to reflect logout
      setUser(null)
      setProfile(null)
      setIsAuthenticated(false)
      setIsLoading(true)

      // Clear localStorage immediately
      if (typeof window !== "undefined") {
        console.log("Clearing localStorage...")

        // Get all keys first to avoid issues with changing storage during iteration
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (
            key &&
            (key.startsWith("sb-") ||
              key.startsWith("supabase-") ||
              key.startsWith("auth-") ||
              key.includes("auth") ||
              key.includes("token"))
          ) {
            keysToRemove.push(key)
          }
        }

        // Remove all auth-related keys
        keysToRemove.forEach((key) => {
          console.log(`Clearing localStorage item: ${key}`)
          localStorage.removeItem(key)
        })

        // Explicitly remove known items
        const knownItems = [
          "supabase.auth.token",
          "supabase.auth.refreshToken",
          "sb-access-token",
          "sb-refresh-token",
          "supabaseSession",
          "authUser",
          "sb-auth-token",
          "sb-provider-token",
          "sb-auth-event",
          "sb-auth-data",
          "redirectAfterLogin",
        ]

        knownItems.forEach((item) => {
          localStorage.removeItem(item)
        })
      }

      // Clear sessionStorage as well
      if (typeof window !== "undefined" && window.sessionStorage) {
        console.log("Clearing sessionStorage...")
        const sessionKeysToRemove: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (
            key &&
            (key.startsWith("sb-") || key.startsWith("supabase-") || key.includes("auth") || key.includes("token"))
          ) {
            sessionKeysToRemove.push(key)
          }
        }
        sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key))
      }

      // Sign out with Supabase
      try {
        console.log("Calling Supabase signOut...")
        await supabase.auth.signOut({ scope: "global" })
        console.log("Supabase signOut completed")
      } catch (supabaseError) {
        console.warn("Supabase signOut error:", supabaseError)
        // Continue with API call regardless
      }

      // Call our API endpoint to handle server-side logout
      try {
        console.log("Calling logout API endpoint...")
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          cache: "no-store",
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.warn("Logout API error:", errorData)
        } else {
          console.log("Logout API call successful")
        }
      } catch (apiError) {
        console.warn("Logout API call failed:", apiError)
        // Continue anyway
      }

      // Clear any session cookies manually as a fallback
      if (typeof document !== "undefined") {
        console.log("Clearing cookies...")
        const cookiesToClear = [
          "sb-access-token",
          "sb-refresh-token",
          "supabase-auth-token",
          "__session",
          "sb-auth-token",
          "sb-provider-token",
          "sb-auth-event",
          "sb-auth-data",
        ]

        cookiesToClear.forEach((cookieName) => {
          // Clear for current domain
          document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`
          // Clear for subdomain
          document.cookie = `${cookieName}=; Path=/; Domain=${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`
        })
      }

      // Show success message
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      })

      console.log("Logout process completed, redirecting...")

      // Force a hard reload to clear any in-memory state
      if (typeof window !== "undefined") {
        // Use replace to avoid back button issues
        window.location.replace("/")
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Logout error:", error)
      setAuthError(error instanceof Error ? error : new Error(String(error)))

      // Still ensure local state is cleared
      setUser(null)
      setProfile(null)
      setIsAuthenticated(false)

      toast({
        title: "Logout Issue",
        description: "You've been logged out, but there was an error in the process",
        variant: "destructive",
      })

      // Redirect to home page anyway
      if (typeof window !== "undefined") {
        window.location.replace("/")
      } else {
        router.push("/")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Delete account function
  const deleteAccount = async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete your account",
        variant: "destructive",
      })
      return false
    }

    try {
      setIsLoading(true)

      // First, delete user data from the database
      const { error: messagesError } = await supabase.from("messages").delete().eq("sender_id", user.id)
      if (messagesError) {
        console.error("Error deleting messages:", messagesError)
        throw new Error(messagesError.message)
      }

      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .delete()
        .eq("user_id", user.id)
      if (participantsError) {
        console.error("Error deleting conversation participants:", participantsError)
        throw new Error(participantsError.message)
      }

      const { error: profileError } = await supabase.from("profiles").delete().eq("id", user.id)
      if (profileError) {
        console.error("Error deleting profile:", profileError)
        throw new Error(profileError.message)
      }

      // Finally, delete the user account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      if (deleteError) {
        console.error("Error deleting user:", deleteError)
        throw new Error(deleteError.message)
      }

      // Sign out
      await supabase.auth.signOut()

      // Clear local state
      setUser(null)
      setProfile(null)
      setIsAuthenticated(false)

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted",
      })

      router.push("/")
      return true
    } catch (error) {
      console.error("Delete account error:", error)
      setAuthError(error instanceof Error ? error : new Error(String(error)))
      toast({
        title: "Delete Account Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Update profile function
  const updateProfile = async (data: any): Promise<boolean> => {
    if (!user) return false

    try {
      setIsLoading(true)

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: data.displayName,
          avatar_url: data.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error("Error updating profile:", error)
        setAuthError(error)
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update profile",
          variant: "destructive",
        })
        return false
      }

      // Update local user state
      setUser({
        ...user,
        name: data.displayName || user.name,
        avatarUrl: data.avatarUrl || user.avatarUrl,
      })

      // Fetch updated profile
      const { data: updatedProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (updatedProfile) {
        setProfile(updatedProfile)
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      })

      return true
    } catch (error) {
      console.error("Update profile error:", error)
      setAuthError(error instanceof Error ? error : new Error(String(error)))
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoading,
        loginWithGitHub,
        logout,
        deleteAccount,
        updateProfile,
        debugAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
