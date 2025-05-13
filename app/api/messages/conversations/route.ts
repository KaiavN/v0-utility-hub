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

    // Get blocked users (to filter them out from results)
    const { data: blockedData } = await supabase
      .from("blocked_users")
      .select("blocked_id, blocker_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

    const blockedUserIds = new Set<string>()
    if (blockedData) {
      blockedData.forEach((block) => {
        if (block.blocker_id === userId) {
          blockedUserIds.add(block.blocked_id)
        } else if (block.blocked_id === userId) {
          blockedUserIds.add(block.blocker_id)
        }
      })
    }

    // Get all conversations where the user is a member
    const { data: memberships, error: partError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId)

    if (partError) {
      console.error("Supabase error:", partError)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    const conversationIds = memberships.map((p) => p.conversation_id)

    // Get conversation details
    const { data: conversationsData, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .in("id", conversationIds)

    if (convError) {
      console.error("Error fetching conversation details:", convError)
      return NextResponse.json({ error: "Failed to fetch conversation details" }, { status: 500 })
    }

    const conversations: ConversationSummary[] = []

    for (const conversation of conversationsData) {
      try {
        if (conversation.type === "direct") {
          // For direct conversations, get the other participant
          const { data: otherParticipant, error: partError } = await supabase
            .from("conversation_members")
            .select("user_id, profiles:user_id(display_name, email, avatar_url)")
            .eq("conversation_id", conversation.id)
            .neq("user_id", userId)
            .single()

          if (partError) {
            console.error("Error fetching other participant:", partError)
            continue
          }

          // Skip if other participant is blocked
          if (blockedUserIds.has(otherParticipant.user_id)) {
            continue
          }

          const participantName =
            otherParticipant.profiles?.display_name ||
            otherParticipant.profiles?.email ||
            `User ${otherParticipant.user_id.substring(0, 5)}`

          // Get the latest message
          const { data: latestMessages, error: msgError } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation.id)
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
            .eq("conversation_id", conversation.id)
            .eq("read", false)
            .neq("sender_id", userId)

          if (countError) {
            console.error("Error fetching unread count:", countError)
            continue
          }

          conversations.push({
            id: conversation.id,
            type: "direct",
            participantId: otherParticipant.user_id,
            participantName,
            lastMessage: latestMessages?.[0]?.content || null,
            lastMessageTimestamp: latestMessages?.[0]?.created_at || null,
            unreadCount: unreadCount || 0,
          })
        } else {
          // For group conversations
          // Get member count
          const { count: memberCount, error: memberCountError } = await supabase
            .from("conversation_members")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conversation.id)

          if (memberCountError) {
            console.error("Error fetching member count:", memberCountError)
            continue
          }

          // Get the latest message
          const { data: latestMessages, error: msgError } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversation.id)
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
            .eq("conversation_id", conversation.id)
            .eq("read", false)
            .neq("sender_id", userId)

          if (countError) {
            console.error("Error fetching unread count:", countError)
            continue
          }

          conversations.push({
            id: conversation.id,
            type: "group",
            name: conversation.name,
            description: conversation.description,
            avatar_url: conversation.avatar_url,
            memberCount: memberCount || 0,
            lastMessage: latestMessages?.[0]?.content || null,
            lastMessageTimestamp: latestMessages?.[0]?.created_at || null,
            unreadCount: unreadCount || 0,
          })
        }
      } catch (error) {
        console.error(`Error processing conversation ${conversation.id}:`, error)
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
