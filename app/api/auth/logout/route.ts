import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase-client"

export async function POST() {
  console.log("API: /auth/logout called")

  try {
    const supabase = createSupabaseClient()

    // Sign out with Supabase
    const { error } = await supabase.auth.signOut({
      scope: "global", // Sign out from all devices
    })

    if (error) {
      console.error("API: /auth/logout - Error signing out:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Prepare response
    const response = NextResponse.json({
      success: true,
      message: "Successfully logged out",
    })

    // Clear cookies - be thorough to ensure all auth cookies are removed
    response.cookies.delete("sb-access-token")
    response.cookies.delete("sb-refresh-token")
    response.cookies.delete("supabase-auth-token")

    // Use a more aggressive Set-Cookie header to ensure cookies are deleted
    response.headers.append(
      "Set-Cookie",
      "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    )
    response.headers.append(
      "Set-Cookie",
      "sb-refresh-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
    )

    console.log("API: /auth/logout - Logout successful")
    return response
  } catch (error) {
    console.error("API: /auth/logout - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
