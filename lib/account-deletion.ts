import { createSupabaseAdmin } from "@/lib/supabase-client"

export async function deleteUserData(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseAdmin()

    // Step 1: Delete all messages sent by the user
    const { error: messagesError } = await supabase.from("messages").delete().eq("sender_id", userId)

    if (messagesError) {
      console.error("Error deleting user messages:", messagesError)
      // Continue with other deletions
    }

    // Step 2: Delete all conversation participants
    const { error: participantsError } = await supabase.from("conversation_participants").delete().eq("user_id", userId)

    if (participantsError) {
      console.error("Error deleting conversation participants:", participantsError)
      // Continue with other deletions
    }

    // Step 3: Delete user profile
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId)

    if (profileError) {
      console.error("Error deleting user profile:", profileError)
      return { success: false, error: "Failed to delete user profile" }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error during user data deletion:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
