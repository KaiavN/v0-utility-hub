"use client"
import { ConversationList } from "@/components/messaging/conversation-list"
import { ConversationView } from "@/components/messaging/conversation-view"
import { MessagingProvider } from "@/contexts/messaging-context"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { LoginModal } from "@/components/auth/login-modal"
import { SignupModal } from "@/components/auth/signup-modal"
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal"

export default function MessagesPage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const { isAuthenticated } = useAuth()

  const handleLoginClick = () => {
    console.log("MessagesPage: Login button clicked")
    setShowLoginModal(true)
  }

  const handleSignupClick = () => {
    console.log("MessagesPage: Signup button clicked")
    setShowSignupModal(true)
  }

  const handleSwitchToSignup = () => {
    console.log("MessagesPage: Switching to signup")
    setShowLoginModal(false)
    setShowSignupModal(true)
  }

  const handleSwitchToLogin = () => {
    console.log("MessagesPage: Switching to login")
    setShowSignupModal(false)
    setShowForgotPasswordModal(false)
    setShowLoginModal(true)
  }

  const handleSwitchToForgotPassword = () => {
    console.log("MessagesPage: Switching to forgot password")
    setShowLoginModal(false)
    setShowForgotPasswordModal(true)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto p-6">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Sign in to access messages</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to view and send messages. Create an account or sign in to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleLoginClick} variant="outline" size="lg">
              Login
            </Button>
            <Button onClick={handleSignupClick} size="lg">
              Create Account
            </Button>
          </div>

          <LoginModal
            open={showLoginModal}
            onOpenChange={setShowLoginModal}
            onSwitchToSignup={handleSwitchToSignup}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
          />

          <SignupModal open={showSignupModal} onOpenChange={setShowSignupModal} onSwitchToLogin={handleSwitchToLogin} />

          <ForgotPasswordModal
            open={showForgotPasswordModal}
            onOpenChange={setShowForgotPasswordModal}
            onSwitchToLogin={handleSwitchToLogin}
          />
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
