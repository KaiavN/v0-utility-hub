"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useMessaging } from "@/contexts/messaging-context"
import { createSupabaseClient } from "@/lib/supabase-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Loader2, UserPlus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface UserSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UserResult {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string | null
}

export function UserSearchDialog({ open, onOpenChange }: UserSearchDialogProps) {
  const { user } = useAuth()
  const { createConversation, setActiveConversation } = useMessaging()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)
  const [initialMessage, setInitialMessage] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createSupabaseClient()

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery("")
      setSearchResults([])
      setSelectedUser(null)
      setInitialMessage("")
    }
  }, [open])

  // Search for users
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

      setSearchResults(data || [])
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

  // Handle user selection
  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user)
  }

  // Create a new conversation
  const handleCreateConversation = async () => {
    if (!selectedUser) return

    setIsCreating(true)
    try {
      const conversationId = await createConversation(
        selectedUser.id,
        initialMessage.trim() ? initialMessage : undefined,
      )

      if (conversationId) {
        setActiveConversation(conversationId)
        onOpenChange(false)
        toast({
          title: "Success",
          description: `Conversation with ${selectedUser.display_name || selectedUser.email || "user"} created.`,
        })
      }
    } catch (err) {
      console.error("Error creating conversation:", err)
      toast({
        title: "Error",
        description: "Failed to create conversation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!selectedUser ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
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

              {isSearching ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {searchResults.map((user) => (
                    <Button
                      key={user.id}
                      variant="outline"
                      className="w-full justify-start px-2 py-3 h-auto"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="flex items-center w-full">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={user.avatar_url || ""} alt={user.display_name || ""} />
                          <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium truncate">
                            {user.display_name || user.email || `User ${user.id.substring(0, 5)}`}
                          </div>
                          {user.display_name && user.email && (
                            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : searchQuery && !isSearching ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No users found matching "{searchQuery}"</p>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex items-center space-x-3 p-2 border rounded-md">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar_url || ""} alt={selectedUser.display_name || ""} />
                  <AvatarFallback>{getInitials(selectedUser.display_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {selectedUser.display_name || selectedUser.email || `User ${selectedUser.id.substring(0, 5)}`}
                  </div>
                  {selectedUser.display_name && selectedUser.email && (
                    <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelectedUser(null)}>
                  Change
                </Button>
              </div>

              <div className="space-y-2">
                <label htmlFor="initial-message" className="text-sm font-medium">
                  Initial message (optional)
                </label>
                <Input
                  id="initial-message"
                  placeholder="Write your first message..."
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedUser && (
            <Button onClick={handleCreateConversation} disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Start Conversation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
