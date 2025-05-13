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

    // Don't allow users to block themselves
    if (currentUserId === blockedId) {
      return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 })
    }

    // Check if the user to block exists
    const { data: userToBlock, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", blockedId)
      .single()

    if (userError || !userToBlock) {
      return NextResponse.json({ error: "User to block does not exist" }, { status: 404 })
    }

    // Add entry to blocked_users table
    const { error: blockError } = await supabase.from("blocked_users").upsert({
      blocker_id: currentUserId,
      blocked_id: blockedId,
      created_at: new Date().toISOString(),
    })

    if (blockError) {
      console.error("Error blocking user:", blockError)
      return NextResponse.json({ error: "Failed to block user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in block-user API:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
