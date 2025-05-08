"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LoginModal } from "./login-modal"
import { ForgotPasswordModal } from "./forgot-password-modal"
import { useAuth } from "@/contexts/auth-context"
import { LogOut, User } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GitHubLoginButton } from "./github-login-button"

export function AuthButton() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const { user, logout } = useAuth()

  const handleSwitchToLogin = () => {
    setShowForgotPasswordModal(false)
    setShowLoginModal(true)
  }

  const handleSwitchToForgotPassword = () => {
    setShowLoginModal(false)
    setShowForgotPasswordModal(true)
  }

  const handleLogout = async () => {
    await logout()
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl || "/placeholder.svg"}
                alt={user.name || user.email}
                className="h-4 w-4 rounded-full"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            {user.name || user.email}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-500">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <div className="flex gap-2">
        <GitHubLoginButton variant="outline" size="sm" />
        <Button variant="outline" size="sm" onClick={() => setShowLoginModal(true)}>
          Login
        </Button>
      </div>

      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSwitchToForgotPassword={handleSwitchToForgotPassword}
        initialEmail={loginEmail}
      />

      <ForgotPasswordModal
        open={showForgotPasswordModal}
        onOpenChange={setShowForgotPasswordModal}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  )
}
