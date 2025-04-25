"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface User {
  id: string
  name: string
  avatar?: string
  role: string
  color: string
}

export function useTeamMembers(initialUsers: User[]) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevUsersRef = useRef<User[]>(initialUsers)

  // Update users when initialUsers changes
  useEffect(() => {
    if (JSON.stringify(initialUsers) !== JSON.stringify(prevUsersRef.current)) {
      setUsers(initialUsers)
      prevUsersRef.current = initialUsers
    }
  }, [initialUsers])

  // Add a new team member
  const addTeamMember = useCallback((newUser: Omit<User, "id">) => {
    setIsLoading(true)
    setError(null)

    try {
      const newId = `user-${Date.now()}`
      const userToAdd: User = {
        id: newId,
        ...newUser,
      }

      setUsers((prev) => [...prev, userToAdd])
      return userToAdd
    } catch (err) {
      setError("Failed to add team member")
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update an existing team member
  const updateTeamMember = useCallback((userId: string, updates: Partial<Omit<User, "id">>) => {
    setIsLoading(true)
    setError(null)

    try {
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...updates } : user)))
    } catch (err) {
      setError("Failed to update team member")
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Remove a team member
  const removeTeamMember = useCallback((userId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      setUsers((prev) => prev.filter((user) => user.id !== userId))
    } catch (err) {
      setError("Failed to remove team member")
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Batch update team members
  const batchUpdateTeamMembers = useCallback((updatedUsers: User[]) => {
    setIsLoading(true)
    setError(null)

    try {
      setUsers(updatedUsers)
    } catch (err) {
      setError("Failed to update team members")
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    users,
    isLoading,
    error,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    batchUpdateTeamMembers,
  }
}
