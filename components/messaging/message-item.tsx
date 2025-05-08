"use client"

import type { Message } from "@/lib/messaging-types"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const { user } = useAuth()
  const isCurrentUser = user?.id === message.senderId

  const formattedTime = format(new Date(message.timestamp), "h:mm a")

  return (
    <div className={cn("flex mb-4", isCurrentUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        <div className="flex flex-col">
          <div className="break-words">{message.content}</div>
          <div className={cn("text-xs mt-1", isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {formattedTime}
          </div>
        </div>
      </div>
    </div>
  )
}
