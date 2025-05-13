"use client"

import { useState } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface BlockUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
}

export function BlockUserDialog({ open, onOpenChange, userId, userName }: BlockUserDialogProps) {
  const { blockUser } = useMessaging()
  const [isBlocking, setIsBlocking] = useState(false)

  const handleBlockUser = async () => {
    setIsBlocking(true)
    try {
      const success = await blockUser(userId)
      if (success) {
        toast({
          title: "User Blocked",
          description: `You have blocked ${userName}. They can no longer message you.`,
        })
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error blocking user:", error)
      toast({
        title: "Error",
        description: "Failed to block user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBlocking(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to block {userName}? They won't be able to message you, and you won't see their
            messages. You can unblock them later from your settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBlockUser}
            disabled={isBlocking}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isBlocking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Blocking...
              </>
            ) : (
              "Block User"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
