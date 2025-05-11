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
  display_name: string
  avatar_url: string | null
  email: string
}

export interface ConversationWithParticipants extends Conversation {
  participants: Profile[]
}

export interface ConversationSummary {
  id: string
  title: string
  lastMessage: string | null
  lastMessageTime: string | null
  unreadCount: number
  participants: Profile[]
}
