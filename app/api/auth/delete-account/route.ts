import { NextResponse } from "next/server"
import { createSupabaseClient, createSupabaseAdmin } from "@/lib/supabase-client"

export async function POST() {
  console.log("API: /auth/delete-account called")

  try {
    const supabase = createSupabaseClient()
    const supabaseAdmin = createSupabaseAdmin()

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

    // Delete user data (profiles, messages, etc.)
    // First, delete messages
    const { error: messagesError } = await supabaseAdmin.from("messages").delete().eq("sender_id", userId)

    if (messagesError) {
      console.error("API: /auth/delete-account - Error deleting messages:", messagesError)
      // Continue with deletion even if messages deletion fails
    }

    // Delete conversation participants
    const { error: participantsError } = await supabaseAdmin
      .from("conversation_participants")
      .delete()
      .eq("user_id", userId)

    if (participantsError) {
      console.error("API: /auth/delete-account - Error deleting conversation participants:", participantsError)
      // Continue with deletion even if participants deletion fails
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId)

    if (profileError) {
      console.error("API: /auth/delete-account - Error deleting profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Delete user auth record
    const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (userError) {
      console.error("API: /auth/delete-account - Error deleting user:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Sign out the user
    await supabase.auth.signOut()

    console.log(`API: /auth/delete-account - Successfully deleted account for ${userId}`)
    return NextResponse.json({ success: true, message: "Account successfully deleted" })
  } catch (error) {
    console.error("API: /auth/delete-account - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
