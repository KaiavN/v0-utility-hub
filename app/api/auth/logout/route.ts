import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase-client"

export async function POST() {
  console.log("API: /auth/logout called")

  try {
    const supabase = createSupabaseClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("API: /auth/logout - Error signing out:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Clear cookies
    const response = NextResponse.json({
      success: true,
      message: "Successfully logged out",
    })

    // Clear auth cookie if it exists
    response.cookies.delete("sb-access-token")
    response.cookies.delete("sb-refresh-token")

    console.log("API: /auth/logout - Logout successful")
    return response
  } catch (error) {
    console.error("API: /auth/logout - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
