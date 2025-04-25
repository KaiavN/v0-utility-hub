"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useLocalStorage } from "@/lib/local-storage"
import { aiService } from "@/lib/ai-service"
import type { DataEditOperation } from "@/lib/ai-data-editor"
import { processDataEditOperation, processMultipleDataEditOperations } from "@/lib/ai-data-editor"
import { eventBus } from "@/lib/event-bus"
import { getOpenRouterApiKey } from "@/app/actions/ai-actions"

export type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
}

type AISettings = {
  apiKey: string
  canAccessData: boolean
  canEditData: boolean
  isOpen: boolean
  model: string
}

interface AIAssistantContextType {
  messages: Message[]
  settings: AISettings
  isOpen: boolean
  isMinimized: boolean
  isSending: boolean
  pendingDataEdit: DataEditOperation | DataEditOperation[] | null
  isPendingApproval: boolean
  updateSettings: (settings: Partial<AISettings>) => void
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  toggleChat: () => void
  minimizeChat: () => void
  maximizeChat: () => void
  approveDataEdit: () => Promise<void>
  rejectDataEdit: () => void
}

const defaultSettings: AISettings = {
  apiKey: "", // We'll handle the API key securely through server actions
  canAccessData: true,
  canEditData: true,
  isOpen: false,
  model: "google/gemini-2.0-flash-exp:free", // Default model
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined)

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useLocalStorage<Message[]>("ai-assistant-messages", [])
  const [settings, setSettings] = useLocalStorage<AISettings>("ai-assistant-settings", defaultSettings)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [pendingDataEdit, setPendingDataEdit] = useState<DataEditOperation | DataEditOperation[] | null>(null)
  const [isPendingApproval, setIsPendingApproval] = useState(false)

  // Initialize with API key from server
  useEffect(() => {
    async function fetchApiKey() {
      try {
        const { key } = await getOpenRouterApiKey()
        if (key && !settings.apiKey) {
          setSettings((prev) => ({
            ...prev,
            apiKey: key,
          }))
        }
      } catch (error) {
        console.error("Error fetching API key:", error)
      }
    }

    fetchApiKey()
  }, [])

  // Subscribe to data changes to update the AI context
  useEffect(() => {
    const handleDataChange = (event: any) => {
      // If there are pending data edits, we don't want to add a message about data changes
      if (isPendingApproval) return

      // Add a system message about data changes if the chat is open
      if (isOpen && messages.length > 0) {
        const collection = event?.collection ? `Collection: ${event.collection}` : ""
        const systemMessage: Message = {
          id: Date.now().toString(),
          role: "system",
          content: `Data has been updated in the application. ${collection}`,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, systemMessage])
      }
    }

    // Subscribe to the general data updated event
    const unsubscribe = eventBus.subscribe("data:updated", handleDataChange)

    return () => {
      // Unsubscribe from the event
      unsubscribe()
    }
  }, [isOpen, messages.length, isPendingApproval, setMessages])

  const updateSettings = useCallback(
    (newSettings: Partial<AISettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }))
    },
    [setSettings],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsSending(true)

      try {
        // Get API key from settings (which is now populated from server)
        const apiKey = settings.apiKey || ""

        if (!apiKey) {
          throw new Error("No API key available")
        }

        // Format messages for the API
        const apiMessages = messages
          .filter((msg) => msg.role !== "system")
          .slice(-10) // Limit context to last 10 messages
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))

        // Add the new user message
        apiMessages.push({
          role: "user",
          content,
        })

        // Send to API
        const response = await aiService.sendMessage(apiMessages, apiKey, settings.canAccessData, settings.canEditData)

        // Check if there's a data edit operation
        if (response.dataEditOperation && settings.canEditData) {
          setPendingDataEdit(response.dataEditOperation)
          setIsPendingApproval(true)
        } else if (response.error) {
          // Add error message about the specific error
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "system",
            content: `Error processing data edit: ${response.error}`,
            timestamp: Date.now(),
          }
          setMessages((prev) => [...prev, errorMessage])
        }

        // Add assistant message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.content,
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("Error sending message:", error)

        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Sorry, there was an error processing your request: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsSending(false)
      }
    },
    [messages, settings, setMessages],
  )

  // The rest of the component remains the same
  const approveDataEdit = useCallback(async () => {
    if (!pendingDataEdit) return

    try {
      // Process the data edit operation(s)
      let results: { success: boolean; message: string; data?: any }[] = []

      if (Array.isArray(pendingDataEdit)) {
        // Process multiple operations
        results = await processMultipleDataEditOperations(pendingDataEdit)
      } else {
        // Process single operation
        const result = await processDataEditOperation(pendingDataEdit)
        results = [result]
      }

      // Check if all operations were successful
      const allSuccessful = results.every((r) => r.success)
      const successCount = results.filter((r) => r.success).length
      const failureCount = results.length - successCount

      // Create a detailed message about the results
      let resultMessage = allSuccessful
        ? `✅ All data edits successful`
        : `⚠️ ${successCount} operations succeeded, ${failureCount} failed`

      // Add details about each operation
      if (!allSuccessful) {
        resultMessage +=
          ":\n" +
          results
            .map((r, i) => {
              const op = Array.isArray(pendingDataEdit) ? pendingDataEdit[i] : pendingDataEdit
              const opType = op?.type || "unknown"
              const collection = op?.collection || "unknown"
              return `${r.success ? "✅" : "❌"} ${opType} ${collection}: ${r.success ? "Success" : r.message}`
            })
            .join("\n")
      }

      // Add system message about the results
      const systemMessage: Message = {
        id: Date.now().toString(),
        role: "system",
        content: resultMessage,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, systemMessage])

      // If successful, add a follow-up assistant message
      if (allSuccessful) {
        const operationTypes = Array.isArray(pendingDataEdit)
          ? [...new Set(pendingDataEdit.map((op) => op.type))]
              .map((type) => (type === "add" ? "added" : type === "update" ? "updated" : "deleted"))
              .join(" and ")
          : pendingDataEdit.type === "add"
            ? "added"
            : pendingDataEdit.type === "update"
              ? "updated"
              : "deleted"

        const collections = Array.isArray(pendingDataEdit)
          ? [...new Set(pendingDataEdit.map((op) => op.collection))]
              .map((c) =>
                c
                  .replace(/([A-Z])/g, " $1")
                  .trim()
                  .toLowerCase(),
              )
              .join(" and ")
          : pendingDataEdit.collection
              .replace(/([A-Z])/g, " $1")
              .trim()
              .toLowerCase()

        const followUpMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I've successfully ${operationTypes} the data in your ${collections}. Is there anything else you'd like me to help you with?`,
          timestamp: Date.now() + 100,
        }

        setMessages((prev) => [...prev, followUpMessage])
      }
    } catch (error) {
      console.error("Error processing data edit:", error)

      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "system",
        content: `❌ Error processing data edit: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setPendingDataEdit(null)
      setIsPendingApproval(false)
    }
  }, [pendingDataEdit, setMessages])

  const rejectDataEdit = useCallback(() => {
    // Add system message about rejection
    const systemMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: "❌ Data edit rejected by user",
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, systemMessage])
    setPendingDataEdit(null)
    setIsPendingApproval(false)
  }, [setMessages])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [setMessages])

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev)
    if (isMinimized) setIsMinimized(false)
  }, [isMinimized])

  const minimizeChat = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const maximizeChat = useCallback(() => {
    setIsMinimized(false)
  }, [])

  return (
    <AIAssistantContext.Provider
      value={{
        messages,
        settings,
        isOpen,
        isMinimized,
        isSending,
        pendingDataEdit,
        isPendingApproval,
        updateSettings,
        sendMessage,
        clearMessages,
        toggleChat,
        minimizeChat,
        maximizeChat,
        approveDataEdit,
        rejectDataEdit,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  )
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext)
  if (context === undefined) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider")
  }
  return context
}
