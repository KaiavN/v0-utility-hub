import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-client"

export async function POST(request: Request) {
  try {
    const { blockedId } = await request.json()

    if (!blockedId) {
      return NextResponse.json({ error: "Missing blockedId parameter" }, { status: 400 })
    }

    const supabase = createClient()

    // First check if the user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Delete the blocked_users entry
    const { error: unblockError } = await supabase
      .from("blocked_users")
      .delete()
      .eq("blocker_id", currentUserId)
      .eq("blocked_id", blockedId)

    if (unblockError) {
      console.error("Error unblocking user:", unblockError)
      return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in unblock-user API:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
