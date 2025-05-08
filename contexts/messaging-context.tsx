"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import type { Message, Conversation, MessagingState } from "@/lib/messaging-types"
import { toast } from "@/components/ui/use-toast"
import { createSupabaseClient } from "@/lib/supabase-client"
import { v4 as uuidv4 } from "uuid"

// Initial state
const initialState: MessagingState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  isLoading: false,
  error: null,
}

// Action types
type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: Error | null }
  | { type: "SET_CONVERSATIONS"; payload: Conversation[] }
  | { type: "ADD_CONVERSATION"; payload: Conversation }
  | { type: "SET_ACTIVE_CONVERSATION"; payload: string | null }
  | { type: "SET_MESSAGES"; payload: { conversationId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: { conversationId: string; message: Message } }
  | { type: "MARK_AS_READ"; payload: { conversationId: string; messageIds: string[] } }

// Reducer function
function messagingReducer(state: MessagingState, action: Action): MessagingState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.payload }
    case "ADD_CONVERSATION":
      // Check if conversation already exists
      if (state.conversations.some((conv) => conv.id === action.payload.id)) {
        return state
      }
      return { ...state, conversations: [...state.conversations, action.payload] }
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
      const conversationId = action.payload.conversationId
      const existingMessages = state.messages[conversationId] || []

      // Check if message already exists
      if (existingMessages.some((msg) => msg.id === action.payload.message.id)) {
        return state
      }

      // Update conversations with last message info
      const updatedConversations = state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: action.payload.message.content,
            lastMessageTimestamp: action.payload.message.timestamp,
            unreadCount:
              action.payload.message.senderId !== state.activeConversation ? conv.unreadCount + 1 : conv.unreadCount,
          }
        }
        return conv
      })

      return {
        ...state,
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, action.payload.message],
        },
        conversations: updatedConversations,
      }
    case "MARK_AS_READ":
      const { conversationId: convId, messageIds } = action.payload
      const messages = state.messages[convId] || []

      // Update read status of messages
      const updatedMessages = messages.map((msg) => (messageIds.includes(msg.id) ? { ...msg, read: true } : msg))

      // Update unread count in conversation
      const updatedConvs = state.conversations.map((conv) => (conv.id === convId ? { ...conv, unreadCount: 0 } : conv))

      return {
        ...state,
        messages: {
          ...state.messages,
          [convId]: updatedMessages,
        },
        conversations: updatedConvs,
      }
    default:
      return state
  }
}

// Create context
interface MessagingContextType {
  state: MessagingState
  sendMessage: (recipientId: string, content: string) => Promise<void>
  loadConversations: () => Promise<void>
  loadMessages: (conversationId: string) => Promise<void>
  setActiveConversation: (conversationId: string | null) => void
  markAsRead: (conversationId: string, messageIds: string[]) => Promise<void>
  startNewConversation: (recipientId: string, recipientName: string) => void
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

// Provider component
export function MessagingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(messagingReducer, initialState)
  const { user, isAuthenticated } = useAuth()
  const supabase = createSupabaseClient()

  // Load conversations on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations()

