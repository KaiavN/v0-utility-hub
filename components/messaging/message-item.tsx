"use client"

import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Message } from "@/lib/messaging-types"
import { CheckCheck } from "lucide-react"

interface MessageItemProps {
  message: Message
  isCurrentUser: boolean
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      console.error("Invalid date format:", error)
      return ""
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

  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : ""}`}>
        {!isCurrentUser && (
          <Avatar className="h-8 w-8 mr-2">
            {message.sender_avatar && (
              <AvatarImage src={message.sender_avatar || "/placeholder.svg"} alt={message.sender_name || ""} />
            )}
            <AvatarFallback>{getInitials(message.sender_name)}</AvatarFallback>
          </Avatar>
        )}
        <div>
          <div
            className={`rounded-lg px-4 py-2 ${isCurrentUser ? "bg-primary text-primary-foreground ml-2" : "bg-muted"}`}
          >
            {message.content}
          </div>
          <div className={`flex items-center text-xs text-muted-foreground mt-1 ${isCurrentUser ? "justify-end" : ""}`}>
            <span>{formatTimestamp(message.created_at)}</span>
            {isCurrentUser && (
              <span className="ml-1 flex items-center">
                <CheckCheck className={`h-3 w-3 ${message.read ? "text-primary" : ""}`} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
