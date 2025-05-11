"use client"

import { useAIAssistant } from "@/contexts/ai-assistant-context"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import { useEffect } from "react"

export function AIChatButton() {
  const { toggleChat, isOpen } = useAIAssistant()

  // Listen for custom event to toggle chat
  useEffect(() => {
    const handleToggleEvent = () => {
      toggleChat()
    }

    window.addEventListener("toggle-ai-assistant", handleToggleEvent)
    return () => {
      window.removeEventListener("toggle-ai-assistant", handleToggleEvent)
    }
  }, [toggleChat])

  return (
    <Button
      onClick={toggleChat}
      variant="outline"
      size="icon"
      className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-md"
      aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
    >
      <Bot className="h-5 w-5" />
    </Button>
  )
}
