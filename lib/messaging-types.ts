export interface Message {
  id: string
  content: string
  created_at: string
  read: boolean
  sender_id: string
  sender_name: string
  sender_avatar: string | null
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
  username: string | null
  avatar_url: string | null
  email: string | null
}

export interface ConversationWithParticipants extends Conversation {
  participants: Profile[]
  lastMessage?: string | null
  lastMessageTimestamp?: string | null
  unreadCount?: number
  participantId?: string | null
  participantName?: string | null
}

export interface ConversationSummary {
  id: string
  title: string | null
  lastMessage: string | null
  lastMessageTime: string | null
  unreadCount: number
  participants: Profile[]
}
