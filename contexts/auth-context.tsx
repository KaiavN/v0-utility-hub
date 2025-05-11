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
      }
    })

    return () => {
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
      }
    } catch (error) {
      console.error("GitHub login unexpected error:", error)
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Google authentication function
  const loginWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true)

      // Store the current path to redirect back after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
      }

      const siteUrl = getSiteUrl()
      console.log("Logging in with Google, redirect URL:", `${siteUrl}/auth/callback`)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
          // Explicitly request the scopes we need
          scopes: "email profile",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
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
      }
    } catch (error) {
      console.error("Google login unexpected error:", error)
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Simplified logout function
  const logout = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Logout error:", error)
        toast({
          title: "Logout Failed",
          description: error.message || "Failed to logout",
          variant: "destructive",
        })
        return
      }

      setUser(null)
      setProfile(null)
      setIsAuthenticated(false)
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
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
