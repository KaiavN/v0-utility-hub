import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase-client"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Get blocked users
    const { data: blockedUsers, error: blockedError } = await supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", userId)

    if (blockedError) {
      console.error("Error fetching blocked users:", blockedError)
      return NextResponse.json({ error: blockedError.message }, { status: 500 })
    }

    const blockedUserIds = blockedUsers.map((b) => b.blocked_id)

    // Get conversations
    const { data: memberData, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .eq("user_id", userId)

    if (memberError) {
      console.error("Error fetching conversation members:", memberError)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    const conversationIds = memberData.map((m) => m.conversation_id)

    // Prepare conversation summaries
    const conversationSummaries = []

    for (const conversationId of conversationIds) {
      try {
        // Get conversation details
        const { data: conversation, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .single()

        if (convError) {
          console.error(`Error fetching conversation ${conversationId}:`, convError)
          continue
        }

        // Prepare conversation summary
        const conversationSummary = {
          id: conversationId,
          type: conversation.type,
          name: conversation.name,
          description: conversation.description,
          avatar_url: conversation.avatar_url,
          lastMessage: null,
          lastMessageTimestamp: null,
          unreadCount: 0,
        }

        // For direct chats, get the other participant
        if (conversation.type === "direct") {
          const { data: otherMember, error: otherError } = await supabase
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", conversationId)
            .neq("user_id", userId)
            .single()

          if (otherError) {
            console.error(`Error fetching other member for ${conversationId}:`, otherError)
            continue
          }

          // Skip if other participant is blocked
          if (blockedUserIds.includes(otherMember.user_id)) {
            continue
          }

          // Get participant profile
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("display_name, email, avatar_url")
            .eq("id", otherMember.user_id)
            .single()

          if (profileError && profileError.code !== "PGRST116") {
            console.error(`Error fetching profile for ${otherMember.user_id}:`, profileError)
          }

          conversationSummary.participantId = otherMember.user_id
          conversationSummary.participantName =
            profile?.display_name || profile?.email || `User ${otherMember.user_id.substring(0, 5)}`
          conversationSummary.participantAvatar = profile?.avatar_url
        }

        // Get latest message
        const { data: messages, error: msgError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(1)

        if (msgError) {
          console.error(`Error fetching messages for ${conversationId}:`, msgError)
        } else if (messages && messages.length > 0) {
          conversationSummary.lastMessage = messages[0].content
          conversationSummary.lastMessageTimestamp = messages[0].created_at
        }

        // Get unread count
        const { count, error: countError } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conversationId)
          .eq("read", false)
          .neq("sender_id", userId)

        if (countError) {
          console.error(`Error fetching unread count for ${conversationId}:`, countError)
        } else {
          conversationSummary.unreadCount = count || 0
        }

        conversationSummaries.push(conversationSummary)
      } catch (error) {
        console.error(`Error processing conversation ${conversationId}:`, error)
      }
    }

    // Sort by latest message
    conversationSummaries.sort((a, b) => {
      if (!a.lastMessageTimestamp) return 1
      if (!b.lastMessageTimestamp) return -1
      return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
    })

    return NextResponse.json({ conversations: conversationSummaries })
  } catch (error) {
    console.error("Unexpected error in conversations API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
