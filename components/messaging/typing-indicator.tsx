"use client"

import { useMessaging } from "@/contexts/messaging-context"
import { useEffect, useState } from "react"

interface TypingIndicatorProps {
  conversationId: string
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { state } = useMessaging()
  const isTyping = state.typingUsers[conversationId]
  const [dots, setDots] = useState(".")

  // Animate the dots
  useEffect(() => {
    if (!isTyping) return

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "."
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isTyping])

  if (!isTyping) return null

  return (
    <div className="flex items-start gap-2 max-w-[80%] mr-auto animate-pulse">
      <div className="flex flex-col gap-1">
        <div className="rounded-lg px-3 py-2 text-sm bg-muted">
          <span className="text-muted-foreground">Typing{dots}</span>
        </div>
      </div>
    </div>
  )
}
