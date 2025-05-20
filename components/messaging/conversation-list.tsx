"use client"

import type React from "react"

import { useState } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserSearchDialog } from "@/components/messaging/user-search-dialog"
import { CreateGroupDialog } from "@/components/messaging/create-group-dialog"
import { BlockedUsersDialog } from "@/components/messaging/blocked-users-dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Users,
  UserPlus,
  Ban,
  Trash2,
  MessageSquare,
  MessageSquarePlus,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"

export function ConversationList() {
  const { state, setActiveConversation, deleteConversation, refreshConversations } = useMessaging()
  const { user } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [blockedUsersOpen, setBlockedUsersOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshConversations()
      toast({
        title: "Refreshed",
        description: "Your conversations have been updated",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error refreshing conversations:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation(conversationId)
    }
  }

  // Filter conversations based on search query
  const filteredConversations = state.conversations.filter((conversation) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()

    if (conversation.type === "direct") {
      return conversation.participantName?.toLowerCase().includes(searchLower)
    } else {
      return conversation.name?.toLowerCase().includes(searchLower)
    }
  })

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-2">Conversations</h2>
        <div className="flex items-center gap-2 mb-3">
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh conversations"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setSearchOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setCreateGroupOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            New Group
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBlockedUsersOpen(true)} title="Blocked Users">
            <Ban className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {state.error && (
        <div className="p-4 text-sm text-red-500 flex items-center gap-2 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <span>{state.error}</span>
        </div>
      )}

      {state.isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
          {searchQuery ? (
            <>
              <Search className="h-8 w-8 mb-2 text-muted-foreground/50" />
              <p>No conversations match your search</p>
              <Button variant="link" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </>
          ) : (
            <>
              <MessageSquare className="h-12 w-12 mb-3 text-muted-foreground/50" />
              <h3 className="font-medium mb-1">No conversations yet</h3>
              <p className="text-sm mb-4">Start chatting with someone to begin a conversation</p>
              <Button onClick={() => setSearchOpen(true)}>
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Start a conversation
              </Button>
            </>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                  state.activeConversation === conversation.id ? "bg-primary/10" : "hover:bg-muted"
                }`}
                onClick={() => setActiveConversation(conversation.id)}
              >
                <Avatar>
                  {conversation.type === "group" && conversation.avatar_url ? (
                    <AvatarImage
                      src={conversation.avatar_url || "/placeholder.svg"}
                      alt={conversation.name || "Group"}
                    />
                  ) : null}
                  <AvatarFallback>
                    {conversation.type === "direct"
                      ? conversation.participantName?.charAt(0).toUpperCase() || "U"
                      : conversation.name?.charAt(0).toUpperCase() || "G"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="font-medium truncate">
                      {conversation.type === "direct" ? conversation.participantName : conversation.name}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage ? (
                      <span>{conversation.lastMessage}</span>
                    ) : (
                      <span className="italic">No messages yet</span>
                    )}
                  </div>
                  {conversation.lastMessageTimestamp && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(conversation.lastMessageTimestamp), { addSuffix: true })}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  title="Delete conversation"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <UserSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
      <BlockedUsersDialog open={blockedUsersOpen} onOpenChange={setBlockedUsersOpen} />
    </div>
  )
}
