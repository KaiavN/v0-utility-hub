"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignup: () => void
  onSwitchToForgotPassword: () => void
  initialEmail?: string
  showSuccessMessage?: boolean
}

export function LoginModal({
  open,
  onOpenChange,
  onSwitchToSignup,
  onSwitchToForgotPassword,
  initialEmail = "",
  showSuccessMessage = false,
}: LoginModalProps) {
  console.log("LoginModal: Rendering with initialEmail:", initialEmail, "showSuccessMessage:", showSuccessMessage)

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const { login } = useAuth()

  // Update email when initialEmail prop changes
  useEffect(() => {
    if (initialEmail) {
      console.log("LoginModal: Updating email from initialEmail prop:", initialEmail)
      setEmail(initialEmail)
    }
  }, [initialEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("LoginModal.handleSubmit: Form submitted")
    e.preventDefault()
    setErrorMessage("")

    if (!email.trim()) {
      console.log("LoginModal.handleSubmit: Email is empty")
      setErrorMessage("Email is required")
      return
    }

    if (!password) {
      console.log("LoginModal.handleSubmit: Password is empty")
      setErrorMessage("Password is required")
      return
    }

    console.log("LoginModal.handleSubmit: Setting isLoading to true")
    setIsLoading(true)

    try {
      console.log("LoginModal.handleSubmit: Calling login function with email:", email)
      const success = await login(email, password)
      console.log("LoginModal.handleSubmit: Login result:", success)

      if (success) {
        console.log("LoginModal.handleSubmit: Login successful, closing modal")
        onOpenChange(false)
      } else {
        setErrorMessage("Invalid email or password")
      }
    } catch (error: any) {
      console.error("LoginModal.handleSubmit: Error during login:", error)

      // Provide more specific error messages based on the error
      if (error.message?.includes("Invalid login credentials")) {
        setErrorMessage("Invalid email or password")
      } else if (error.message?.includes("network")) {
        setErrorMessage("Network error. Please check your connection and try again.")
      } else {
        setErrorMessage(error.message || "An error occurred during login")
      }
    } finally {
      console.log("LoginModal.handleSubmit: Setting isLoading to false")
      setIsLoading(false)
    }
  }

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setPassword("")
      setErrorMessage("")
    }
  }, [open])

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        console.log("LoginModal: Dialog onOpenChange called with:", newOpen)
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>Enter your credentials to access your account</DialogDescription>
        </DialogHeader>

        {showSuccessMessage && (
          <Alert className="bg-green-50 border-green-200 mb-4">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <AlertDescription className="text-green-800">
              Account created successfully! Please log in with your credentials.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  console.log("LoginModal: Email input changed:", e.target.value)
                  setEmail(e.target.value)
                }}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  console.log("LoginModal: Password input changed")
                  setPassword(e.target.value)
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <Button
              type="button"
              variant="link"
              className="px-0 justify-start text-sm"
              onClick={() => {
                console.log("LoginModal: Forgot password button clicked")
                onSwitchToForgotPassword()
              }}
            >
              Forgot your password?
            </Button>
          </div>
          <DialogFooter className="flex flex-col sm:flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("LoginModal: Switch to signup button clicked")
                onSwitchToSignup()
              }}
              className="w-full"
            >
              Don't have an account? Sign up
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
