"use client"

import { useEffect, useState } from "react"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ConversationView } from "@/components/messaging/conversation-view"
import { MobileMessagingView } from "@/components/messaging/mobile-messaging-view"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { MessagingProvider } from "@/contexts/messaging-context"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import Link from "next/link"

export default function MessagesPage() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [pageLoading, setPageLoading] = useState(true)
  const [authTimeout, setAuthTimeout] = useState(false)

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

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Auth loading timeout reached on messages page")
        setAuthTimeout(true)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timeoutId)
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking auth
  if ((isLoading && !authTimeout) || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
          {authTimeout && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Taking longer than expected...</p>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Return Home
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // If auth timed out, show a message with a link to go home
  if (authTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Timeout</h2>
          <p className="text-muted-foreground mb-4">
            We're having trouble verifying your authentication status. Please try again later.
          </p>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render anything (will redirect in useEffect)
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to access messages.</p>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <MessagingProvider>
      <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
        <div className="flex flex-col h-full">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-muted-foreground">Communicate with other users</p>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
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
