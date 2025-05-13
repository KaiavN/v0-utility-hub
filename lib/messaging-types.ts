export interface Message {
  id: string
  content: string
  created_at: string
  read: boolean
  sender_id: string
  sender_name: string | null
  sender_avatar: string | null
  conversation_id: string
}

export interface Conversation {
  id: string
  type: "direct" | "group"
  name: string | null
  description: string | null
  avatar_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  is_group: boolean
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string | null
}

export interface ConversationMember {
  user_id: string
  conversation_id: string
  role: "admin" | "member"
  joined_at: string
  profile?: Profile
}

export interface ConversationWithParticipants extends Conversation {
  members: ConversationMember[]
}

export interface ConversationSummary {
  id: string
  type: "direct" | "group"
  // For direct chats
  participantId?: string
  participantName?: string
  // For group chats
  name?: string
  description?: string
  avatar_url?: string
  memberCount?: number
  // Common properties
  lastMessage: string | null
  lastMessageTimestamp: string | null
  unreadCount: number
}

// State for the messaging context
export interface MessagingState {
  conversations: ConversationSummary[]
  activeConversation: string | null
  messages: Record<string, Message[]>
  isLoading: boolean
  error: string | null
  typingUsers: Record<string, boolean>
  blockedUsers: string[]
  groupMembers: Record<string, ConversationMember[]>
}

export interface BlockedUser {
  blocker_id: string
  blocked_id: string
  blocked_user?: Profile
  created_at: string
}

export type GroupMember = ConversationMember
