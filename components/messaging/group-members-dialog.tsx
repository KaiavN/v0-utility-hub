"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useMessaging } from "@/contexts/messaging-context"
import { createSupabaseClient } from "@/lib/supabase-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, UserPlus, Shield, MoreHorizontal, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import type { ConversationMember } from "@/lib/messaging-types"

interface GroupMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
}

interface UserSearchResult {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string | null
}

export function GroupMembersDialog({ open, onOpenChange, conversationId }: GroupMembersDialogProps) {
  const { user } = useAuth()
  const { getGroupMembers, addGroupMember, removeGroupMember, isGroupAdmin, leaveGroup, blockedUsers } = useMessaging()
  const [members, setMembers] = useState<ConversationMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [userToRemove, setUserToRemove] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const supabase = createSupabaseClient()

  const isAdmin = isGroupAdmin(conversationId)

  // Fetch members when the dialog opens
  useEffect(() => {
    if (open && conversationId) {
      fetchMembers()
    }
  }, [open, conversationId])

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const groupMembers = await getGroupMembers(conversationId)
      setMembers(groupMembers)
    } catch (error) {
      console.error("Error fetching group members:", error)
      toast({
        title: "Error",
        description: "Failed to load group members. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Search for users to add to the group
  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return

    setIsSearching(true)
    try {
      // Search by display name or email
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email")
        .or(`display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .neq("id", user.id) // Exclude current user
        .limit(10)

      if (error) {
        console.error("Error searching users:", error)
        toast({
          title: "Error",
          description: "Failed to search for users. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Filter out existing members and blocked users
      const filteredResults = (data || []).filter(
        (user) => !members.some((member) => member.user_id === user.id) && !blockedUsers.includes(user.id),
      )

      setSearchResults(filteredResults)
    } catch (err) {
      console.error("Unexpected error searching users:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Add a user to the group
  const handleAddMember = async (userId: string) => {
    try {
      const success = await addGroupMember(conversationId, userId)
      if (success) {
        setSearchResults(searchResults.filter((user) => user.id !== userId))
        fetchMembers()
        setSearchQuery("")
        toast({
          title: "Success",
          description: "Member added to the group",
        })
      }
    } catch (error) {
      console.error("Error adding member:", error)
      toast({
        title: "Error",
        description: "Failed to add member to the group.",
        variant: "destructive",
      })
    }
  }

  // Remove a user from the group
  const handleRemoveMember = async () => {
    if (!userToRemove) return

    try {
      const success = await removeGroupMember(conversationId, userToRemove)
      if (success) {
        setMembers(members.filter((member) => member.user_id !== userToRemove))
        toast({
          title: "Success",
          description: "Member removed from the group",
        })
      }
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Error",
        description: "Failed to remove member from the group.",
        variant: "destructive",
      })
    } finally {
      setUserToRemove(null)
      setShowRemoveDialog(false)
    }
  }

  // Leave the group
  const handleLeaveGroup = async () => {
    try {
      if (!user) return

      const success = await leaveGroup(conversationId)
      if (success) {
        onOpenChange(false)
        toast({
          title: "Success",
          description: "You have left the group",
        })
      }
    } catch (error) {
      console.error("Error leaving group:", error)
      toast({
        title: "Error",
        description: "Failed to leave the group.",
        variant: "destructive",
      })
    } finally {
      setShowLeaveDialog(false)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const confirmRemoveMember = (userId: string) => {
    setUserToRemove(userId)
    setShowRemoveDialog(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Members</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isAdmin && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Add members by name or email..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium mb-2">Search Results</h4>
                    <div className="space-y-2">
                      {searchResults.map((result) => (
                        <div key={result.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={result.avatar_url || ""} alt={result.display_name || ""} />
                              <AvatarFallback>{getInitials(result.display_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {result.display_name || result.email || `User ${result.id.substring(0, 5)}`}
                              </div>
                              {result.display_name && result.email && (
                                <div className="text-xs text-muted-foreground">{result.email}</div>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleAddMember(result.id)}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="border rounded-md p-3">
              <h4 className="text-sm font-medium mb-2">Members ({members.length})</h4>
              {isLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading members...</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between py-1">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage
                              src={member.profile?.avatar_url || ""}
                              alt={member.profile?.display_name || ""}
                            />
                            <AvatarFallback>{getInitials(member.profile?.display_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center">
                              {member.profile?.display_name ||
                                member.profile?.email ||
                                `User ${member.user_id.substring(0, 5)}`}
                              {member.role === "admin" && <Shield className="h-3 w-3 ml-1 text-primary" />}
                              {member.user_id === user?.id && (
                                <span className="text-xs text-muted-foreground ml-2">(You)</span>
                              )}
                            </div>
                            {member.profile?.display_name && member.profile?.email && (
                              <div className="text-xs text-muted-foreground">{member.profile.email}</div>
                            )}
                          </div>
                        </div>

                        {/* Show admin actions for other members */}
                        {isAdmin && member.user_id !== user?.id && (
                          <Button size="icon" variant="ghost" onClick={() => confirmRemoveMember(member.user_id)}>
                            <X className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Remove member</span>
                          </Button>
                        )}

                        {/* Show more options for yourself */}
                        {member.user_id === user?.id && !isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setShowLeaveDialog(true)} className="text-destructive">
                                Leave Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter>
            {isAdmin ? (
              <Button variant="outline" onClick={() => setShowLeaveDialog(true)} className="mr-auto">
                Leave Group
              </Button>
            ) : null}
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm remove member dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the group? They will no longer be able to see or send
              messages in this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm leave group dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You will no longer be able to see or send messages in this
              group.
              {isAdmin && members.filter((m) => m.role === "admin").length <= 1 && (
                <p className="mt-2 text-destructive">
                  You are the only admin. If you leave, someone else will need to be promoted to admin.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
