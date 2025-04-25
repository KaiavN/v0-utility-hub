"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getData, saveData } from "@/lib/data-manager"

type UserRole = "student" | "professional"

interface UserPreferences {
  role: UserRole
}

interface UserPreferencesContextType {
  preferences: UserPreferences | null
  isLoading: boolean
  setRole: (role: UserRole) => void
  isStudent: () => boolean
  isProfessional: () => boolean
}

const defaultPreferences: UserPreferences = {
  role: "student",
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  // Initialize with null to indicate preferences haven't been loaded yet
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const savedPreferences = getData<UserPreferences>("userPreferences", defaultPreferences)
      setPreferences(savedPreferences)
    } catch (error) {
      console.error("Error loading user preferences:", error)
      // Set to default preferences if there's an error
      setPreferences(defaultPreferences)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && preferences) {
      try {
        saveData("userPreferences", preferences)
      } catch (error) {
        console.error("Error saving user preferences:", error)
      }
    }
  }, [preferences, isLoading])

  const setRole = (role: UserRole) => {
    setPreferences((prev) => (prev ? { ...prev, role } : { role }))
  }

  // Safely check role
  const isStudent = () => preferences?.role === "student"
  const isProfessional = () => preferences?.role === "professional"

  return (
    <UserPreferencesContext.Provider value={{ preferences, isLoading, setRole, isStudent, isProfessional }}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider")
  }
  return context
}
