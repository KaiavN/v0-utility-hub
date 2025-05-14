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
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<boolean>
  profile: any | null
  updateProfile: (data: any) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Get Supabase client
  const supabase = getSupabaseClient()

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

      try {
        // Check if we have a session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
          throw sessionError
        }

        if (session) {
          // User is logged in
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
          setUser(null)
          setProfile(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Error loading user:", error)
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
      } finally {
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

  // GitHub authentication function
  const loginWithGitHub = async (): Promise<void> => {
    try {
      setIsLoading(true)

      // Store the current path to redirect back after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
      }

      const siteUrl = getSiteUrl()
      console.log("Logging in with GitHub, redirect URL:", `${siteUrl}/auth/callback`)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
          // Explicitly request the scopes we need
          scopes: "read:user user:email",
        },
      })

      if (error) {
        console.error("GitHub login error:", error)
        toast({
          title: "Login Failed",
          description: error.message || "Failed to login with GitHub",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("GitHub login unexpected error:", error)
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Update the loginWithGoogle function to check for sessionStorage availability
  const loginWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true)

      // Store the current path to redirect back after login
      // Check if window is defined first (client-side only)
      if (typeof window !== "undefined") {
        try {
          // Only access sessionStorage if we're in the browser
          sessionStorage.setItem("redirectAfterLogin", window.location.pathname)

          // Clear any previous auth errors or state
          sessionStorage.removeItem("authError")
          localStorage.removeItem("supabase.auth.token")
          localStorage.removeItem("supabase.auth.refreshToken")
        } catch (storageError) {
          console.warn("Error accessing sessionStorage:", storageError)
          // Continue anyway - storage might be disabled
        }
      }

      // Use the Supabase callback URL directly instead of our custom one
      const redirectUrl = "https://hguhugnlvlmvtrduwiyn.supabase.co/auth/v1/callback"
      console.log("Logging in with Google, redirect URL:", redirectUrl)

      // First, try to sign out to ensure a clean authentication state
      try {
        await supabase.auth.signOut({ scope: "local" })
        console.log("Signed out before Google login")
      } catch (signOutError) {
        console.warn("Error signing out before Google login:", signOutError)
        // Continue anyway
      }

      // Add a small delay to ensure signOut completes
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Use the Supabase callback URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          scopes: "email profile",
          queryParams: {
            access_type: "offline",
            prompt: "consent select_account", // Force consent screen to appear
          },
        },
      })

      if (error) {
        console.error("Google login error:", error)
        toast({
          title: "Login Failed",
          description: error.message || "Failed to login with Google",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // If we have a URL, redirect to it
      if (data?.url) {
        console.log("Redirecting to Google OAuth URL:", data.url)
        window.location.href = data.url
      } else {
        console.error("No redirect URL returned from signInWithOAuth")
        toast({
          title: "Login Failed",
          description: "Failed to initiate Google login",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Google login unexpected error:", error)
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Improved logout function
  const logout = async () => {
    try {
      setIsLoading(true)

      // Call the logout API endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Logout failed")
      }

      // Clear local state
      setUser(null)
      setProfile(null)
      setIsAuthenticated(false)

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      })

      // Redirect to home page
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
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
        loginWithGoogle,
        logout,
        deleteAccount,
        updateProfile,
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
