"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useMessaging } from "@/contexts/messaging-context"
import { GroupMembersDialog } from "./group-members-dialog"
import { useToast } from "@/components/ui/use-toast"
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
import type { GroupMember } from "@/lib/messaging-types"

interface GroupInfoProps {
  groupId: string
  groupName: string
  members: GroupMember[]
  isAdmin: boolean
  onClose: () => void
}

export function GroupInfo({ groupId, groupName, members, isAdmin, onClose }: GroupInfoProps) {
  const { leaveGroup } = useMessaging()
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const { toast } = useToast()

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(groupId)
      toast({
        title: "Left group",
        description: `You have left the group "${groupName}"`,
      })
      onClose()
    } catch (error) {
      console.error("Error leaving group:", error)
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{groupName}</CardTitle>
          <CardDescription>{members.length} members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Members</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/api/avatar/${member.id}`} alt={member.email || ""} />
                      <AvatarFallback>{member.email ? member.email.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.email}</span>
                  </div>
                  {member.role === "admin" && <Badge variant="outline">Admin</Badge>}
                </div>
              ))}
              {members.length > 5 && (
                <Button variant="link" className="p-0 h-auto" onClick={() => setShowMembersDialog(true)}>
                  View all members
                </Button>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="destructive" onClick={() => setShowLeaveDialog(true)}>
            Leave Group
          </Button>
        </CardFooter>
      </Card>

      {showMembersDialog && (
        <GroupMembersDialog
          groupId={groupId}
          groupName={groupName}
          isAdmin={isAdmin}
          onClose={() => setShowMembersDialog(false)}
        />
      )}

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You will no longer receive messages from this group.
              {isAdmin && members.length > 1 && (
                <p className="mt-2 text-yellow-600 dark:text-yellow-400">
                  As an admin, leaving will transfer admin rights to another member.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup}>Leave Group</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
