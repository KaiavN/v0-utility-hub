"use client"

import type React from "react"
import { createContext, useContext, useEffect, useCallback, useReducer, useRef } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"
import type {
  Message,
  ConversationSummary,
  MessagingState,
  ConversationMember,
  BlockedUser,
} from "@/lib/messaging-types"

// Action types for the reducer
type MessagingAction =
  | { type: "SET_CONVERSATIONS"; payload: ConversationSummary[] }
  | { type: "SET_ACTIVE_CONVERSATION"; payload: string | null }
  | { type: "SET_MESSAGES"; payload: { conversationId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_TYPING"; payload: { conversationId: string; isTyping: boolean } }
  | { type: "SET_BLOCKED_USERS"; payload: string[] }
  | { type: "SET_GROUP_MEMBERS"; payload: { conversationId: string; members: ConversationMember[] } }
  | { type: "RESET" }

// Initial state
const initialState: MessagingState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  isLoading: false,
  error: null,
  typingUsers: {},
  blockedUsers: [],
  groupMembers: {},
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
    case "SET_BLOCKED_USERS":
      return { ...state, blockedUsers: action.payload }
    case "SET_GROUP_MEMBERS":
      return {
        ...state,
        groupMembers: {
          ...state.groupMembers,
          [action.payload.conversationId]: action.payload.members,
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
  createGroupConversation: (
    name: string,
    description: string,
    avatarUrl: string | null,
    memberIds: string[],
  ) => Promise<string | null>
  refreshConversations: () => Promise<void>
  markMessagesAsRead: (conversationId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<boolean>
  setTypingStatus: (conversationId: string, isTyping: boolean) => Promise<void>
  clearError: () => void
  blockUser: (userId: string) => Promise<boolean>
  unblockUser: (userId: string) => Promise<boolean>
  getBlockedUsers: () => Promise<BlockedUser[]>
  blockedUsers: string[]
  addGroupMember: (conversationId: string, userId: string) => Promise<boolean>
  removeGroupMember: (conversationId: string, userId: string) => Promise<boolean>
  leaveGroup: (conversationId: string) => Promise<boolean>
  getGroupMembers: (conversationId: string) => Promise<ConversationMember[]>
  isGroupAdmin: (conversationId: string) => boolean
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [state, dispatch] = useReducer(messagingReducer, initialState)
  const supabase = createSupabaseClient()

  // useRef to hold the latest refreshConversations function
  // This is to avoid the "use before declaration" error
  const refreshConversationsRef = useRef(null)

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null })
  }, [])

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

  // Fetch blocked users
  const fetchBlockedUsers = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      return []
    }

    try {
      const { data, error } = await supabase.from("blocked_users").select("blocked_id").eq("blocker_id", user.id)

      if (error) {
        console.error("Error fetching blocked users:", error)
        return []
      }

      const blockedIds = data.map((b) => b.blocked_id)
      dispatch({ type: "SET_BLOCKED_USERS", payload: blockedIds })
      return blockedIds
    } catch (err) {
      console.error("Unexpected error fetching blocked users:", err)
      return []
    }
  }, [isAuthenticated, user, supabase])

  // Block a user
  const blockUser = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) return false

      try {
        // Insert into blocked_users table
        const { error } = await supabase.from("blocked_users").insert({
          blocker_id: user.id,
          blocked_id: userId,
        })

        if (error) {
          console.error("Error blocking user:", error)
          toast({
            title: "Error",
            description: "Failed to block user. Please try again.",
            variant: "destructive",
          })
          return false
        }

        // Update local state
        const updatedBlockedUsers = [...state.blockedUsers, userId]
        dispatch({ type: "SET_BLOCKED_USERS", payload: updatedBlockedUsers })

        // If this was the active conversation, clear it
        if (
          state.activeConversation &&
          state.conversations.find(
            (c) => c.id === state.activeConversation && c.type === "direct" && c.participantId === userId,
          )
        ) {
          dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: null })
        }

        // Refresh conversations to hide blocked user conversations
        await refreshConversationsRef.current()
        return true
      } catch (err) {
        console.error("Unexpected error blocking user:", err)
        return false
      }
    },
    [isAuthenticated, user, supabase, state.blockedUsers, state.activeConversation, state.conversations],
  )

  // Unblock a user
  const unblockUser = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) return false

      try {
        // Delete from blocked_users table
        const { error } = await supabase
          .from("blocked_users")
          .delete()
          .eq("blocker_id", user.id)
          .eq("blocked_id", userId)

        if (error) {
          console.error("Error unblocking user:", error)
          toast({
            title: "Error",
            description: "Failed to unblock user. Please try again.",
            variant: "destructive",
          })
          return false
        }

        // Update local state
        const updatedBlockedUsers = state.blockedUsers.filter((id) => id !== userId)
        dispatch({ type: "SET_BLOCKED_USERS", payload: updatedBlockedUsers })

        // Refresh conversations to show unblocked user conversations
        await refreshConversationsRef.current()
        return true
      } catch (err) {
        console.error("Unexpected error unblocking user:", err)
        return false
      }
    },
    [isAuthenticated, user, supabase, state.blockedUsers],
  )

  // Get detailed blocked users
  const getBlockedUsers = useCallback(async (): Promise<BlockedUser[]> => {
    if (!isAuthenticated || !user?.id) return []

    try {
      const { data, error } = await supabase
        .from("blocked_users")
        .select(`
          blocker_id,
          blocked_id,
          created_at,
          blocked_user:blocked_id (
            id,
            display_name,
            avatar_url,
            email
          )
        `)
        .eq("blocker_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching blocked users:", error)
        return []
      }

      return data as BlockedUser[]
    } catch (err) {
      console.error("Unexpected error fetching blocked users:", err)
      return []
    }
  }, [isAuthenticated, user, supabase])

  // Create a group conversation
  const createGroupConversation = useCallback(
    async (
      name: string,
      description: string,
      avatarUrl: string | null,
      memberIds: string[],
    ): Promise<string | null> => {
      if (!isAuthenticated || !user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to create a group",
          variant: "destructive",
        })
        return null
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true })
        clearError()

        // Call the create_group_chat function
        const { data, error } = await supabase.rpc("create_group_chat", {
          group_name: name,
          group_description: description,
          avatar_url: avatarUrl,
          member_ids: memberIds,
        })

        if (error) {
          console.error("Error creating group:", error)
          throw new Error(error.message)
        }

        const conversationId = data

        // Refresh conversations
        await refreshConversationsRef.current()

        // Set this as the active conversation
        dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: conversationId })

        return conversationId
      } catch (err) {
        console.error("Error creating group conversation:", err)
        dispatch({
          type: "SET_ERROR",
          payload: err instanceof Error ? err.message : "Failed to create group",
        })
        toast({
          title: "Error",
          description: "Failed to create group. Please try again.",
          variant: "destructive",
        })
        return null
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },
    [isAuthenticated, user, supabase, clearError],
  )

  // Get group members
  const getGroupMembers = useCallback(
    async (conversationId: string): Promise<ConversationMember[]> => {
      if (!isAuthenticated || !user?.id) return []

      // Check if we already have the members in state
      if (state.groupMembers[conversationId]) {
        return state.groupMembers[conversationId]
      }

      try {
        const { data, error } = await supabase
          .from("conversation_members")
          .select(`
          user_id,
          conversation_id,
          role,
          joined_at,
          profile:user_id (
            id,
            display_name,
            avatar_url,
            email
          )
        `)
          .eq("conversation_id", conversationId)
          .order("role", { ascending: false }) // Admins first
          .order("joined_at", { ascending: true })

        if (error) {
          console.error("Error fetching group members:", error)
          return []
        }

        const members = data as ConversationMember[]

        // Store in state
        dispatch({
          type: "SET_GROUP_MEMBERS",
          payload: { conversationId, members },
        })

        return members
      } catch (err) {
        console.error("Unexpected error fetching group members:", err)
        return []
      }
    },
    [isAuthenticated, user, supabase, state.groupMembers],
  )

  // Check if user is a group admin
  const isGroupAdmin = useCallback(
    (conversationId: string): boolean => {
      if (!conversationId || !user?.id) return false

      // Check if we have the members in state
      const members = state.groupMembers[conversationId] || []
      const userMember = members.find((m) => m.user_id === user.id)
      return userMember?.role === "admin"
    },
    [user, state.groupMembers],
  )

  // Add a member to a group
  const addGroupMember = useCallback(
    async (conversationId: string, userId: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) return false

      try {
        // Check if user is admin
        if (!isGroupAdmin(conversationId)) {
          toast({
            title: "Error",
            description: "Only group admins can add members",
            variant: "destructive",
          })
          return false
        }

        // Add member
        const { error } = await supabase.from("conversation_members").insert({
          conversation_id: conversationId,
          user_id: userId,
        })

        if (error) {
          console.error("Error adding group member:", error)
          toast({
            title: "Error",
            description: "Failed to add member to group. Please try again.",
            variant: "destructive",
          })
          return false
        }

        // Refresh members
        await getGroupMembers(conversationId)
        return true
      } catch (err) {
        console.error("Unexpected error adding group member:", err)
        return false
      }
    },
    [isAuthenticated, user, supabase, isGroupAdmin, getGroupMembers],
  )

  // Remove a member from a group
  const removeGroupMember = useCallback(
    async (conversationId: string, userId: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) return false

      try {
        // Check if user is admin or removing self
        if (!isGroupAdmin(conversationId) && userId !== user.id) {
          toast({
            title: "Error",
            description: "Only group admins can remove members",
            variant: "destructive",
          })
          return false
        }

        // Remove member
        const { error } = await supabase
          .from("conversation_members")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("user_id", userId)

        if (error) {
          console.error("Error removing group member:", error)
          toast({
            title: "Error",
            description: "Failed to remove member from group. Please try again.",
            variant: "destructive",
          })
          return false
        }

        // If removing self, set active conversation to null
        if (userId === user.id) {
          dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: null })
          await refreshConversationsRef.current()
        } else {
          // Refresh members
          await getGroupMembers(conversationId)
        }

        return true
      } catch (err) {
        console.error("Unexpected error removing group member:", err)
        return false
      }
    },
    [isAuthenticated, user, supabase, isGroupAdmin, getGroupMembers],
  )

  // Leave a group
  const leaveGroup = useCallback(
    async (conversationId: string): Promise<boolean> => {
      if (!isAuthenticated || !user?.id) return false

      return removeGroupMember(conversationId, user.id)
    },
    [isAuthenticated, user, removeGroupMember],
  )

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true })
      clearError()

      // First get blocked users
      const blockedUserIds = await fetchBlockedUsers()

      // Get conversations
      const { data: conversations, error: conversationsError } = await supabase
        .from("conversation_members")
        .select(`
          conversation:conversation_id (
            id,
            type,
            name,
            description,
            avatar_url,
            created_by
          ),
          user_id
        `)
        .eq("user_id", user.id)

      if (conversationsError) {
        console.error("Error fetching conversations:", conversationsError)
        dispatch({ type: "SET_ERROR", payload: conversationsError.message })
        return
      }

      // Prepare a list of unique conversation IDs
      const conversationIds = conversations.map((c) => c.conversation.id)

      // For each conversation ID, get the last message and unread count
      const conversationSummaries: ConversationSummary[] = []

      for (const conversationId of conversationIds) {
        try {
          // Get the conversation details
          const { data: conversationData, error: convError } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", conversationId)
            .single()

          if (convError) {
            console.error(`Error fetching conversation ${conversationId}:`, convError)
            continue
          }

          const conversation = conversationData

          // Handle different conversation types
          const conversationSummary: Partial<ConversationSummary> = {
            id: conversationId,
            type: conversation.type as "direct" | "group",
            lastMessage: null,
            lastMessageTimestamp: null,
            unreadCount: 0,
          }

          // For direct chats, get the other participant
          if (conversation.type === "direct") {
            // Get the other participant
            const { data: otherParticipant, error: partError } = await supabase
              .from("conversation_members")
              .select("user_id, profiles:user_id(display_name, email)")
              .eq("conversation_id", conversationId)
              .neq("user_id", user.id)
              .single()

            if (partError) {
              console.error(`Error fetching other participant for ${conversationId}:`, partError)
              continue
            }

            // Skip if other participant is blocked
            if (blockedUserIds.includes(otherParticipant.user_id)) {
              continue
            }

            conversationSummary.participantId = otherParticipant.user_id
            conversationSummary.participantName =
              otherParticipant.profiles?.display_name ||
              otherParticipant.profiles?.email ||
              `User ${otherParticipant.user_id.substring(0, 5)}`
          } else {
            // For group chats, use the group name
            conversationSummary.name = conversation.name
            conversationSummary.description = conversation.description
            conversationSummary.avatar_url = conversation.avatar_url
          }

          // Get the latest message
          const { data: latestMessages, error: msgError } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false })
            .limit(1)

          if (msgError) {
            console.error(`Error fetching latest message for ${conversationId}:`, msgError)
          } else if (latestMessages && latestMessages.length > 0) {
            conversationSummary.lastMessage = latestMessages[0].content
            conversationSummary.lastMessageTimestamp = latestMessages[0].created_at
          }

          // Get unread count
          const { count: unreadCount, error: countError } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conversationId)
            .eq("read", false)
            .neq("sender_id", user.id)

          if (countError) {
            console.error(`Error fetching unread count for ${conversationId}:`, countError)
          } else {
            conversationSummary.unreadCount = unreadCount || 0
          }

          conversationSummaries.push(conversationSummary as ConversationSummary)
        } catch (error) {
          console.error(`Error processing conversation ${conversationId}:`, error)
          // Continue with other conversations
        }
      }

      // Sort by latest message
      conversationSummaries.sort((a, b) => {
        if (!a.lastMessageTimestamp) return 1
        if (!b.lastMessageTimestamp) return -1
        return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
      })

      dispatch({ type: "SET_CONVERSATIONS", payload: conversationSummaries })
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
  }, [isAuthenticated, user, supabase, clearError, fetchBlockedUsers])

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    await fetchConversations()
  }, [fetchConversations])

  // Assign refreshConversations to the ref
  useEffect(() => {
    refreshConversationsRef.current = refreshConversations
  }, [refreshConversations])

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (conversationId: string) => {
      if (!isAuthenticated || !user?.id || !conversationId) {
        return
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true })
        clearError()

        // Get conversation type
        const { data: conversationData, error: convError } = await supabase
          .from("conversations")
          .select("type")
          .eq("id", conversationId)
          .single()

        if (convError) {
          console.error("Error fetching conversation type:", convError)
          dispatch({ type: "SET_ERROR", payload: convError.message })
          return
        }

        // Fetch messages
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

        // If it's a group chat, fetch members
        if (conversationData.type === "group") {
          await getGroupMembers(conversationId)
        }
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
    [isAuthenticated, user, supabase, clearError, getGroupMembers],
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
        refreshConversationsRef.current()
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
    [isAuthenticated, user, state.activeConversation, supabase, clearError, setTypingStatus],
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

      // Don't create conversation with blocked users
      if (state.blockedUsers.includes(participantId)) {
        toast({
          title: "Error",
          description: "You cannot message a blocked user. Unblock them first.",
          variant: "destructive",
        })
        return null
      }

      try {
        dispatch({ type: "SET_LOADING", payload: true })
        clearError()

        // Check if conversation already exists
        const { data: existingConversations, error: checkError } = await supabase
          .from("conversation_members")
          .select("conversation_id")
          .eq("user_id", user.id)
          .in(
            "conversation_id",
            supabase.from("conversation_members").select("conversation_id").eq("user_id", participantId),
          )

        if (checkError) {
          console.error("Error checking existing conversations:", checkError)
          throw new Error(checkError.message)
        }

        // Filter to only direct conversations
        let existingConversationId = null
        if (existingConversations && existingConversations.length > 0) {
          for (const conv of existingConversations) {
            const { data: convData } = await supabase
              .from("conversations")
              .select("id, type")
              .eq("id", conv.conversation_id)
              .eq("type", "direct")
              .single()

            if (convData) {
              existingConversationId = convData.id
              break
            }
          }
        }

        // If conversation exists, return it
        if (existingConversationId) {
          // If there's an initial message, send it
          if (initialMessage) {
            await sendMessage(initialMessage, existingConversationId)
          }

          return existingConversationId
        }

        // Create the conversation
        const { data: conversationData, error: conversationError } = await supabase
          .from("conversations")
          .insert({
            type: "direct",
          })
          .select()
          .single()

        if (conversationError) {
          console.error("Error creating conversation:", conversationError)
          throw new Error(conversationError.message)
        }

        // Add participants
        const membersToInsert = [
          { conversation_id: conversationData.id, user_id: user.id },
          { conversation_id: conversationData.id, user_id: participantId },
        ]

        const { error: participantsError } = await supabase.from("conversation_members").insert(membersToInsert)

        if (participantsError) {
          console.error("Error adding participants:", participantsError)
          throw new Error(participantsError.message)
        }

        // If there's an initial message, send it
        if (initialMessage) {
          await sendMessage(initialMessage, conversationData.id)
        }

        // Refresh conversations
        await refreshConversationsRef.current()
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
    [isAuthenticated, user, supabase, sendMessage, clearError, state.blockedUsers],
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
          refreshConversationsRef.current()
        }
      } catch (err) {
        console.error("Unexpected error marking messages as read:", err)
      }
    },
    [isAuthenticated, user, supabase, state.messages],
  )

  // Set typing status - DEPRECATED
  // const setTypingStatus = useCallback(
  //   async (conversationId: string, isTyping: boolean) => {
  //     if (!isAuthenticated || !user?.id || !conversationId) {
  //       return
  //     }

  //     try {
  //       // Update typing status in the database
  //       const { error } = await supabase.rpc("update_typing_status", {
  //         p_conversation_id: conversationId,
  //         p_user_id: user.id,
  //         p_is_typing: isTyping,
  //       })

  //       if (error) {
  //         console.error("Error updating typing status:", error)
  //       }
  //     } catch (err) {
  //       console.error("Unexpected error updating typing status:", err)
  //     }
  //   },
  //   [isAuthenticated, user, supabase],
  // )

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

        // Check if it's a group or direct conversation
        const { data: conversation, error: convError } = await supabase
          .from("conversations")
          .select("type")
          .eq("id", conversationId)
          .single()

        if (convError) {
          console.error("Error checking conversation type:", convError)
          throw new Error(convError.message)
        }

        if (conversation.type === "group") {
          // For groups, we just remove the user from the group
          return leaveGroup(conversationId)
        }

        // For direct conversations, delete everything
        // First delete all messages in the conversation
        const { error: messagesError } = await supabase.from("messages").delete().eq("conversation_id", conversationId)

        if (messagesError) {
          console.error("Error deleting messages:", messagesError)
          throw new Error(messagesError.message)
        }

        // Then delete the participants
        const { error: participantsError } = await supabase
          .from("conversation_members")
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
    [isAuthenticated, user, supabase, state.activeConversation, state.conversations, clearError, leaveGroup],
  )

  // Reset state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: "RESET" })
    }
  }, [isAuthenticated])

  // Load blocked users on initial mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchBlockedUsers()
    }
  }, [isAuthenticated, user, fetchBlockedUsers])

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return

    let subscription
    try {
      subscription = supabase
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

            // Skip messages from blocked users
            if (state.blockedUsers.includes(newMessage.sender_id)) {
              return
            }

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
            refreshConversationsRef.current()
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
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "blocked_users",
          },
          async (payload) => {
            if (payload.new.blocker_id === user.id || payload.new.blocked_id === user.id) {
              await fetchBlockedUsers()
              await refreshConversationsRef.current()
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "blocked_users",
          },
          async (payload) => {
            if (payload.old.blocker_id === user.id || payload.old.blocked_id === user.id) {
              await fetchBlockedUsers()
              await refreshConversationsRef.current()
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversation_members",
          },
          async (payload) => {
            // Refresh conversations if there's any change to conversation members
            await refreshConversationsRef.current()

            // If this is the active conversation, refresh group members
            if (
              state.activeConversation === payload.new?.conversation_id ||
              state.activeConversation === payload.old?.conversation_id
            ) {
              const conversationId = state.activeConversation
              if (conversationId) {
                await getGroupMembers(conversationId)
              }
            }
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.warn("Supabase realtime channel error. Falling back to polling.")
            // Set up polling as fallback
            const pollingInterval = setInterval(() => {
              if (state.activeConversation) {
                fetchMessages(state.activeConversation)
              }
              refreshConversationsRef.current()
            }, 10000) // Poll every 10 seconds

            return () => clearInterval(pollingInterval)
          }
        })
    } catch (error) {
      console.error("Error setting up realtime subscription:", error)
      // Set up polling as fallback
      const pollingInterval = setInterval(() => {
        if (state.activeConversation) {
          fetchMessages(state.activeConversation)
        }
        refreshConversationsRef.current()
      }, 10000) // Poll every 10 seconds

      return () => clearInterval(pollingInterval)
    }

    return () => {
      if (subscription) {
        try {
          supabase.removeChannel(subscription)
        } catch (error) {
          console.error("Error removing channel:", error)
        }
      }
    }
  }, [
    isAuthenticated,
    user,
    supabase,
    state.activeConversation,
    state.blockedUsers,
    markMessagesAsRead,
    fetchBlockedUsers,
    getGroupMembers,
    fetchMessages,
  ])

  // Load conversations on initial mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchConversations()
    }
  }, [isAuthenticated, user])

  return (
    <MessagingContext.Provider
      value={{
        state,
        sendMessage,
        setActiveConversation,
        createConversation,
        createGroupConversation,
        refreshConversations: refreshConversationsRef.current,
        markMessagesAsRead,
        deleteConversation,
        setTypingStatus,
        clearError,
        blockUser,
        unblockUser,
        getBlockedUsers,
        blockedUsers: state.blockedUsers,
        addGroupMember,
        removeGroupMember,
        leaveGroup,
        getGroupMembers,
        isGroupAdmin,
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
