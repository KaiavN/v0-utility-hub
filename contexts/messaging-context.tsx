"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"
import type { Message, ConversationWithParticipants } from "@/lib/messaging-types"

interface MessagingContextType {
  conversations: ConversationWithParticipants[]
  currentConversation: ConversationWithParticipants | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  selectConversation: (conversationId: string) => void
  createConversation: (participantIds: string[]) => Promise<string | null>
  refreshConversations: () => Promise<void>
  markMessagesAsRead: (conversationId: string) => Promise<void>
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([])
  const [currentConversation, setCurrentConversation] = useState<ConversationWithParticipants | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !user) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("conversation_participants")
        .select(
          `
          conversation_id,
          conversations:conversation_id (
            id,
            title,
            created_at,
            updated_at
          ),
          participants:conversation_id (
            user_id,
            profiles:user_id (
              id,
              display_name,
              avatar_url,
              email
            )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { foreignTable: "conversations", ascending: false })

      if (error) {
        console.error("Error fetching conversations:", error)
        setError("Failed to load conversations")
        return
      }

      // Process and format the conversations
      const formattedConversations: ConversationWithParticipants[] = data.map((item: any) => {
        const conversation = item.conversations
        const participants = item.participants.map((p: any) => p.profiles)

        return {
          id: conversation.id,
          title:
            conversation.title ||
            participants
              .filter((p: any) => p.id !== user.id)
              .map((p: any) => p.display_name)
              .join(", "),
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          participants: participants,
        }
      })

      setConversations(formattedConversations)
    } catch (err) {
      console.error("Unexpected error fetching conversations:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user, supabase])

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    await fetchConversations()
  }, [fetchConversations])

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated || !user) return

      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from("messages")
          .select(
            `
            id,
            content,
            created_at,
            read,
            sender_id,
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
          setError("Failed to load messages")
          return
        }

        // Format messages
        const formattedMessages: Message[] = data.map((message: any) => ({
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          read: message.read,
          sender_id: message.sender_id,
          sender_name: message.sender?.display_name || "Unknown",
          sender_avatar: message.sender?.avatar_url || null,
        }))

        setMessages(formattedMessages)
      } catch (err) {
        console.error("Unexpected error fetching messages:", err)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated, user, supabase],
  )

  // Select a conversation
  const selectConversation = useCallback(
    (conversationId: string) => {
      const conversation = conversations.find((c) => c.id === conversationId) || null
      setCurrentConversation(conversation)
      if (conversation) {
        fetchMessages(conversationId)
        markMessagesAsRead(conversationId)
      }
    },
    [conversations, fetchMessages],
  )

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!isAuthenticated || !user || !currentConversation) {
        toast({
          title: "Error",
          description: "You must be logged in and have a conversation selected to send messages",
          variant: "destructive",
        })
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const { error } = await supabase.from("messages").insert({
          conversation_id: currentConversation.id,
          sender_id: user.id,
          content,
        })

        if (error) {
          console.error("Error sending message:", error)
          toast({
            title: "Error",
            description: "Failed to send message",
            variant: "destructive",
          })
          return
        }

        // Refresh messages
        fetchMessages(currentConversation.id)
      } catch (err) {
        console.error("Unexpected error sending message:", err)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated, user, currentConversation, supabase, fetchMessages],
  )

  // Create a new conversation
  const createConversation = useCallback(
    async (participantIds: string[]): Promise<string | null> => {
      if (!isAuthenticated || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to create conversations",
          variant: "destructive",
        })
        return null
      }

      // Make sure the current user is included in participants
      if (!participantIds.includes(user.id)) {
        participantIds.push(user.id)
      }

      try {
        setIsLoading(true)
        setError(null)

        // Create the conversation
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
          return null
        }

        // Add participants
        const participantsToInsert = participantIds.map((userId) => ({
          conversation_id: conversationData.id,
          user_id: userId,
        }))

        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .insert(participantsToInsert)

        if (participantsError) {
          console.error("Error adding participants:", participantsError)
          toast({
            title: "Error",
            description: "Failed to add participants to conversation",
            variant: "destructive",
          })
          return null
        }

        // Refresh conversations
        await refreshConversations()
        return conversationData.id
      } catch (err) {
        console.error("Unexpected error creating conversation:", err)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated, user, supabase, refreshConversations],
  )

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated || !user) return

      try {
        const { error } = await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .eq("read", false)

        if (error) {
          console.error("Error marking messages as read:", error)
        }
      } catch (err) {
        console.error("Unexpected error marking messages as read:", err)
      }
    },
    [isAuthenticated, user, supabase],
  )

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const subscription = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as any

          // Only update if it's for the current conversation
          if (currentConversation && newMessage.conversation_id === currentConversation.id) {
            // Fetch the sender info
            supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("id", newMessage.sender_id)
              .single()
              .then(({ data: sender }) => {
                const formattedMessage: Message = {
                  id: newMessage.id,
                  content: newMessage.content,
                  created_at: newMessage.created_at,
                  read: newMessage.read,
                  sender_id: newMessage.sender_id,
                  sender_name: sender?.display_name || "Unknown",
                  sender_avatar: sender?.avatar_url || null,
                }

                setMessages((prev) => [...prev, formattedMessage])

                // Mark as read if it's not from the current user
                if (newMessage.sender_id !== user.id) {
                  markMessagesAsRead(currentConversation.id)
                }
              })
          }

          // Refresh conversations to update the list
          refreshConversations()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [isAuthenticated, user, currentConversation, supabase, markMessagesAsRead, refreshConversations])

  // Load conversations on initial mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations()
    }
  }, [isAuthenticated, fetchConversations])

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        isLoading,
        error,
        sendMessage,
        selectConversation,
        createConversation,
        refreshConversations,
        markMessagesAsRead,
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
