"use client"

import { useEffect, useState } from "react"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ConversationView } from "@/components/messaging/conversation-view"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useMessaging } from "@/contexts/messaging-context"

export default function MessagesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { state } = useMessaging()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/")
      } else {
        // Give a small delay to ensure everything is loaded
        const timer = setTimeout(() => {
          setIsReady(true)
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [isAuthenticated, authLoading, router])

  // Show loading state while authentication is being checked or initial delay
  if (authLoading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render anything (will redirect in useEffect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Communicate with other users</p>
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
