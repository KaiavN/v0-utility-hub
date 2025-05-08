// Define the Message type
export interface Message {
  id: string
  senderId: string
  senderName: string
  recipientId: string
  recipientName: string
  content: string
  timestamp: string
  read: boolean
}

// Define the Conversation type
export interface Conversation {
  id: string
  participantId: string
  participantName: string
  lastMessage?: string
  lastMessageTimestamp?: string
  unreadCount: number
}

// Define the MessagingState type
export interface MessagingState {
  conversations: Conversation[]
  activeConversation: string | null
  messages: Record<string, Message[]>
  isLoading: boolean
  error: Error | null
}
