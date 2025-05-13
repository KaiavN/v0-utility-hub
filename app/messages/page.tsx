"use client"

import { useState, useEffect } from "react"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ConversationView } from "@/components/messaging/conversation-view"
import { MessagingProvider } from "@/contexts/messaging-context"
import { MessageSquare, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { GitHubLoginButton } from "@/components/auth/github-login-button"
import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

export default function MessagesPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [showConversation, setShowConversation] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Custom handler for conversation selection on mobile
  const handleConversationSelect = (conversationId: string | null) => {
    setActiveConversationId(conversationId)
    if (isMobile && conversationId) {
      setShowConversation(true)
    }
  }

  // Go back to conversation list on mobile
  const handleBackToList = () => {
    setShowConversation(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-12 w-12 rounded-full bg-muted mx-auto"></div>
          <div className="h-4 w-48 bg-muted rounded mx-auto"></div>
          <div className="h-3 w-32 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center max-w-md mx-auto p-6">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Sign in to access messages</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to view and send messages. Sign in with your GitHub or Google account to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <GitHubLoginButton variant="outline" size="lg" />
            <GoogleLoginButton size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <MessagingProvider>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Mobile: Show either conversation list or conversation view */}
        {isMobile ? (
          <>
            {!showConversation ? (
              <div className="w-full">
                <ConversationList onSelectConversation={handleConversationSelect} />
              </div>
            ) : (
              <div className="w-full flex flex-col">
                <div className="p-2 border-b">
                  <Button variant="ghost" size="sm" onClick={handleBackToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to conversations
                  </Button>
                </div>
                <div className="flex-1">
                  <ConversationView />
                </div>
              </div>
            )}
          </>
        ) : (
          /* Desktop: Show both conversation list and conversation view */
          <>
            <div className="w-full sm:w-1/3 md:w-1/4 lg:w-1/5 border-r">
              <ConversationList onSelectConversation={handleConversationSelect} />
            </div>
            <Separator orientation="vertical" className="hidden sm:block" />
            <div className="hidden sm:block sm:flex-1">
              <ConversationView />
            </div>
          </>
        )}
      </div>
    </MessagingProvider>
  )
}
