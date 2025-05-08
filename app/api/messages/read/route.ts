import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageIds, userId } = body

    if (!messageIds || !Array.isArray(messageIds) || !userId) {
      return NextResponse.json(
        {
          error: "Message IDs array and user ID are required",
        },
        { status: 400 },
      )
    }

    const supabase = createSupabaseAdmin()

    // Update messages to mark as read
    const { error: updateError } = await supabase.from("messages").update({ read: true }).in("id", messageIds)

    if (updateError) {
      console.error("Supabase error:", updateError)
      return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 })
    }

    // Add read receipts
    const readReceipts = messageIds.map((messageId) => ({
      message_id: messageId,
      user_id: userId,
    }))

    const { error: receiptError } = await supabase.from("read_receipts").upsert(readReceipts)

    if (receiptError) {
      console.error("Supabase error:", receiptError)
      // Continue anyway as the messages are marked as read
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 })
  }
}
