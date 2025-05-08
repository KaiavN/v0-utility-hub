import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase-client"
import type { Message } from "@/lib/messaging-types"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, content, senderId, senderName } = body

    if (!recipientId || !content || !senderId || !senderName) {
      return NextResponse.json(
        {
          error: "Recipient ID, sender ID, sender name, and content are required",
        },
        { status: 400 },
      )
    }

    // Create conversation ID (sorted user IDs to ensure consistency)
    const participants = [senderId, recipientId].sort()
    const conversationId = `conv_${participants.join("_")}`

    const supabase = createSupabaseAdmin()

    // Check if conversation exists, if not create it
    const { data: existingConv } = await supabase.from("conversations").select("id").eq("id", conversationId).single()

    if (!existingConv) {
      // Create conversation
      await supabase.from("conversations").insert({ id: conversationId })

      // Add participants
      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: senderId },
        { conversation_id: conversationId, user_id: recipientId },
      ])
    }

    // Create message ID
    const messageId = `msg_${uuidv4()}`

    // Insert message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        id: messageId,
        conversation_id: conversationId,
        sender_id: senderId,
        sender_name: senderName,
        content,
        read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    // Format the response
    const newMessage: Message = {
      id: message.id,
      senderId: message.sender_id,
      senderName: message.sender_name,
      recipientId,
      recipientName: "", // This will be filled in by the client
      content: message.content,
      timestamp: message.created_at,
      read: message.read,
    }

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
