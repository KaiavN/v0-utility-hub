import { NextResponse } from "next/server"
import { createSupabaseClient, createSupabaseAdmin } from "@/lib/supabase-client"

export async function POST() {
  try {
    const supabase = createSupabaseClient()

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("API: /auth/delete-account - Error getting session:", sessionError.message)
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    if (!session) {
      console.log("API: /auth/delete-account - No active session")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`API: /auth/delete-account - Deleting account for user: ${userId}`)

    // Use admin client to delete user data
    const adminClient = createSupabaseAdmin()

    // 1. Delete messages
    const { error: messagesError } = await adminClient.from("messages").delete().eq("sender_id", userId)

    if (messagesError) {
      console.error("API: /auth/delete-account - Error deleting messages:", messagesError)
      return NextResponse.json({ error: messagesError.message }, { status: 500 })
    }

    // 2. Delete conversation participants
    const { error: participantsError } = await adminClient
      .from("conversation_participants")
      .delete()
      .eq("user_id", userId)

    if (participantsError) {
      console.error("API: /auth/delete-account - Error deleting conversation participants:", participantsError)
      return NextResponse.json({ error: participantsError.message }, { status: 500 })
    }

    // 3. Delete profile
    const { error: profileError } = await adminClient.from("profiles").delete().eq("id", userId)

    if (profileError) {
      console.error("API: /auth/delete-account - Error deleting profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 4. Delete user
    const { error: userError } = await adminClient.auth.admin.deleteUser(userId)

    if (userError) {
      console.error("API: /auth/delete-account - Error deleting user:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // 5. Sign out
    await supabase.auth.signOut()

    console.log(`API: /auth/delete-account - Successfully deleted account for ${userId}`)

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    })
  } catch (error) {
    console.error("API: /auth/delete-account - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
