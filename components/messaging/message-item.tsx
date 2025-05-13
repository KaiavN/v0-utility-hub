"use client"

import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Message } from "@/lib/messaging-types"
import { cn } from "@/lib/utils"

interface MessageItemProps {
  message: Message
  isOwnMessage: boolean
}

export function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  const formattedTime = (() => {
    try {
      return format(new Date(message.created_at), "h:mm a")
    } catch (error) {
      console.error("Invalid date format:", message.created_at)
      return ""
    }
  })()

  const getInitials = (name: string | null) => {
    if (!name) return "??"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className={cn("flex items-start gap-2 max-w-[80%]", isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto")}>
      {!isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender_avatar || ""} alt={message.sender_name || "User"} />
          <AvatarFallback>{getInitials(message.sender_name)}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          {message.content}
        </div>
        <span className="text-xs text-muted-foreground px-1">{formattedTime}</span>
      </div>
    </div>
  )
}
