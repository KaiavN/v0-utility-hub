"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import { useTeamMembers } from "./use-team-members"

interface User {
  id: string
  name: string
  avatar?: string
  role: string
  color: string
}

interface TeamMembersContextType {
  users: User[]
  isLoading: boolean
  error: string | null
  addTeamMember: (newUser: Omit<User, "id">) => User
  updateTeamMember: (userId: string, updates: Partial<Omit<User, "id">>) => void
  removeTeamMember: (userId: string) => void
  batchUpdateTeamMembers: (updatedUsers: User[]) => void
}

const TeamMembersContext = createContext<TeamMembersContextType | undefined>(undefined)

export function useTeamMembersContext() {
  const context = useContext(TeamMembersContext)
  if (context === undefined) {
    throw new Error("useTeamMembersContext must be used within a TeamMembersProvider")
  }
  return context
}

interface TeamMembersProviderProps {
  initialUsers: User[]
  onUsersChange?: (users: User[]) => void
  children: React.ReactNode
}

export function TeamMembersProvider({ initialUsers, onUsersChange, children }: TeamMembersProviderProps) {
  const { users, isLoading, error, addTeamMember, updateTeamMember, removeTeamMember, batchUpdateTeamMembers } =
    useTeamMembers(initialUsers)

  // Call onUsersChange when users change
  useEffect(() => {
    if (onUsersChange) {
      onUsersChange(users)
    }
  }, [users, onUsersChange])

  const value = {
    users,
    isLoading,
    error,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    batchUpdateTeamMembers,
  }

  return <TeamMembersContext.Provider value={value}>{children}</TeamMembersContext.Provider>
}
