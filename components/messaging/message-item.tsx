"use client"

import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, CheckCheck } from "lucide-react"
import type { Message } from "@/lib/messaging-types"
import { cn } from "@/lib/utils"

interface MessageItemProps {
  message: Message
  isOwnMessage: boolean
  showSender?: boolean
}

export function MessageItem({ message, isOwnMessage, showSender = false }: MessageItemProps) {
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
    <div
      className={cn("flex items-start gap-2 max-w-[85%] group", isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto")}
    >
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={message.sender_avatar || ""} alt={message.sender_name || "User"} />
          <AvatarFallback>{getInitials(message.sender_name)}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col gap-1">
        {showSender && !isOwnMessage && message.sender_name && (
          <span className="text-xs font-medium text-muted-foreground ml-1">{message.sender_name}</span>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-muted text-foreground rounded-tl-none",
          )}
        >
          {message.content}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 px-1 opacity-70 group-hover:opacity-100 transition-opacity",
            isOwnMessage ? "justify-end" : "justify-start",
          )}
        >
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
          {isOwnMessage && (
            <span className="text-xs text-muted-foreground">
              {message.read ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
