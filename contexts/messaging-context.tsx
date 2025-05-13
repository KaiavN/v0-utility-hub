"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"
import type { Message, ConversationWithParticipants } from "@/lib/messaging-types"

interface MessagingState {
  conversations: ConversationWithParticipants[]
  activeConversation: string | null
  messages: Record<string, Message[]>
  isLoading: boolean
  error: string | null
}

interface MessagingContextType {
  state: MessagingState
  sendMessage: (content: string, recipientId?: string) => Promise<boolean>
  setActiveConversation: (conversationId: string | null) => void
  createConversation: (participantId: string, initialMessage?: string) => Promise<string | null>
  refreshConversations: () => Promise<void>
  markMessagesAsRead: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<boolean>
}

const initialState: MessagingState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  isLoading: false,
  error: null,
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [state, setState] = useState<MessagingState>(initialState)
  const supabase = createSupabaseClient()

  // Helper function to update state
  const updateState = (newState: Partial<MessagingState>) => {
    setState((prev) => ({ ...prev, ...newState }))
  }

  // Create a new conversation
  const createConversation = useCallback(
    async (participantId: string, initialMessage?: string): Promise<string | null> => {
      if (!isAuthenticated || !user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to create conversations",
          variant: "destructive",
        })
        return null
      }

      if (!participantId) {
        toast({
          title: "Error",
          description: "Recipient is required",
          variant: "destructive",
        })
        return null
      }

      try {
        updateState({ isLoading: true, error: null })

        // Check if conversation already exists
        const { data: existingConversations } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id)

        if (existingConversations && existingConversations.length > 0) {
          const conversationIds = existingConversations.map((c) => c.conversation_id)

          const { data: participantConversations } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", participantId)
            .in("conversation_id", conversationIds)

          if (participantConversations && participantConversations.length > 0) {
            // Conversation already exists
            const existingConversationId = participantConversations[0].conversation_id
            updateState({ isLoading: false })
            setActiveConversation(existingConversationId)

            // Send initial message if provided
            if (initialMessage) {
              await sendMessage(initialMessage)
            }

            return existingConversationId
          }
        }

        // Create new conversation
        const { data: conversationData, error: conversationError } = await supabase
          .from("conversations")
          .insert({})
          .select()
          .single()

        if (conversationError) {
          console.error("Error creating conversation:", conversationError)
          toast({
            title: "Error",
            description: "Failed to create conversation",
            variant: "destructive",
          })
          updateState({ isLoading: false })
          return null
        }

        // Add participants
        const { error: participantsError } = await supabase.from("conversation_participants").insert([
          { conversation_id: conversationData.id, user_id: user.id },
          { conversation_id: conversationData.id, user_id: participantId },
        ])

        if (participantsError) {
          console.error("Error adding participants:", participantsError)
          toast({
            title: "Error",
            description: "Failed to add participants to conversation",
            variant: "destructive",
          })
          updateState({ isLoading: false })
          return null
        }

        // Send initial message if provided
        if (initialMessage) {
          await supabase.from("messages").insert({
            conversation_id: conversationData.id,
            sender_id: user.id,
            content: initialMessage.trim(),
            read: false,
          })
        }

        // Refresh conversations and set active conversation
        await refreshConversations()
        setActiveConversation(conversationData.id)

        updateState({ isLoading: false })
        return conversationData.id
      } catch (err) {
        console.error("Unexpected error creating conversation:", err)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
        updateState({ isLoading: false })
        return null
      }
    },
    [isAuthenticated, user, supabase, refreshConversations, setActiveConversation, sendMessage],
  )

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    try {
      updateState({ isLoading: true, error: null })

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          created_at,
          updated_at,
          conversation_participants!inner (
            user_id,
            profiles:user_id (
              id,
              display_name,
              username,
              avatar_url,
              email
            )
          )
        `)
        .or(`conversation_participants.user_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error fetching conversations:", error)
        updateState({ error: "Failed to load conversations", isLoading: false })
        return
      }

      if (!data || data.length === 0) {
        updateState({ conversations: [], isLoading: false })
        return
      }

      // Process conversations to get the last message and unread count
      const processedConversations: ConversationWithParticipants[] = await Promise.all(
        data.map(async (conv) => {
          // Get participants excluding current user
          const participants = conv.conversation_participants
            .filter((p) => p.user_id !== user.id)
            .map((p) => p.profiles)
            .filter(Boolean)

          // Get the last message
          const { data: lastMessageData } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          // Get unread count
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("read", false)
            .neq("sender_id", user.id)

          return {
            id: conv.id,
            title:
              participants.length > 0
                ? participants.map((p) => p.display_name || p.username || p.email).join(", ")
                : "No participants",
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            participants: participants,
            lastMessage: lastMessageData?.content || null,
            lastMessageTimestamp: lastMessageData?.created_at || null,
            unreadCount: count || 0,
            participantId: participants[0]?.id || null,
            participantName:
              participants[0]?.display_name || participants[0]?.username || participants[0]?.email || "Unknown User",
          }
        }),
      )

      updateState({
        conversations: processedConversations,
        isLoading: false,
      })
    } catch (err) {
      console.error("Unexpected error fetching conversations:", err)
      updateState({
        error: "An unexpected error occurred",
        isLoading: false,
      })
    }
  }, [isAuthenticated, user, supabase])

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
        updateState({ isLoading: true, error: null })

        const { data, error } = await supabase
          .from("messages")
          .select(`
            id,
            content,
            created_at,
            read,
            sender_id,
            sender:profiles!sender_id (
              display_name,
              username,
              avatar_url
            )
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Error fetching messages:", error)
          updateState({ error: "Failed to load messages", isLoading: false })
          return
        }

        // Format messages
        const formattedMessages: Message[] = (data || []).map((message) => ({
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          read: message.read,
          sender_id: message.sender_id,
          sender_name: message.sender?.display_name || message.sender?.username || "Unknown",
          sender_avatar: message.sender?.avatar_url || null,
        }))

        setState((prev) => ({
          ...prev,
          messages: {
            ...prev.messages,
            [conversationId]: formattedMessages,
          },
          isLoading: false,
        }))

        // Mark messages as read
        await markMessagesAsRead(conversationId)
      } catch (err) {
        console.error("Unexpected error fetching messages:", err)
        updateState({ error: "An unexpected error occurred", isLoading: false })
      }
    },
    [isAuthenticated, user, supabase],
  )

  // Set active conversation
  const setActiveConversation = useCallback(
    (conversationId: string | null) => {
      updateState({ activeConversation: conversationId })

      if (conversationId) {
        fetchMessages(conversationId)
      }
    },
    [fetchMessages],
  )

  // Send a message
  const sendMessage = useCallback(
    async (content: string, recipientId?: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to send messages",
          variant: "destructive",
        })
        return false
      }

      if (!content.trim()) {
        toast({
          title: "Error",
          description: "Message cannot be empty",
          variant: "destructive",
        })
        return false
      }

      try {
        updateState({ isLoading: true, error: null })

        let conversationId = state.activeConversation

        // If no active conversation but recipient ID is provided, create or find conversation
        if (!conversationId && recipientId) {
          conversationId = await createConversation(recipientId)
          if (!conversationId) {
            updateState({ isLoading: false })
            return false
          }
        }

        if (!conversationId) {
          toast({
            title: "Error",
            description: "No active conversation",
            variant: "destructive",
          })
          updateState({ isLoading: false })
          return false
        }

        // Send the message
        const { error } = await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          read: false,
        })

        if (error) {
          console.error("Error sending message:", error)
          toast({
            title: "Error",
            description: "Failed to send message",
            variant: "destructive",
          })
          updateState({ isLoading: false })
          return false
        }

        // Update conversation's updated_at timestamp
        await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId)

        // Refresh messages and conversations
        await fetchMessages(conversationId)
        await refreshConversations()

        updateState({ isLoading: false })
        return true
      } catch (err) {
        console.error("Unexpected error sending message:", err)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
        updateState({ isLoading: false })
        return false
      }
    },
    [
      isAuthenticated,
      user,
      state.activeConversation,
      supabase,
      createConversation,
      fetchMessages,
      refreshConversations,
    ],
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
          setState((prev) => {
            const conversationMessages = prev.messages[conversationId] || []
            const updatedMessages = conversationMessages.map((msg) =>
              msg.sender_id !== user.id ? { ...msg, read: true } : msg,
            )

            return {
              ...prev,
              messages: {
                ...prev.messages,
                [conversationId]: updatedMessages,
              },
              conversations: prev.conversations.map((conv) =>
                conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
              ),
            }
          })
        }
      } catch (err) {
        console.error("Unexpected error marking messages as read:", err)
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
        updateState({ isLoading: true, error: null })

        // Delete messages first (cascade doesn't always work reliably)
        const { error: messagesError } = await supabase.from("messages").delete().eq("conversation_id", conversationId)

        if (messagesError) {
          console.error("Error deleting messages:", messagesError)
          toast({
            title: "Error",
            description: "Failed to delete conversation messages",
            variant: "destructive",
          })
          updateState({ isLoading: false })
          return false
        }

        // Delete participants
        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .delete()
          .eq("conversation_id", conversationId)

        if (participantsError) {
          console.error("Error deleting participants:", participantsError)
          toast({
            title: "Error",
            description: "Failed to delete conversation participants",
            variant: "destructive",
          })
          updateState({ isLoading: false })
          return false
        }

        // Delete the conversation
        const { error: conversationError } = await supabase.from("conversations").delete().eq("id", conversationId)

        if (conversationError) {
          console.error("Error deleting conversation:", conversationError)
          toast({
            title: "Error",
            description: "Failed to delete conversation",
            variant: "destructive",
          })
          updateState({ isLoading: false })
          return false
        }

        // Update local state
        setState((prev) => ({
          ...prev,
          conversations: prev.conversations.filter((c) => c.id !== conversationId),
          activeConversation: prev.activeConversation === conversationId ? null : prev.activeConversation,
          messages: Object.fromEntries(Object.entries(prev.messages).filter(([key]) => key !== conversationId)),
          isLoading: false,
        }))

        toast({
          title: "Success",
          description: "Conversation deleted successfully",
        })

        return true
      } catch (err) {
        console.error("Unexpected error deleting conversation:", err)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
        updateState({ isLoading: false })
        return false
      }
    },
    [isAuthenticated, user, supabase],
  )

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

          if (!newMessage) return

          // Fetch sender info
          const { data: sender } = await supabase
            .from("profiles")
            .select("display_name, username, avatar_url")
            .eq("id", newMessage.sender_id)
            .single()

          const formattedMessage: Message = {
            id: newMessage.id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            read: newMessage.read || newMessage.sender_id === user.id,
            sender_id: newMessage.sender_id,
            sender_name: sender?.display_name || sender?.username || "Unknown",
            sender_avatar: sender?.avatar_url || null,
          }

          // Update messages if it's for the active conversation
          if (state.activeConversation === newMessage.conversation_id) {
            setState((prev) => ({
              ...prev,
              messages: {
                ...prev.messages,
                [newMessage.conversation_id]: [...(prev.messages[newMessage.conversation_id] || []), formattedMessage],
              },
            }))

            // Mark as read if it's not from the current user
            if (newMessage.sender_id !== user.id) {
              markMessagesAsRead(newMessage.conversation_id)
            }
          }

          // Refresh conversations to update the list with latest message
          refreshConversations()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [isAuthenticated, user, state.activeConversation, supabase, markMessagesAsRead, refreshConversations])

  // Load conversations on initial mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchConversations()
    } else {
      // Reset state when not authenticated
      setState(initialState)
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
