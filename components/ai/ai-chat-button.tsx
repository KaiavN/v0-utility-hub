"use client"

import { useEffect } from "react"
import { useAIAssistant } from "@/contexts/ai-assistant-context"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function AIChatButton() {
  const { isOpen, toggleChat, isPendingApproval } = useAIAssistant()

  // Add event listener for custom event
  useEffect(() => {
    const handleToggleEvent = () => {
      toggleChat()
    }

    window.addEventListener("toggle-ai-assistant", handleToggleEvent)
    return () => window.removeEventListener("toggle-ai-assistant", handleToggleEvent)
  }, [toggleChat])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={toggleChat}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg relative"
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isPendingApproval && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
        <Bot className="h-6 w-6" />
        {isPendingApproval && <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-red-500 text-white">!</Badge>}
      </Button>
    </div>
  )
}
