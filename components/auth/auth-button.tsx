"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LoginModal } from "./login-modal"
import { SignupModal } from "./signup-modal"
import { useAuth } from "@/contexts/auth-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"

export function AuthButton() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()

  const handleLoginClick = () => {
    setShowLoginModal(true)
    setShowSignupModal(false)
  }

  const handleSignupClick = () => {
    setShowSignupModal(true)
    setShowLoginModal(false)
  }

  const handleLogout = () => {
    logout()
  }

  if (isAuthenticated && user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{user.username}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    )
  }

  return (
    <>
      <Button variant="ghost" onClick={handleLoginClick}>
        Login / Signup
      </Button>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} onSwitchToSignup={handleSignupClick} />

      <SignupModal open={showSignupModal} onOpenChange={setShowSignupModal} onSwitchToLogin={handleLoginClick} />
    </>
  )
}
