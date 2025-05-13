import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase-client"
import type { ConversationSummary } from "@/lib/messaging-types"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseAdmin()

    // Get all conversations where the user is a participant
    const { data: participations, error: partError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId)

    if (partError) {
      console.error("Supabase error:", partError)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    const conversationIds = participations.map((p) => p.conversation_id)

    // For each conversation, get the other participant
    const conversations: ConversationSummary[] = []

    for (const convId of conversationIds) {
      try {
        // Get the other participant
        const { data: otherParticipant, error: partError } = await supabase
          .from("conversation_participants")
          .select("user_id, profiles:user_id(display_name)")
          .eq("conversation_id", convId)
          .neq("user_id", userId)
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
          .eq("read", false)
          .neq("sender_id", userId)

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
          lastMessage: latestMessage?.content || null,
          lastMessageTimestamp: latestMessage?.created_at || null,
          unreadCount: unreadCount || 0,
        })
      } catch (error) {
        console.error(`Error processing conversation ${convId}:`, error)
        // Continue with other conversations
      }
    }

    // Sort by latest message
    conversations.sort((a, b) => {
      if (!a.lastMessageTimestamp) return 1
      if (!b.lastMessageTimestamp) return -1
      return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}
