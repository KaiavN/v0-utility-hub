"use client"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ConversationView } from "@/components/messaging/conversation-view"
import { MessagingProvider } from "@/contexts/messaging-context"
import { MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { GitHubLoginButton } from "@/components/auth/github-login-button"
import { GoogleLoginButton } from "@/components/auth/google-login-button"

export default function MessagesPage() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
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
        <div className="w-1/3 max-w-xs border-r">
          <ConversationList />
        </div>
        <div className="flex-1">
          <ConversationView />
        </div>
      </div>
    </MessagingProvider>
  )
}
