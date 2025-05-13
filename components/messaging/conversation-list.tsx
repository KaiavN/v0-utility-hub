"use client"

import type React from "react"

import { useState } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { formatDistanceToNow } from "date-fns"
import { Search, Trash2, MoreVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { NewConversationDialog } from "./new-conversation-dialog"

interface ConversationListProps {
  onSelectConversation?: (conversationId: string) => void
}

export function ConversationList({ onSelectConversation }: ConversationListProps) {
  const { state, setActiveConversation, deleteConversation } = useMessaging()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)

  const filteredConversations = state.conversations.filter((conversation) =>
    conversation.participantName?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversation(conversationId)
    if (onSelectConversation) {
      onSelectConversation(conversationId)
    }
  }

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversationToDelete(conversationId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (conversationToDelete) {
      await deleteConversation(conversationToDelete)
      setDeleteDialogOpen(false)
      setConversationToDelete(null)
    }
  }

  const getInitials = (name: string | undefined) => {
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
      console.error("Invalid date format:", error)
      return ""
    }
  }

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <NewConversationDialog />
      </div>

      <ScrollArea className="flex-1">
        {state.isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center p-2">
                  <div className="rounded-full bg-muted h-10 w-10"></div>
                  <div className="flex-1 ml-3 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? "No conversations found" : "No conversations yet"}
            {!searchQuery && (
              <p className="mt-2 text-sm">Click "New Conversation" above to start chatting with someone.</p>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant="ghost"
                className={`w-full justify-start px-2 py-3 h-auto ${
                  state.activeConversation === conversation.id ? "bg-muted" : ""
                }`}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="flex items-center w-full">
                  <Avatar className="h-9 w-9 mr-3">
                    {conversation.participants?.[0]?.avatar_url && (
                      <AvatarImage
                        src={conversation.participants[0].avatar_url || "/placeholder.svg"}
                        alt={conversation.participantName || ""}
                      />
                    )}
                    <AvatarFallback>{getInitials(conversation.participantName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{conversation.participantName || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(conversation.lastMessageTimestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage || "No messages yet"}
                      </span>
                      {(conversation.unreadCount || 0) > 0 && (
                        <Badge variant="default" className="ml-2">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => handleDeleteConversation(conversation.id, e as React.MouseEvent)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
              Are you sure you want to delete this conversation? This action cannot be undone.
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
    </div>
  )
}
