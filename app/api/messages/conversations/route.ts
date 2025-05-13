import { createSupabaseServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServerClient()

    // Return empty conversations array for now to prevent loading issues
    return NextResponse.json({ conversations: [] })

    // Original code commented out
    /*
    // Get all conversations where the user is a participant
    const { data: participations, error: participationsError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId)

    if (participationsError) {
      console.error("Error fetching participations:", participationsError)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    const conversationIds = participations.map((p) => p.conversation_id)

    // Get conversation details with participants
    const { data: conversations, error: conversationsError } = await supabase
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
            avatar_url,
            email
          )
        )
      `)
      .in("id", conversationIds)
      .order("updated_at", { ascending: false })

    if (conversationsError) {
      console.error("Error fetching conversations:", conversationsError)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    // Format conversations for the client
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Find the other participant (not the current user)
        const otherParticipant = conversation.conversation_participants.find(
          (p) => p.user_id !== userId
        )?.profiles

        if (!otherParticipant) {
          console.error("Could not find other participant for conversation:", conversation.id)
          return null
        }

        // Get the last message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        // Count unread messages
        const { count: unreadCount, error: countError } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conversation.id)
          .eq("read", false)
          .neq("sender_id", userId)

        if (countError) {
          console.error("Error counting unread messages:", countError)
        }

        return {
          id: conversation.id,
          participantId: otherParticipant.id,
          participantName: otherParticipant.display_name || otherParticipant.email || "Unknown User",
          lastMessage: lastMessage?.content || null,
          lastMessageTimestamp: lastMessage?.created_at || null,
          unreadCount: unreadCount || 0,
        }
      })
    )

    // Filter out any null values
    const validConversations = formattedConversations.filter(Boolean)

    return NextResponse.json({ conversations: validConversations })
    */
  } catch (error) {
    console.error("Unexpected error in conversations API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
