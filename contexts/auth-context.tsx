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
      console.log("Auth state changed:", event)

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

        // Redirect to the stored path or home
        const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/"
        sessionStorage.removeItem("redirectAfterLogin")
        router.push(redirectPath)
      } else if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        // User signed out
        console.log("User signed out event received")
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
        setIsLoading(false)
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
    // Fallback to window.location.origin in the browser
    if (typeof window !== "undefined") {
      return window.location.origin
    }

    // Default fallback (should not reach here in normal circumstances)
    return "https://utilhub.vercel.app"
  }

  // Update the loginWithGitHub function to handle the OAuth flow correctly
  const loginWithGitHub = async (): Promise<void> => {
    try {
      setIsLoading(true)

      // Store the current path to redirect back after login
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname
        localStorage.setItem("redirectAfterLogin", currentPath !== "/login" ? currentPath : "/")

        // Clear any previous auth state to ensure a clean login
        localStorage.removeItem("authError")
      }

      const siteUrl = getSiteUrl()
      console.log("Logging in with GitHub, redirect URL:", `${siteUrl}/auth/callback`)

      // First, try to sign out to ensure a clean authentication state
      try {
        await supabase.auth.signOut({ scope: "local" })
        console.log("Signed out before GitHub login")
      } catch (signOutError) {
        console.warn("Error signing out before GitHub login:", signOutError)
        // Continue anyway
      }

      // Add a small delay to ensure signOut completes
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Use a consistent and absolute URL for redirectTo
      const redirectUrl = new URL("/auth/callback", siteUrl).toString()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
          // Explicitly request the scopes we need
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
      }
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
      setIsLoading(true)
      console.log("Starting logout process...")

      // Immediately update UI state to reflect logout
      // This ensures the UI shows logged out state even if API calls take time
      setUser(null)
      setProfile(null)
      setIsAuthenticated(false)

      // Clear all auth-related items from localStorage
      if (typeof window !== "undefined") {
        // Clear specific Supabase items
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
        ]

        knownItems.forEach((item) => {
          localStorage.removeItem(item)
        })
      }

      // Try to sign out with Supabase directly first
      try {
        console.log("Calling Supabase signOut...")
        await supabase.auth.signOut({ scope: "global" })
        console.log("Supabase signOut completed")
      } catch (supabaseError) {
        console.warn("Supabase signOut error:", supabaseError)
        // Continue with API call regardless
      }

      // Call our API endpoint to handle server-side logout
      console.log("Calling logout API endpoint...")
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add cache control headers
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        // Prevent caching
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.warn("Logout API error:", errorData)
        // Continue anyway - we've already cleared client-side state
      } else {
        console.log("Logout API call successful")
      }

      // Clear any session cookies manually as a fallback
      if (typeof document !== "undefined") {
        const cookiesToClear = [
          "sb-access-token",
          "sb-refresh-token",
          "supabase-auth-token",
          "__session",
          "sb-auth-token",
        ]

        cookiesToClear.forEach((cookieName) => {
          document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`
        })

        // Also try to clear any cookies without knowing their exact names
        document.cookie.split(";").forEach((cookie) => {
          const [name] = cookie.trim().split("=")
          if (name && (name.includes("sb-") || name.includes("auth") || name.includes("token"))) {
            document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;`
          }
        })
      }

      // Show success message
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      })

      // Force a hard reload to clear any in-memory state
      // This is the most reliable way to ensure complete logout
      if (typeof window !== "undefined") {
        console.log("Redirecting to home page...")
        window.location.href = "/"
        return // Stop execution here as we're reloading the page
      } else {
        // Fallback if window is not available
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
        window.location.href = "/"
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
      // 1. Delete messages
      const { error: messagesError } = await supabase.from("messages").delete().eq("sender_id", user.id)

      if (messagesError) {
        console.error("Error deleting messages:", messagesError)
        throw new Error(messagesError.message)
      }

      // 2. Delete conversation participants
      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .delete()
        .eq("user_id", user.id)

      if (participantsError) {
        console.error("Error deleting conversation participants:", participantsError)
        throw new Error(participantsError.message)
      }

      // 3. Delete profile
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

      // Redirect to home page
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
