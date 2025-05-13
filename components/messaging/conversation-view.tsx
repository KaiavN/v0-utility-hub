"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { useAuth } from "@/contexts/auth-context"
import { MessageItem } from "./message-item"
import { MessageComposer } from "./message-composer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, MessageSquare } from "lucide-react"

export function ConversationView() {
  const { state } = useMessaging()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  const { activeConversation, messages, isLoading } = state
  const conversation = state.conversations.find((c) => c.id === activeConversation)
  const conversationMessages = activeConversation && messages[activeConversation] ? messages[activeConversation] : []

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversationMessages, autoScroll])

  // Handle scroll events to determine if auto-scroll should be enabled
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    // If user is scrolled near the bottom, enable auto-scroll
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setAutoScroll(isNearBottom)
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

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    )
  }

  if (!activeConversation || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
        <div>
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
          <p>Choose a conversation from the list or start a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b">
        <Avatar className="h-10 w-10 mr-3">
          {conversation.participants?.[0]?.avatar_url && (
            <AvatarImage
              src={conversation.participants[0].avatar_url || "/placeholder.svg"}
              alt={conversation.participantName || ""}
            />
          )}
          <AvatarFallback>{getInitials(conversation.participantName)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{conversation.participantName || "Unknown"}</h3>
          {conversation.participants?.[0]?.email && (
            <p className="text-sm text-muted-foreground">{conversation.participants[0].email}</p>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" onScroll={handleScroll}>
        <div className="space-y-4">
          {conversationMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
          ) : (
            conversationMessages.map((message) => (
              <MessageItem key={message.id} message={message} isCurrentUser={message.sender_id === user?.id} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <MessageComposer recipientId={conversation.participantId} />
    </div>
  )
}
