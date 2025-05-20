"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { MessageSquare, Send, Info, Users, Loader2 } from "lucide-react"
import { GroupMembersDialog } from "@/components/messaging/group-members-dialog"
import { TypingIndicator } from "@/components/messaging/typing-indicator"
import { debounce } from "lodash"

export function ConversationView() {
  const { state, sendMessage, setTypingStatus } = useMessaging()
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showGroupMembers, setShowGroupMembers] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get the active conversation
  const activeConversation = state.conversations.find((c) => c.id === state.activeConversation)
  const messages = state.activeConversation ? state.messages[state.activeConversation] || [] : []
  const isTyping = state.activeConversation ? state.typingUsers[state.activeConversation] : false

  // Create a debounced version of setTypingStatus
  const debouncedSetTypingStatus = useRef(
    debounce((conversationId: string, isTyping: boolean) => {
      setTypingStatus(conversationId, isTyping)
    }, 500),
  ).current

  // Handle message input change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Update typing status
    if (state.activeConversation) {
      const isTyping = value.length > 0
      debouncedSetTypingStatus(state.activeConversation, isTyping)
    }
  }

  // Handle message submission
  const handleSendMessage = async () => {
    if (!message.trim() || !state.activeConversation) return

    setIsSending(true)
    try {
      await sendMessage(message)
      setMessage("")
      // Clear typing status
      if (state.activeConversation) {
        setTypingStatus(state.activeConversation, false)
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
      // Focus the textarea after sending
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  // Handle Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Group messages by date
  const groupedMessages: { [date: string]: typeof messages } = {}
  messages.forEach((msg) => {
    const date = format(new Date(msg.created_at), "MMMM d, yyyy")
    if (!groupedMessages[date]) {
      groupedMessages[date] = []
    }
    groupedMessages[date].push(msg)
  })

  // If no active conversation, show empty state
  if (!state.activeConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
        <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
        <p>Choose a conversation from the list or start a new one</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar>
            {activeConversation?.type === "group" && activeConversation.avatar_url ? (
              <AvatarImage
                src={activeConversation.avatar_url || "/placeholder.svg"}
                alt={activeConversation.name || "Group"}
              />
            ) : null}
            <AvatarFallback>
              {activeConversation?.type === "direct"
                ? activeConversation.participantName?.charAt(0).toUpperCase() || "U"
                : activeConversation?.name?.charAt(0).toUpperCase() || "G"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">
              {activeConversation?.type === "direct" ? activeConversation.participantName : activeConversation?.name}
            </h2>
            {activeConversation?.type === "group" && activeConversation.description && (
              <p className="text-sm text-muted-foreground">{activeConversation.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {activeConversation?.type === "group" && (
            <Button variant="outline" size="sm" onClick={() => setShowGroupMembers(true)}>
              <Users className="h-4 w-4 mr-2" />
              Members
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Info className="h-4 w-4 mr-2" />
            Info
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3 text-muted-foreground/50" />
            <h3 className="font-medium mb-1">No messages yet</h3>
            <p className="text-sm">Start the conversation by sending a message</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="mb-6">
              <div className="text-xs text-center text-muted-foreground mb-4 relative">
                <span className="bg-background px-2 relative z-10">{date}</span>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-border -z-0" />
              </div>
              <div className="space-y-4">
                {dateMessages.map((msg) => {
                  const isOwnMessage = msg.sender_id === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <div className="flex gap-3 max-w-[80%]">
                        {!isOwnMessage && (
                          <Avatar className="h-8 w-8">
                            {msg.sender_avatar ? (
                              <AvatarImage src={msg.sender_avatar || "/placeholder.svg"} alt={msg.sender_name} />
                            ) : null}
                            <AvatarFallback>{msg.sender_name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {!isOwnMessage && activeConversation?.type === "group" && (
                            <div className="text-xs font-medium mb-1">{msg.sender_name}</div>
                          )}
                          <div
                            className={`rounded-lg p-3 ${
                              isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(msg.created_at), "h:mm a")}
                            {isOwnMessage && <span className="ml-2">{msg.read ? "Read" : "Sent"}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none"
            disabled={isSending}
          />
          <Button onClick={handleSendMessage} disabled={!message.trim() || isSending} className="self-end">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Group members dialog */}
      {activeConversation?.type === "group" && (
        <GroupMembersDialog
          open={showGroupMembers}
          onOpenChange={setShowGroupMembers}
          conversationId={state.activeConversation}
        />
      )}
    </div>
  )
}
