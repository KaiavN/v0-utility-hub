"use client"

import { useEffect, useState } from "react"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ConversationView } from "@/components/messaging/conversation-view"
import { MobileMessagingView } from "@/components/messaging/mobile-messaging-view"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { MessagingProvider } from "@/contexts/messaging-context"

export default function MessagesPage() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    if (!isLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting from messages page")
      router.push("/")
    }

    // Set page as loaded once auth state is determined
    if (!isLoading) {
      setPageLoading(false)
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking auth
  if (isLoading || pageLoading) {
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
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <MessagingProvider>
      <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Communicate with other users</p>
          </div>

          {/* Mobile View */}
          <div className="md:hidden flex-1 overflow-hidden border rounded-lg shadow-sm">
            <MobileMessagingView />
          </div>

          {/* Desktop View */}
          <div className="hidden md:flex flex-1 overflow-hidden border rounded-lg shadow-sm">
            <div className="w-1/3 lg:w-1/4 h-full">
              <ConversationList />
            </div>
            <div className="w-2/3 lg:w-3/4 h-full">
              <ConversationView />
            </div>
          </div>
        </div>
      </div>
    </MessagingProvider>
  )
}