      // Set up real-time subscription for new messages
      const messagesSubscription = supabase
        .channel("public:messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            // Handle new message
            if (payload.new) {
              const newMessage = {
                id: payload.new.id,
                senderId: payload.new.sender_id,
                senderName: user.displayName,
                recipientId: user.id,
                recipientName: user.displayName,
                content: payload.new.content,
                timestamp: payload.new.created_at,
                read: false,
              }

              // Get conversation ID
              const conversationId = payload.new.conversation_id

              // Add message to state
              dispatch({
                type: "ADD_MESSAGE",
                payload: { conversationId, message: newMessage },
              })

              // If this is a new conversation, add it to the list
              if (!state.conversations.some((conv) => conv.id === conversationId)) {
                // We need to fetch the conversation details
                loadConversations()
              }

              // If this is the active conversation, mark as read
              if (state.activeConversation === conversationId) {
                markAsRead(conversationId, [newMessage.id])
              } else {
                // Show notification
                toast({
                  title: `New message from ${newMessage.senderName}`,
                  description:
                    newMessage.content.length > 50 ? `${newMessage.content.substring(0, 50)}...` : newMessage.content,
                })
              }
            }
          },
        )
        .subscribe()

      return () => {
        // Clean up subscription
        supabase.removeChannel(messagesSubscription)
      }
    }
  }, [isAuthenticated, user])

  // Load conversations from Supabase
  const loadConversations = async () => {
    if (!user) return

    dispatch({ type: "SET_LOADING", payload: true })

    try {
      // Get all conversations where the user is a participant
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id)

      if (partError) {
        throw partError
      }

      if (!participations || participations.length === 0) {
        dispatch({ type: "SET_CONVERSATIONS", payload: [] })
        dispatch({ type: "SET_LOADING", payload: false })
        return
      }

      const conversationIds = participations.map((p) => p.conversation_id)
      const conversations: Conversation[] = []

      for (const convId of conversationIds) {
        // Get the other participant
        const { data: otherParticipant, error: partError } = await supabase
          .from("conversation_participants")
          .select("user_id, profiles:user_id(display_name)")
          .eq("conversation_id", convId)
          .neq("user_id", user.id)
          .single()

        if (partError) {
          console.error("Error fetching other participant:", partError)
          continue
        }

        if (!otherParticipant) continue

        // Get the latest message
        const { data: latestMessages, error: msgError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: false })
          .limit(1)

        if (msgError) {
          console.error("Error fetching latest message:", msgError)
          continue
        }

        // Get unread count
        const { count: unreadCount, error: countError } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", convId)
          .eq("sender_id", otherParticipant.user_id)
          .eq("read", false)

        if (countError) {
          console.error("Error fetching unread count:", countError)
          continue
        }

        const participantName =
          otherParticipant.profiles?.display_name || `User ${otherParticipant.user_id.substring(0, 5)}`
        const latestMessage = latestMessages && latestMessages[0]

        conversations.push({
          id: convId,
          participantId: otherParticipant.user_id,
          participantName,
          lastMessage: latestMessage?.content,
          lastMessageTimestamp: latestMessage?.created_at,
          unreadCount: unreadCount || 0,
        })
      }

      // Sort by latest message
      conversations.sort((a, b) => {
        if (!a.lastMessageTimestamp) return 1
        if (!b.lastMessageTimestamp) return -1
        return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
      })

      dispatch({ type: "SET_CONVERSATIONS", payload: conversations })
    } catch (error) {
      console.error("Error loading conversations:", error)
      dispatch({ type: "SET_ERROR", payload: error as Error })
      toast({
        title: "Error",
        description: "Failed to load conversations. Please try again.",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  // Load messages for a specific conversation
  const loadMessages = async (conversationId: string) => {
    if (!user || !conversationId) return

    try {
      // Get messages from Supabase
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*, sender:sender_id(display_name)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) {
        throw error
      }

      if (!messages) {
        dispatch({
          type: "SET_MESSAGES",
          payload: { conversationId, messages: [] },
        })
        return
      }

      // Format messages
      const formattedMessages: Message[] = messages.map((msg) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender?.display_name || "Unknown User",
        recipientId: user.id !== msg.sender_id ? user.id : "", // This is simplified
        recipientName: user.displayName,
        content: msg.content,
        timestamp: msg.created_at,
        read: msg.read,
      }))

      dispatch({
        type: "SET_MESSAGES",
        payload: { conversationId, messages: formattedMessages },
      })

      // Mark unread messages as read if this is the active conversation
      if (state.activeConversation === conversationId) {
        const unreadMessages = formattedMessages
          .filter((msg) => !msg.read && msg.senderId !== user.id)
          .map((msg) => msg.id)

        if (unreadMessages.length > 0) {
          markAsRead(conversationId, unreadMessages)
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      dispatch({ type: "SET_ERROR", payload: error as Error })
    }
  }

  // Send a new message
  const sendMessage = async (recipientId: string, content: string) => {
    if (!user || !content.trim()) return

    // Check if conversation exists
    let conversationId: string | null = null

    // Look for existing conversation
    const existingConversation = state.conversations.find((conv) => conv.participantId === recipientId)

    if (existingConversation) {
      conversationId = existingConversation.id
    } else {
      // Create a new conversation ID
      conversationId = uuidv4()
    }

    // Get recipient info
    const { data: recipient, error: recipientError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", recipientId)
      .single()

    if (recipientError && recipientError.code !== "PGRST116") {
      console.error("Error fetching recipient:", recipientError)
    }

    const recipientName =
      recipient?.display_name ||
      state.conversations.find((c) => c.participantId === recipientId)?.participantName ||
      "User"

    // Create optimistic message
    const optimisticId = `temp_${Date.now()}`

    // Create optimistic message
    const newMessage: Message = {
      id: optimisticId,
      senderId: user.id,
      senderName: user.displayName,
      recipientId,
      recipientName,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    }

    // Add message optimistically
    dispatch({
      type: "ADD_MESSAGE",
      payload: { conversationId, message: newMessage },
    })

    try {
      // Check if conversation exists in Supabase
      if (!existingConversation) {
        // Create new conversation
        const { error: createConvError } = await supabase.from("conversations").insert([{ id: conversationId }])

        if (createConvError) {
          console.error("Error creating conversation:", createConvError)
          throw createConvError
        }

        // Add participants
        const participantsToAdd = [
          { conversation_id: conversationId, user_id: user.id },
          { conversation_id: conversationId, user_id: recipientId },
        ]

        const { error: addParticipantsError } = await supabase
          .from("conversation_participants")
          .insert(participantsToAdd)

        if (addParticipantsError) {
          console.error("Error adding participants:", addParticipantsError)
          throw addParticipantsError
        }
      }

      // Send message to Supabase
      const { data: messageData, error: sendError } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            content,
          },
        ])
        .select()
        .single()

      if (sendError) {
        console.error("Error sending message:", sendError)
        throw sendError
      }

      if (!messageData) {
        throw new Error("No message data returned")
      }

      // Replace optimistic message with real one
      const serverMessage: Message = {
        id: messageData.id,
        senderId: messageData.sender_id,
        senderName: user.displayName,
        recipientId,
        recipientName,
        content: messageData.content,
        timestamp: messageData.created_at,
        read: messageData.read,
      }

      // Update state with server message
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          conversationId,
          message: serverMessage,
        },
      })

      // Ensure conversation exists in the list
      if (!state.conversations.some((conv) => conv.id === conversationId)) {
        startNewConversation(recipientId, recipientName)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Mark messages as read
  const markAsRead = async (conversationId: string, messageIds: string[]) => {
    if (!user || messageIds.length === 0) return

    dispatch({
      type: "MARK_AS_READ",
      payload: { conversationId, messageIds },
    })

    try {
      // Update messages in Supabase
      const { error } = await supabase.from("messages").update({ read: true }).in("id", messageIds)

      if (error) {
        console.error("Error marking messages as read:", error)
        throw error
      }
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  // Set active conversation
  const setActiveConversation = (conversationId: string | null) => {
    dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: conversationId })

    if (conversationId) {
      loadMessages(conversationId)
    }
  }

  // Start a new conversation
  const startNewConversation = (recipientId: string, recipientName: string) => {
    if (!user) return

    // Check if conversation already exists
    const existingConversation = state.conversations.find((conv) => conv.participantId === recipientId)

    if (existingConversation) {
      dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: existingConversation.id })
      return
    }

    // Create a new conversation ID
    const conversationId = uuidv4()

    const newConversation: Conversation = {
      id: conversationId,
      participantId: recipientId,
      participantName: recipientName,
      unreadCount: 0,
    }

    dispatch({ type: "ADD_CONVERSATION", payload: newConversation })
    dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: conversationId })
  }

  return (
    <MessagingContext.Provider
      value={{
        state,
        sendMessage,
        loadConversations,
        loadMessages,
        setActiveConversation,
        markAsRead,
        startNewConversation,
      }}
    >
      {children}
    </MessagingContext.Provider>
  )
}

// Custom hook to use the messaging context
export function useMessaging() {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error("useMessaging must be used within a MessagingProvider")
  }
  return context
}
