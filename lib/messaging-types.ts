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
  title: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string | null
}

export interface ConversationWithParticipants extends Conversation {
  participants: Profile[]
}

export interface ConversationSummary {
  id: string
  participantId: string
  participantName: string
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
}
