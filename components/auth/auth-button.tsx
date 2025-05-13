"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { LogOut, User, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GitHubLoginButton } from "./github-login-button"
import { GoogleLoginButton } from "./google-login-button"
import { LogoutConfirmationDialog } from "./logout-confirmation-dialog"

export function AuthButton() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
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
          <LogoutConfirmationDialog>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </LogoutConfirmationDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex gap-2">
      <GitHubLoginButton variant="outline" size="sm" />
      <GoogleLoginButton variant="outline" size="sm" />
    </div>
  )
}
