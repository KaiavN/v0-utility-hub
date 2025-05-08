"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

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

// Create a direct Supabase client
const createDirectSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseAnonKey)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Create a fresh client for each render
  const supabase = createDirectSupabaseClient()

  // Load user data on initial mount
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true)

      try {
        // Check if we have a session
        const {
          data: { session },
        } = await supabase.auth.getSession()

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

          // Fetch user profile
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          if (profileData) {
            setProfile(profileData)
          }
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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

        // Fetch user profile
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

        if (profileData) {
          setProfile(profileData)
        }
      } else if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        // User signed out
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // GitHub authentication function
  const loginWithGitHub = async (): Promise<void> => {
    try {
      setIsLoading(true)

      // Store the current path to redirect back after login
      if (typeof window !== "undefined") {
        sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
      await supabase.auth.signOut()
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
          username: data.username,
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
