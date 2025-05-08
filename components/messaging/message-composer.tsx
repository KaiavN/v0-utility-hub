"use client"

import type React from "react"

import { useState, type FormEvent } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

interface MessageComposerProps {
  recipientId: string
}

export function MessageComposer({ recipientId }: MessageComposerProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { sendMessage } = useMessaging()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      await sendMessage(recipientId, message)
      setMessage("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[60px] resize-none"
        />
        <Button type="submit" size="icon" disabled={!message.trim() || isSubmitting}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </form>
  )
}
