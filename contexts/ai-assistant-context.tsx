"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useLocalStorage } from "@/lib/local-storage"
import { aiService } from "@/lib/ai-service"
import type { DataEditOperation } from "./ai-data-editor"
import { processDataEditOperation, processMultipleDataEditOperations } from "@/lib/ai-data-editor"
import { eventBus } from "@/lib/event-bus"
import { getOpenRouterApiKey } from "@/app/actions/ai-actions"
import { loadAllData } from "@/lib/data-manager"
import { checkPersistenceHealth } from "@/lib/data-persistence-monitor"

export type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
}

export type UserProfile = {
  lastUpdated: number
  traits: Record<string, any>
  preferences: Record<string, any>
  interactions: {
    count: number
    lastInteraction: number
    commonTopics: string[]
    recentQueries: { content: string; timestamp: number }[]
  }
  knowledgeAreas: string[]
  feedback: {
    positive: number
    negative: number
    lastFeedback?: { content: string; sentiment: "positive" | "negative"; timestamp: number }
  }
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
  userProfile: UserProfile
  updateUserProfile: (updates: Partial<UserProfile>) => void
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
  canAccessData: true, // Always enable data access by default
  canEditData: true,
  isOpen: false,
  model: "google/gemini-2.0-flash-exp:free", // Default model
}

