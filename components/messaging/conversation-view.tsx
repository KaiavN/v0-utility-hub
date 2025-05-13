"use client"

import { useEffect, useRef, useState } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { useAuth } from "@/contexts/auth-context"
import { MessageItem } from "./message-item"
import { MessageComposer } from "./message-composer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ConversationView() {
  const { state, setActiveConversation, deleteConversation } = useMessaging()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showBackButton, setShowBackButton] = useState(false)

  const { activeConversation } = state
  const conversation = activeConversation ? state.conversations.find((c) => c.id === activeConversation) : null
  const conversationMessages =
    activeConversation && state.messages[activeConversation] ? state.messages[activeConversation] : []

  // Handle responsive back button
  useEffect(() => {
    const handleResize = () => {
      setShowBackButton(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversationMessages])

  const handleDeleteConversation = async () => {
    if (!activeConversation) return

    const success = await deleteConversation(activeConversation)
    if (success) {
      setActiveConversation(null)
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

  if (!activeConversation || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
        <div>
          <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
          <p>Choose a conversation from the list or start a new one</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          {showBackButton && (
            <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={() => setActiveConversation(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={`/api/avatar/${conversation.participantId}`} alt={conversation.participantName} />
            <AvatarFallback>{getInitials(conversation.participantName || "")}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{conversation.participantName || "Unknown"}</h3>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDeleteConversation}>
              Delete Conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {state.isLoading && conversationMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Loading messages...</div>
          ) : conversationMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
          ) : (
            conversationMessages.map((message) => (
              <MessageItem key={message.id} message={message} isOwnMessage={message.sender_id === user?.id} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <MessageComposer conversationId={activeConversation} />
    </div>
  )
}
