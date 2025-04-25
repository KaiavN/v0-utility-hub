"use client"

import { useEffect } from "react"
import { AIAssistantProvider } from "@/contexts/ai-assistant-context"
import { AIChatButton } from "./ai-chat-button"
import { AIChatWindow } from "./ai-chat-window"

export function AIAssistant() {
  // Add keyboard shortcut to toggle chat (Alt+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "a") {
        const event = new CustomEvent("toggle-ai-assistant")
        window.dispatchEvent(event)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <AIAssistantProvider>
      <AIChatButton />
      <AIChatWindow />
    </AIAssistantProvider>
  )
}
