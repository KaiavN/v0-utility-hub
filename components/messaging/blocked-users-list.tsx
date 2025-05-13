"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useMessaging } from "@/contexts/messaging-context"

export function BlockedUsersList() {
  const { blockedUsers, unblockUser, loadBlockedUsers } = useMessaging()
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        await loadBlockedUsers()
      } catch (error) {
        console.error("Error loading blocked users:", error)
        toast({
          title: "Error",
          description: "Failed to load blocked users",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlockedUsers()
  }, [loadBlockedUsers, toast])

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId)
      toast({
        title: "User unblocked",
        description: "You can now receive messages from this user",
      })
    } catch (error) {
      console.error("Error unblocking user:", error)
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (blockedUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blocked Users</CardTitle>
          <CardDescription>You haven't blocked any users yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {blockedUsers.map((user) => (
        <Card key={user.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={`/api/avatar/${user.id}`} alt={user.email || ""} />
                  <AvatarFallback>{user.email ? user.email.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleUnblock(user.id)}>
                Unblock
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
