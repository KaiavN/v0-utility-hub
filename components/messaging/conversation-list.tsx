"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { formatDistanceToNow } from "date-fns"
import { Search, Plus, Trash2, AlertCircle, Users, Ban } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { UserSearchDialog } from "./user-search-dialog"
import { CreateGroupDialog } from "./create-group-dialog"
import { BlockedUsersDialog } from "./blocked-users-dialog"

export function ConversationList() {
  const { state, setActiveConversation, deleteConversation, refreshConversations } = useMessaging()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [blockedUsersOpen, setBlockedUsersOpen] = useState(false)
  const [showNewMenu, setShowNewMenu] = useState(false)

  const filteredConversations = useMemo(() => {
    return state.conversations.filter((conversation) => {
      if (conversation.type === "direct") {
        return conversation.participantName?.toLowerCase().includes(searchQuery.toLowerCase())
      } else {
        // group chat
        return conversation.name?.toLowerCase().includes(searchQuery.toLowerCase())
      }
    })
  }, [state.conversations, searchQuery])

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversation(conversationId)
  }

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    setConversationToDelete(conversationId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (conversationToDelete) {
      const success = await deleteConversation(conversationToDelete)
      if (success) {
        setDeleteDialogOpen(false)
        setConversationToDelete(null)
        await refreshConversations()
      }
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return ""
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      console.error("Invalid date format:", timestamp)
      return ""
    }
  }

  if (state.error) {
    return (
      <div className="flex flex-col h-full border-r">
        <div className="p-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h3 className="font-medium mb-1">Error Loading Conversations</h3>
          <p className="text-sm text-muted-foreground mb-4">{state.error}</p>
          <Button onClick={() => refreshConversations()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <DropdownMenu open={showNewMenu} onOpenChange={setShowNewMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  setUserSearchOpen(true)
                  setShowNewMenu(false)
                }}
              >
                New Conversation
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setCreateGroupOpen(true)
                  setShowNewMenu(false)
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                New Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setBlockedUsersOpen(true)} title="Blocked Users">
            <Ban className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {state.isLoading && filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? "No conversations match your search" : "No conversations yet"}
            {!searchQuery && <p className="text-sm mt-1">Start a new conversation using the button above</p>}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant="ghost"
                className={`w-full justify-start px-2 py-3 h-auto group ${
                  state.activeConversation === conversation.id ? "bg-muted" : ""
                }`}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="flex items-center w-full">
                  <Avatar className="h-9 w-9 mr-3">
                    {conversation.type === "direct" ? (
                      <>
                        <AvatarImage
                          src={`/api/avatar/${conversation.participantId}`}
                          alt={conversation.participantName}
                        />
                        <AvatarFallback>{getInitials(conversation.participantName || "")}</AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src={conversation.avatar_url || ""} alt={conversation.name || "Group"} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Users className="h-5 w-5" />
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">
                        {conversation.type === "direct"
                          ? conversation.participantName || "Unknown"
                          : conversation.name || "Group Chat"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(conversation.lastMessageTimestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage || "No messages yet"}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    onClick={(e) => handleDeleteClick(e, conversation.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Delete conversation</span>
                  </Button>
                </div>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserSearchDialog open={userSearchOpen} onOpenChange={setUserSearchOpen} />
      <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
      <BlockedUsersDialog open={blockedUsersOpen} onOpenChange={setBlockedUsersOpen} />
    </div>
  )
}
