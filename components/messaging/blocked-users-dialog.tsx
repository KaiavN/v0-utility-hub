"use client"

import { useState, useEffect } from "react"
import { useSWRConfig } from "swr"
import { createClient } from "@/lib/supabase-client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import type { BlockedUser } from "@/lib/messaging-types"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BlockedUsersDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function BlockedUsersDialog({ isOpen, onClose }: BlockedUsersDialogProps) {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { mutate } = useSWRConfig()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchBlockedUsers()
    }
  }, [isOpen])

  const fetchBlockedUsers = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("blocked_users").select(`
          *,
          blocked_user:blocked_id(
            id,
            display_name,
            avatar_url,
            email
          )
        `)

      if (error) throw error
      setBlockedUsers(data || [])
    } catch (error) {
      console.error("Error fetching blocked users:", error)
      toast({
        title: "Error",
        description: "Failed to load blocked users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const unblockUser = async (blockedId: string) => {
    try {
      const response = await fetch("/api/messages/unblock-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ blockedId }),
      })

      if (!response.ok) {
        throw new Error("Failed to unblock user")
      }

      // Remove from local state
      setBlockedUsers((prev) => prev.filter((u) => u.blocked_id !== blockedId))

      // Refresh conversations
      mutate("/api/messages/conversations")

      toast({
        title: "User unblocked",
        description: "You have successfully unblocked this user.",
      })
    } catch (error) {
      console.error("Error unblocking user:", error)
      toast({
        title: "Error",
        description: "Failed to unblock user. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Blocked Users</DialogTitle>
          <DialogDescription>Manage the users you have blocked. Blocked users cannot message you.</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="py-4 text-center">Loading blocked users...</div>
          ) : blockedUsers.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">You haven't blocked any users.</div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {blockedUsers.map((blockedUser) => (
                  <div key={blockedUser.blocked_id} className="flex items-center justify-between p-2 rounded-md border">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={blockedUser.blocked_user?.avatar_url || ""} />
                        <AvatarFallback>
                          {blockedUser.blocked_user?.display_name?.[0] || blockedUser.blocked_user?.email?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {blockedUser.blocked_user?.display_name || blockedUser.blocked_user?.email || "Unknown user"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Blocked on {new Date(blockedUser.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => unblockUser(blockedUser.blocked_id)}>
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
