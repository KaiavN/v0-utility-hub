"use client"

import type React from "react"
import { createContext, useContext, useEffect, useCallback, useReducer } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"
import type { Message, ConversationSummary, MessagingState } from "@/lib/messaging-types"

// Action types for the reducer
type MessagingAction =
  | { type: "SET_CONVERSATIONS"; payload: ConversationSummary[] }
  | { type: "SET_ACTIVE_CONVERSATION"; payload: string | null }
  | { type: "SET_MESSAGES"; payload: { conversationId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_TYPING"; payload: { conversationId: string; isTyping: boolean } }
  | { type: "RESET" }

// Initial state
const initialState: MessagingState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  isLoading: false,
  error: null,
  typingUsers: {},
}

// Reducer function
function messagingReducer(state: MessagingState, action: MessagingAction): MessagingState {
  switch (action.type) {
    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.payload }
    case "SET_ACTIVE_CONVERSATION":
      return { ...state, activeConversation: action.payload }
    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
      }
    case "ADD_MESSAGE":
      const conversationId = action.payload.conversation_id
      const existingMessages = state.messages[conversationId] || []
      // Check if message already exists to prevent duplicates
      if (existingMessages.some((msg) => msg.id === action.payload.id)) {
        return state
      }
      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, action.payload],
        },
        // Clear typing indicator when a message is received
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: false,
        },
      }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_TYPING":
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: action.payload.isTyping,
        },
      }
    case "RESET":
      return initialState
    default:
      return state
  }
}

