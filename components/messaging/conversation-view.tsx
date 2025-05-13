"use client"

import { useEffect, useRef, useState } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { useAuth } from "@/contexts/auth-context"
import { MessageItem } from "./message-item"
import { MessageComposer } from "./message-composer"
import { TypingIndicator } from "./typing-indicator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft, MoreVertical, Info } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

export function ConversationView() {
  const { state, setActiveConversation, deleteConversation } = useMessaging()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showBackButton, setShowBackButton] = useState(false)
  const [showDateDivider, setShowDateDivider] = useState<Record<string, boolean>>({})

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

  // Scroll to bottom when messages change or typing status changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversationMessages, activeConversation ? state.typingUsers[activeConversation] : false])

  // Group messages by date for date dividers
  useEffect(() => {
    const dates: Record<string, boolean> = {}

    conversationMessages.forEach((message, index) => {
      const messageDate = new Date(message.created_at).toDateString()

      // If this is the first message or the date is different from the previous message
      if (index === 0 || new Date(conversationMessages[index - 1].created_at).toDateString() !== messageDate) {
        dates[messageDate] = true
      }
    })

    setShowDateDivider(dates)
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

  const renderDateDivider = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let displayDate
      if (date.toDateString() === today.toDateString()) {
        displayDate = "Today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        displayDate = "Yesterday"
      } else {
        displayDate = format(date, "MMMM d, yyyy")
      }

      return (
        <div className="flex items-center justify-center my-4">
          <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">{displayDate}</div>
        </div>
      )
    } catch (error) {
      console.error("Invalid date format:", dateStr)
      return null
    }
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
            {conversation.unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {conversation.unreadCount} unread {conversation.unreadCount === 1 ? "message" : "messages"}
              </p>
            )}
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
            <DropdownMenuItem>
              <Info className="h-4 w-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDeleteConversation}>
              Delete Conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {state.isLoading && conversationMessages.length === 0 ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-12 w-1/2 ml-auto" />
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-12 w-3/5 ml-auto" />
            </div>
          ) : conversationMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
          ) : (
            conversationMessages.map((message, index) => {
              const messageDate = new Date(message.created_at).toDateString()
              const showDivider =
                index === 0 || new Date(conversationMessages[index - 1].created_at).toDateString() !== messageDate

              return (
                <div key={message.id}>
                  {showDivider && renderDateDivider(message.created_at)}
                  <MessageItem message={message} isOwnMessage={message.sender_id === user?.id} />
                </div>
              )
            })
          )}

          {/* Typing indicator */}
          {activeConversation && state.typingUsers[activeConversation] && (
            <TypingIndicator conversationId={activeConversation} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <MessageComposer conversationId={activeConversation} />
    </div>
  )
}