const defaultUserProfile: UserProfile = {
  lastUpdated: Date.now(),
  traits: {},
  preferences: {},
  interactions: {
    count: 0,
    lastInteraction: Date.now(),
    commonTopics: [],
    recentQueries: [],
  },
  knowledgeAreas: [],
  feedback: {
    positive: 0,
    negative: 0,
  },
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
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>("ai-assistant-user-profile", defaultUserProfile)
  const [dataContext, setDataContext] = useState<Record<string, any>>({})
  const [dataLoaded, setDataLoaded] = useState(false)

  // useRef to hold the latest values for callbacks
  const latestSettings = useRef(settings)
  const latestMessages = useRef(messages)
  const latestDataContext = useRef(dataContext)
  const latestUserProfile = useRef(userProfile)

  // Update refs when values change
  useEffect(() => {
    latestSettings.current = settings
  }, [settings])

  useEffect(() => {
    latestMessages.current = messages
  }, [messages])

  useEffect(() => {
    latestDataContext.current = dataContext
  }, [dataContext])

  useEffect(() => {
    latestUserProfile.current = userProfile
  }, [userProfile])

  // Initialize with API key from server
  useEffect(() => {
    async function fetchApiKey() {
      try {
        const { key } = await getOpenRouterApiKey()
        if (key && !latestSettings.current.apiKey) {
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

  // Load all user data on mount and when settings change
  useEffect(() => {
    async function loadData() {
      try {
        console.log("Loading all user data for AI assistant...")
        const allData = loadAllData()
        setDataContext(allData)
        setDataLoaded(true)
        console.log("Successfully loaded user data for AI assistant")
      } catch (error) {
        console.error("Error loading data context:", error)
      }
    }

    // Always load data regardless of canAccessData setting
    // This ensures data is available when needed
    loadData()
  }, [])

  // Subscribe to data changes to update the AI context
  useEffect(() => {
    const handleDataChange = (event: any) => {
      // If there are pending data edits, we don't want to add a message about data changes
      if (isPendingApproval) return

      // Always update the data context regardless of canAccessData setting
      try {
        console.log("Updating AI data context due to data change:", event?.collection)
        const allData = loadAllData()
        setDataContext(allData)
      } catch (error) {
        console.error("Error updating data context:", error)
      }

      // Add a system message about data changes if the chat is open
      if (isOpen && latestMessages.current.length > 0) {
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
  }, [isOpen, isPendingApproval, setMessages])

  const updateSettings = useCallback(
    (newSettings: Partial<AISettings>) => {
      setSettings((prev) => {
        // Always ensure canAccessData is true
        const updatedSettings = { ...prev, ...newSettings, canAccessData: true }
        return updatedSettings
      })
    },
    [setSettings],
  )

  const updateUserProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setUserProfile((prev) => {
        const updated = {
          ...prev,
          ...updates,
          lastUpdated: Date.now(),
        }

        // If updating interactions, preserve the array structure
        if (updates.interactions) {
          updated.interactions = {
            ...prev.interactions,
            ...updates.interactions,
            // Only update lastInteraction if not explicitly set
            lastInteraction: updates.interactions.lastInteraction || Date.now(),
          }

          // If updating recent queries, ensure it's an array and limit size
          if (updates.interactions.recentQueries) {
            updated.interactions.recentQueries = [
              ...updates.interactions.recentQueries,
              ...(prev.interactions.recentQueries || []),
            ].slice(0, 10) // Keep only 10 most recent
          }
        }

        // If updating traits or preferences, merge them
        if (updates.traits) {
          updated.traits = { ...prev.traits, ...updates.traits }
        }

        if (updates.preferences) {
          updated.preferences = { ...prev.preferences, ...updates.preferences }
        }

        return updated
      })
    },
    [setUserProfile],
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
        // Update user profile with new interaction
        updateUserProfile({
          interactions: {
            count: latestUserProfile.current.interactions.count + 1,
            lastInteraction: Date.now(),
            recentQueries: [
              {
                content,
                timestamp: Date.now(),
              },
              ...(latestUserProfile.current.interactions.recentQueries || []).slice(0, 9),
            ],
          },
        })

        // Get API key from settings (which is now populated from server)
        const apiKey = latestSettings.current.apiKey || ""

        if (!apiKey) {
          throw new Error("No API key available")
        }

        // Format messages for the API - include all messages for better context
        const apiMessages = latestMessages.current
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))

        // Add the new user message
        apiMessages.push({
          role: "user",
          content,
        })

        // Send to API - always allow data access
        const response = await aiService.sendMessage(
          apiMessages,
          apiKey,
          true, // Always allow data access
          latestSettings.current.canEditData,
          latestUserProfile.current, // Pass user profile
        )

        // Check if there's a data edit operation
        if (response.dataEditOperation && latestSettings.current.canEditData) {
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
    [setMessages, updateUserProfile],
  )

  // Improved data edit approval with better error handling and validation
  const approveDataEdit = useCallback(async () => {
    if (!pendingDataEdit) return

    try {
      console.log(
        "Processing data edit operation:",
        Array.isArray(pendingDataEdit)
          ? `${pendingDataEdit.length} operations`
          : `${pendingDataEdit.type} operation on ${pendingDataEdit.collection}`,
      )

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

      // Update user profile with data edit outcome
      updateUserProfile({
        traits: {
          // Record that the user approves AI edits
          approvesAiEdits: true,
          // Record the specific collection they allowed editing
          editedCollections: [
            ...(latestUserProfile.current.traits.editedCollections || []),
            ...(Array.isArray(pendingDataEdit)
              ? [...new Set(pendingDataEdit.map((op) => op.collection))]
              : [pendingDataEdit.collection]),
          ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
        },
        feedback: {
          positive: latestUserProfile.current.feedback.positive + 1,
          lastFeedback: {
            content: "Approved data edit",
            sentiment: "positive",
            timestamp: Date.now(),
          },
        },
      })

      // Add system message about the results
      const systemMessage: Message = {
        id: Date.now().toString(),
        role: "system",
        content: resultMessage,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, systemMessage])

      // Force a data refresh to ensure we have the latest data
      if (successCount > 0) {
        try {
          const allData = loadAllData()
          setDataContext(allData)
          console.log("Data context refreshed after successful edit operations")
        } catch (error) {
          console.error("Error refreshing data context after edits:", error)
        }
      }

      // Check persistence health after operations
      setTimeout(() => {
        try {
          const healthCheck = checkPersistenceHealth()
          if (!healthCheck.healthy) {
            console.warn("AI Data Edit - Persistence health issues:", healthCheck.issues)

            // Add system message about persistence issues if they exist
            if (healthCheck.issues.length > 0) {
              const persistenceMessage: Message = {
                id: (Date.now() + 3).toString(),
                role: "system",
                content: `⚠️ Some data persistence issues were detected. Your changes have been applied, but please check that they appear correctly in the application. If you encounter any issues, try refreshing the page.`,
                timestamp: Date.now() + 300,
              }

              setMessages((prev) => [...prev, persistenceMessage])
            }
          }
        } catch (error) {
          console.error("Error checking persistence health:", error)
        }
      }, 1000)

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

      // Update user profile with error information
      updateUserProfile({
        feedback: {
          negative: latestUserProfile.current.feedback.negative + 1,
          lastFeedback: {
            content: `Error processing data edit: ${error instanceof Error ? error.message : "Unknown error"}`,
            sentiment: "negative",
            timestamp: Date.now(),
          },
        },
      })

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
  }, [pendingDataEdit, setMessages, updateUserProfile])

  const rejectDataEdit = useCallback(() => {
    // Add system message about rejection
    const systemMessage: Message = {
      id: Date.now().toString(),
      role: "system",
      content: "❌ Data edit rejected by user",
      timestamp: Date.now(),
    }

    // Update user profile to note rejection of AI edits
    updateUserProfile({
      traits: {
        rejectsAiEdits: true,
        rejectedCollections: [
          ...(latestUserProfile.current.traits.rejectedCollections || []),
          ...(Array.isArray(pendingDataEdit)
            ? [...new Set(pendingDataEdit.map((op) => op.collection))]
            : [pendingDataEdit?.collection]),
        ]
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates and nulls
      },
      feedback: {
        negative: latestUserProfile.current.feedback.negative + 1,
        lastFeedback: {
          content: "Rejected data edit",
          sentiment: "negative",
          timestamp: Date.now(),
        },
      },
    })

    setMessages((prev) => [...prev, systemMessage])
    setPendingDataEdit(null)
    setIsPendingApproval(false)
  }, [setMessages, updateUserProfile, pendingDataEdit])

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
        userProfile,
        updateSettings,
        sendMessage,
        clearMessages,
        toggleChat,
        minimizeChat,
        maximizeChat,
        approveDataEdit,
        rejectDataEdit,
        updateUserProfile,
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