interface MessagingContextType {
  state: MessagingState
  sendMessage: (content: string, conversationId?: string) => Promise<boolean>
  setActiveConversation: (conversationId: string | null) => void
  createConversation: (participantId: string, initialMessage?: string) => Promise<string | null>
  refreshConversations: () => Promise<void>
  markMessagesAsRead: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<boolean>
  setTypingStatus: (conversationId: string, isTyping: boolean) => Promise<void>
  clearError: () => void
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [state, dispatch] = useReducer(messagingReducer, initialState)
  const supabase = createSupabaseClient()

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null })
  }, [])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true })
      clearError()

      const response = await fetch(`/api/messages/conversations?userId=${user.id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch conversations")
      }

      const data = await response.json()

      if (Array.isArray(data.conversations)) {
        dispatch({ type: "SET_CONVERSATIONS", payload: data.conversations })
      } else {
        console.error("Invalid conversations data:", data)
        dispatch({ type: "SET_CONVERSATIONS", payload: [] })
      }
    } catch (err) {
      console.error("Error fetching conversations:", err)
      dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err.message : "Failed to load conversations" })
      toast({
        title: "Error",
        description: "Failed to load conversations. Please try again later.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [isAuthenticated, user, clearError])

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    await fetchConversations()
  }, [fetchConversations])

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated || !user?.id || !conversationId) {
        return
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true })
        clearError()

        const { data, error } = await supabase
          .from("messages")
          .select(
            `
            id,
            content,
            created_at,
            read,
            sender_id,
            conversation_id,
            sender:sender_id (
              display_name,
              avatar_url
            )
          `,
          )
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Error fetching messages:", error)
          dispatch({ type: "SET_ERROR", payload: error.message })
          return
        }

        // Format messages
        const formattedMessages: Message[] = (data || []).map((message: any) => ({
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          read: message.read,
          sender_id: message.sender_id,
          conversation_id: message.conversation_id,
          sender_name: message.sender?.display_name || "Unknown",
          sender_avatar: message.sender?.avatar_url || null,
        }))

        dispatch({
          type: "SET_MESSAGES",
          payload: { conversationId, messages: formattedMessages },
        })
      } catch (err) {
        console.error("Unexpected error fetching messages:", err)
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Failed to load messages",
        })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },
    [isAuthenticated, user, supabase, clearError],
  )

  // Set active conversation
  const setActiveConversation = useCallback(
    (conversationId: string | null) => {
      dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: conversationId })
      if (conversationId) {
        fetchMessages(conversationId)
        markMessagesAsRead(conversationId)
      }
    },
    [fetchMessages],
  )

  // Send a message
  const sendMessage = useCallback(
    async (content: string, conversationId?: string): Promise<boolean> => {
      const targetConversationId = conversationId || state.activeConversation

      if (!isAuthenticated || !user?.id || !targetConversationId || !content.trim()) {
        toast({
          title: "Error",
          description: "Cannot send message. Please check your connection and try again.",
          variant: "destructive",
        })
        return false
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true })
        clearError()

        // Clear typing indicator
        await setTypingStatus(targetConversationId, false)

        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: targetConversationId,
            sender_id: user.id,
            content: content.trim(),
          })
          .select()
          .single()

        if (error) {
          console.error("Error sending message:", error)
          dispatch({ type: "SET_ERROR", payload: error.message })
          toast({
            title: "Error",
            description: "Failed to send message. Please try again.",
            variant: "destructive",
          })
          return false
        }

        // Optimistically add the message to the UI
        if (data) {
          const newMessage: Message = {
            id: data.id,
            content: data.content,
            created_at: data.created_at,
            read: data.read,
            sender_id: data.sender_id,
            conversation_id: data.conversation_id,
            sender_name: user.name || user.email || "You",
            sender_avatar: user.avatarUrl || null,
          }

          dispatch({ type: "ADD_MESSAGE", payload: newMessage })
        }

        // Refresh conversations to update last message
        refreshConversations()
        return true
      } catch (err) {
        console.error("Unexpected error sending message:", err)
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Failed to send message",
        })
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
        return false
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },
    [isAuthenticated, user, state.activeConversation, supabase, refreshConversations, clearError],
  )

  // Create a new conversation
  const createConversation = useCallback(
    async (participantId: string, initialMessage?: string): Promise<string | null> => {
      if (!isAuthenticated || !user?.id || !participantId) {
        toast({
          title: "Error",
          description: "You must be logged in to create conversations",
          variant: "destructive",
        })
        return null
      }

      // Don't create conversation with yourself
      if (participantId === user.id) {
        toast({
          title: "Error",
          description: "You cannot create a conversation with yourself",
          variant: "destructive",
        })
        return null
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true })
        clearError()

        // Check if conversation already exists
        const { data: existingConversations, error: checkError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id)
          .in(
            "conversation_id",
            supabase.from("conversation_participants").select("conversation_id").eq("user_id", participantId),
          )

        if (checkError) {
          console.error("Error checking existing conversations:", checkError)
          throw new Error(checkError.message)
        }

        // If conversation exists, return it
        if (existingConversations && existingConversations.length > 0) {
          const existingConversationId = existingConversations[0].conversation_id

          // If there's an initial message, send it
          if (initialMessage) {
            await sendMessage(initialMessage, existingConversationId)
          }

          return existingConversationId
        }

        // Create the conversation
        const { data: conversationData, error: conversationError } = await supabase
          .from("conversations")
          .insert({})
          .select()
          .single()

        if (conversationError) {
          console.error("Error creating conversation:", conversationError)
          throw new Error(conversationError.message)
        }

        // Add participants
        const participantsToInsert = [
          { conversation_id: conversationData.id, user_id: user.id },
          { conversation_id: conversationData.id, user_id: participantId },
        ]

        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .insert(participantsToInsert)

        if (participantsError) {
          console.error("Error adding participants:", participantsError)
          throw new Error(participantsError.message)
        }

        // If there's an initial message, send it
        if (initialMessage) {
          await sendMessage(initialMessage, conversationData.id)
        }

        // Refresh conversations
        await refreshConversations()
        return conversationData.id
      } catch (err) {
        console.error("Error creating conversation:", err)
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Failed to create conversation",
        })
        toast({
          title: "Error",
          description: "Failed to create conversation. Please try again.",
          variant: "destructive",
        })
        return null
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },
    [isAuthenticated, user, supabase, sendMessage, refreshConversations, clearError],
  )

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated || !user?.id || !conversationId) {
        return
      }

      try {
        const { error } = await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .eq("read", false)

        if (error) {
          console.error("Error marking messages as read:", error)
        } else {
          // Update local state to reflect read status
          const currentMessages = state.messages[conversationId] || []
          const updatedMessages = currentMessages.map((msg) =>
            msg.sender_id !== user.id ? { ...msg, read: true } : msg,
          )

          dispatch({
            type: "SET_MESSAGES",
            payload: { conversationId, messages: updatedMessages },
          })

          // Refresh conversations to update unread counts
          refreshConversations()
        }
      } catch (err) {
        console.error("Unexpected error marking messages as read:", err)
      }
    },
    [isAuthenticated, user, supabase, state.messages, refreshConversations],
  )

  // Set typing status
  const setTypingStatus = useCallback(
    async (conversationId: string, isTyping: boolean) => {
      if (!isAuthenticated || !user?.id || !conversationId) {
        return
      }

      try {
        // Update typing status in the database
        const { error } = await supabase.rpc("update_typing_status", {
          p_conversation_id: conversationId,
          p_user_id: user.id,
          p_is_typing: isTyping,
        })

        if (error) {
          console.error("Error updating typing status:", error)
        }
      } catch (err) {
        console.error("Unexpected error updating typing status:", err)
      }
    },
    [isAuthenticated, user, supabase],
  )

  // Delete a conversation
  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.id || !conversationId) {
        toast({
          title: "Error",
          description: "You must be logged in to delete conversations",
          variant: "destructive",
        })
        return false
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true })
        clearError()

        // First delete all messages in the conversation
        const { error: messagesError } = await supabase.from("messages").delete().eq("conversation_id", conversationId)

        if (messagesError) {
          console.error("Error deleting messages:", messagesError)
          throw new Error(messagesError.message)
        }

        // Then delete the participants
        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .delete()
          .eq("conversation_id", conversationId)

        if (participantsError) {
          console.error("Error deleting participants:", participantsError)
          throw new Error(participantsError.message)
        }

        // Finally delete the conversation
        const { error: conversationError } = await supabase.from("conversations").delete().eq("id", conversationId)

        if (conversationError) {
          console.error("Error deleting conversation:", conversationError)
          throw new Error(conversationError.message)
        }

        // If this was the active conversation, clear it
        if (state.activeConversation === conversationId) {
          dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: null })
        }

        // Remove the conversation from local state
        dispatch({
          type: "SET_CONVERSATIONS",
          payload: state.conversations.filter((c) => c.id !== conversationId),
        })

        toast({
          title: "Success",
          description: "Conversation deleted successfully",
        })

        return true
      } catch (err) {
        console.error("Error deleting conversation:", err)
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Failed to delete conversation",
        })
        toast({
          title: "Error",
          description: "Failed to delete conversation. Please try again.",
          variant: "destructive",
        })
        return false
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },
    [isAuthenticated, user, supabase, state.activeConversation, state.conversations, clearError],
  )

  // Reset state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: "RESET" })
    }
  }, [isAuthenticated])

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    const subscription = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as any

          // Fetch the sender info
          const { data: sender } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .single()

          const formattedMessage: Message = {
            id: newMessage.id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            read: newMessage.read,
            sender_id: newMessage.sender_id,
            conversation_id: newMessage.conversation_id,
            sender_name: sender?.display_name || "Unknown",
            sender_avatar: sender?.avatar_url || null,
          }

          // Add message to state if it's for the current conversation
          dispatch({ type: "ADD_MESSAGE", payload: formattedMessage })

          // Mark as read if it's the active conversation and not from the current user
          if (state.activeConversation === newMessage.conversation_id && newMessage.sender_id !== user.id) {
            markMessagesAsRead(newMessage.conversation_id)
          }

          // Refresh conversations to update the list
          refreshConversations()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "typing_status",
        },
        async (payload) => {
          const typingStatus = payload.new as any

          // Only update typing status if it's not the current user
          if (typingStatus.user_id !== user.id) {
            dispatch({
              type: "SET_TYPING",
              payload: {
                conversationId: typingStatus.conversation_id,
                isTyping: typingStatus.is_typing,
              },
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [isAuthenticated, user, supabase, state.activeConversation, markMessagesAsRead, refreshConversations])

  // Load conversations on initial mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchConversations()
    }
  }, [isAuthenticated, user, fetchConversations])

  return (
    <MessagingContext.Provider
      value={{
        state,
        sendMessage,
        setActiveConversation,
        createConversation,
        refreshConversations,
        markMessagesAsRead,
        deleteConversation,
        setTypingStatus,
        clearError,
      }}
    >
      {children}
    </MessagingContext.Provider>
  )
}

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error("useMessaging must be used within a MessagingProvider")
  }
  return context
}
