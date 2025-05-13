"use client"

import { useState } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function ConversationList() {
  const { state, setActiveConversation, createConversation } = useMessaging()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newRecipientId, setNewRecipientId] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Force render empty state instead of loading
  const isLoading = false // Override loading state
  const { conversations } = state

  const filteredConversations = conversations.filter((conversation) =>
    conversation.participantName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreateConversation = async () => {
    if (!newRecipientId) return

    setIsCreating(true)
    try {
      const conversationId = await createConversation(newRecipientId, newMessage)
      if (conversationId) {
        setActiveConversation(conversationId)
        setIsCreateDialogOpen(false)
        setNewRecipientId("")
        setNewMessage("")
      }
    } finally {
      setIsCreating(false)
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

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline">
                <Plus className="h-4 w-4" />
                <span className="sr-only">New conversation</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label htmlFor="recipient" className="text-sm font-medium">
                    Recipient ID
                  </label>
                  <Input
                    id="recipient"
                    placeholder="Enter user ID"
                    value={newRecipientId}
                    onChange={(e) => setNewRecipientId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message (optional)
                  </label>
                  <Input
                    id="message"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleCreateConversation} disabled={!newRecipientId || isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Start Conversation"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>No conversations yet</p>
            <p className="text-sm">Start a new conversation by clicking the + button</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                className={cn(
                  "flex items-center gap-3 w-full p-2 rounded-md hover:bg-accent text-left",
                  state.activeConversation === conversation.id && "bg-accent",
                )}
                onClick={() => setActiveConversation(conversation.id)}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={`/api/avatar/${conversation.participantId}`} alt={conversation.participantName} />
                  <AvatarFallback>{getInitials(conversation.participantName || "")}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{conversation.participantName || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{conversation.lastMessageTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</span>
                    {conversation.unreadCount > 0 && (
                      <span className="flex-shrink-0 h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
