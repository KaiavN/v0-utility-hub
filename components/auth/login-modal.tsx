"use client"

import type React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { signIn } from "next-auth/react"
import { OAuthTroubleshooter } from "./oauth-troubleshooter"

interface LoginModalProps {
  children: React.ReactNode
}

export function LoginModal({ children }: LoginModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [showTroubleshooter, setShowTroubleshooter] = useState(false)

  const signInWithGoogle = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl })
    } catch (error: any) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>Choose your preferred login method.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Button variant={"outline"} className="w-full" onClick={signInWithGoogle} disabled={isLoading}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              <>
                <Icons.google className="mr-2 h-4 w-4" />
                Google
              </>
            )}
          </Button>
        </div>
        <div className="mt-4 pt-4 border-t text-center">
          <button
            type="button"
            onClick={() => setShowTroubleshooter(!showTroubleshooter)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {showTroubleshooter ? "Hide troubleshooter" : "Having trouble logging in?"}
          </button>

          {showTroubleshooter && (
            <div className="mt-4">
              <OAuthTroubleshooter />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
