"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useMessaging } from "@/contexts/messaging-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, Paperclip, Smile } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { debounce } from "lodash"

interface MessageComposerProps {
  conversationId: string
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const { sendMessage, state, setTypingStatus } = useMessaging()
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-focus the textarea when the conversation changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [conversationId])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const adjustHeight = () => {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }

    textarea.addEventListener("input", adjustHeight)
    adjustHeight()

    return () => {
      textarea.removeEventListener("input", adjustHeight)
    }
  }, [])

  // Handle typing indicator
  const debouncedTypingOff = useRef(
    debounce((conversationId: string) => {
      setTypingStatus(conversationId, false)
    }, 2000),
  ).current

  useEffect(() => {
    return () => {
      // Clear typing status when component unmounts
      if (conversationId) {
        setTypingStatus(conversationId, false)
      }
      debouncedTypingOff.cancel()
    }
  }, [conversationId, debouncedTypingOff, setTypingStatus])

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value
    setMessage(newMessage)

    // Set typing indicator
    if (newMessage.trim() && newMessage !== message) {
      setTypingStatus(conversationId, true)
      debouncedTypingOff(conversationId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isSending) return

    setIsSending(true)

    try {
      // Clear typing indicator
      debouncedTypingOff.cancel()
      setTypingStatus(conversationId, false)

      const success = await sendMessage(message)

      if (success) {
        setMessage("")
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto"
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex flex-col gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[60px] max-h-[150px] resize-none"
          disabled={state.isLoading || isSending}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" disabled={state.isLoading || isSending}>
              <Paperclip className="h-4 w-4" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Button type="button" variant="ghost" size="icon" disabled={state.isLoading || isSending}>
              <Smile className="h-4 w-4" />
              <span className="sr-only">Add emoji</span>
            </Button>
          </div>
          <Button type="submit" disabled={!message.trim() || state.isLoading || isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send
          </Button>
        </div>
      </div>
    </form>
  )
}
