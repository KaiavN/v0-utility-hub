"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Smile } from "lucide-react"

interface MessageComposerProps {
  recipientId?: string
}

export function MessageComposer({ recipientId }: MessageComposerProps) {
  const { sendMessage, state } = useMessaging()
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [state.activeConversation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isSending) return

    setIsSending(true)

    try {
      const success = await sendMessage(message, recipientId)

      if (success) {
        setMessage("")
      }
    } finally {
      setIsSending(false)

      // Focus back on textarea
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3">
      <div className="flex items-end gap-2">
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-full" disabled={isSending}>
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Attach file</span>
        </Button>

        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-10 resize-none pr-10"
            disabled={isSending || state.isLoading}
            rows={1}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-2 bottom-1 h-8 w-8 rounded-full"
            disabled={isSending}
          >
            <Smile className="h-4 w-4" />
            <span className="sr-only">Add emoji</span>
          </Button>
        </div>

        <Button
          type="submit"
          size="icon"
          className="h-8 w-8 rounded-full"
          disabled={!message.trim() || isSending || state.isLoading}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </form>
  )
}
