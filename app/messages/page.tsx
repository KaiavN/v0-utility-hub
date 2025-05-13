"use client"

import { useEffect } from "react"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ConversationView } from "@/components/messaging/conversation-view"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useMessaging } from "@/contexts/messaging-context"

export default function MessagesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { state } = useMessaging()
  const router = useRouter()

  // Skip loading state entirely - render the UI immediately
  // This will help us identify if the issue is with the loading state logic

  // If not authenticated and not loading, redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router])

  // If not authenticated and still loading, show minimal loading indicator
  if (!isAuthenticated && authLoading) {
    return (
      <div className="container mx-auto p-4">
        <p>Checking authentication...</p>
      </div>
    )
  }

  // If not authenticated and not loading, don't render anything (will redirect)
  if (!isAuthenticated && !authLoading) {
    return null
  }

  // Otherwise, render the messages UI immediately
  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Communicate with other users</p>
          {/* Debug info */}
          <div className="text-xs text-muted-foreground mt-1">
            Auth: {isAuthenticated ? "Yes" : "No"} | Loading: {state.isLoading ? "Yes" : "No"} | Error:{" "}
            {state.error || "None"}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden border rounded-lg shadow-sm">
          <div className="w-full md:w-1/3 lg:w-1/4 h-full md:block">
            <ConversationList />
          </div>
          <div className="hidden md:block md:w-2/3 lg:w-3/4 h-full">
            <ConversationView />
          </div>
        </div>
      </div>
    </div>
  )
}
