"use client"

import { useAuth } from "@/contexts/auth-context"

const SettingsPage = () => {
  const { user, signOut } = useAuth()

  if (!user) {
    return <div>Not authenticated.</div>
  }

  return (
    <div>
      <h1>Settings</h1>
      <p>Welcome, {user.email}!</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

export default SettingsPage
