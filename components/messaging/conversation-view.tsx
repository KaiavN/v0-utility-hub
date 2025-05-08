"use client"

import { useEffect, useRef } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { useAuth } from "@/contexts/auth-context"
import { MessageItem } from "./message-item"
import { MessageComposer } from "./message-composer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function ConversationView() {
  const { state } = useMessaging()
  const { activeConversation, messages } = state
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conversation = state.conversations.find((c) => c.id === activeConversation)
  const conversationMessages = activeConversation ? messages[activeConversation] || [] : []

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversationMessages])

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarFallback>{getInitials(conversation.participantName)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{conversation.participantName}</h3>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversationMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
          ) : (
            conversationMessages.map((message) => <MessageItem key={message.id} message={message} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <MessageComposer recipientId={conversation.participantId} />
    </div>
  )
}
