"use client"

import { useState } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { createSupabaseClient } from "@/lib/supabase-client"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Search, UserPlus, X } from "lucide-react"
import type { Profile } from "@/lib/messaging-types"

export function NewConversationDialog() {
  const { createConversation } = useMessaging()
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createSupabaseClient()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [initialMessage, setInitialMessage] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      toast({
        title: "Search query too short",
        description: "Please enter at least 3 characters to search",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setSearchResults([])

    try {
      // Search for users by email, username, or display name
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, username, avatar_url")
        .or(`email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .neq("id", user?.id || "") // Exclude current user
        .limit(10)

      if (error) {
        console.error("Error searching users:", error)
        toast({
          title: "Search failed",
          description: "Failed to search for users. Please try again.",
          variant: "destructive",
        })
        return
      }

      setSearchResults(data || [])
    } catch (error) {
      console.error("Unexpected error during search:", error)
      toast({
        title: "Search failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectUser = (profile: Profile) => {
    setSelectedUser(profile)
    setSearchResults([])
    setSearchQuery("")
  }

  const handleCreateConversation = async () => {
    if (!selectedUser) {
      toast({
        title: "No user selected",
        description: "Please select a user to start a conversation with",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const conversationId = await createConversation(selectedUser.id, initialMessage)

      if (conversationId) {
        toast({
          title: "Conversation created",
          description: `Started a conversation with ${selectedUser.display_name || selectedUser.username || selectedUser.email}`,
        })
        setOpen(false)
        resetForm()
      } else {
        toast({
          title: "Failed to create conversation",
          description: "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast({
        title: "Failed to create conversation",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setSelectedUser(null)
    setInitialMessage("")
    setSearchQuery("")
    setSearchResults([])
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>Search for a user to start a conversation with.</DialogDescription>
        </DialogHeader>

        {!selectedUser ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="user-search" className="sr-only">
                  Search
                </Label>
                <Input
                  id="user-search"
                  placeholder="Search by name, username, or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="sr-only">Search</span>
              </Button>
            </div>

            {isSearching ? (
              <div className="py-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((profile) => (
                  <Button
                    key={profile.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSelectUser(profile)}
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      {profile.avatar_url && (
                        <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.display_name || ""} />
                      )}
                      <AvatarFallback>
                        {getInitials(profile.display_name || profile.username || profile.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">{profile.display_name || profile.username || "Unknown User"}</div>
                      {profile.email && <div className="text-xs text-muted-foreground">{profile.email}</div>}
                    </div>
                  </Button>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="py-4 text-center text-muted-foreground">No users found</div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  {selectedUser.avatar_url && (
                    <AvatarImage
                      src={selectedUser.avatar_url || "/placeholder.svg"}
                      alt={selectedUser.display_name || ""}
                    />
                  )}
                  <AvatarFallback>
                    {getInitials(selectedUser.display_name || selectedUser.username || selectedUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {selectedUser.display_name || selectedUser.username || "Unknown User"}
                  </div>
                  {selectedUser.email && <div className="text-sm text-muted-foreground">{selectedUser.email}</div>}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Change user</span>
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Initial message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Write your first message..."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {selectedUser && (
            <Button onClick={handleCreateConversation} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Start Conversation"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
