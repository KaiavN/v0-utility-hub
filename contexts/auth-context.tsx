"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { toast } from "@/components/ui/use-toast"

type User = {
  username: string
  id: string
}

type StoredUser = {
  username: string
  passwordHash: string
  id: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  signup: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Simple hash function for passwords
// In a production app, you would use bcrypt or similar
function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Add salt based on password length and first character
  const salt = password.length * password.charCodeAt(0)
  return Math.abs(hash * salt).toString(16)
}

// Constants for storage
const USER_STORAGE_KEY = "utility-hub-user"
const USERS_STORAGE_KEY = "utility-hub-users"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load user data from localStorage on initial mount
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser) as User
        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Failed to parse stored user data:", error)
        localStorage.removeItem(USER_STORAGE_KEY)
        toast({
          title: "Session Error",
          description: "Your session was invalid and has been reset",
          variant: "destructive",
        })
      }
    }
  }, [])

  // User storage functions
  const getUsersFromStorage = (): Record<string, StoredUser> => {
    const users = localStorage.getItem(USERS_STORAGE_KEY)
    return users ? JSON.parse(users) : {}
  }

  const saveUsersToStorage = (users: Record<string, StoredUser>) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  }

  const validateUsername = (username: string): boolean => {
    return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)
  }

  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    // Validate inputs
    if (!validateUsername(username)) {
      toast({
        title: "Invalid Username",
        description: "Username must be 3-20 characters and contain only letters, numbers, and underscores",
        variant: "destructive",
      })
      return false
    }

    if (!validatePassword(password)) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return false
    }

    const users = getUsersFromStorage()
    const storedUser = users[username.toLowerCase()]

    if (storedUser && storedUser.passwordHash === hashPassword(password)) {
      const userData: User = {
        username: storedUser.username,
        id: storedUser.id,
      }

      setUser(userData)
      setIsAuthenticated(true)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
      return true
    }

    return false
  }

  const signup = async (username: string, password: string): Promise<boolean> => {
    // Validate inputs
    if (!validateUsername(username)) {
      toast({
        title: "Invalid Username",
        description: "Username must be 3-20 characters and contain only letters, numbers, and underscores",
        variant: "destructive",
      })
      return false
    }

    if (!validatePassword(password)) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return false
    }

    const users = getUsersFromStorage()
    const lowerUsername = username.toLowerCase()

    if (users[lowerUsername]) {
      return false // Username already exists
    }

    // Generate unique ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Save new user with hashed password
    users[lowerUsername] = {
      username: username, // Preserve original case for display
      passwordHash: hashPassword(password),
      id: userId,
      createdAt: new Date().toISOString(),
    }

    saveUsersToStorage(users)

    // Auto login
    const userData: User = {
      username: username,
      id: userId,
    }

    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))

    return true
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem(USER_STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
