"use client"

import { useAuth } from "@/contexts/auth-context"
import { redirect } from "next/navigation"

export default function ProfilePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    redirect("/login")
  }

  return (
    <div>
      <h1>Profile Page</h1>
      <p>Welcome, {user?.email}!</p>
    </div>
  )
}
