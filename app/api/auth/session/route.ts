import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase-client"

export async function GET() {
  console.log("API: /auth/session called")

  try {
    const supabase = createSupabaseClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("API: /auth/session - Error getting session:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!session) {
      console.log("API: /auth/session - No active session")
      return NextResponse.json({ user: null })
    }

    console.log(`API: /auth/session - Found session for user: ${session.user.id}`)

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.warn("API: /auth/session - Error fetching profile:", profileError.message)
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName: profile?.display_name || session.user.email?.split("@")[0] || "",
        avatarUrl: profile?.avatar_url || null,
        role: profile?.role || "user",
      },
    })
  } catch (error) {
    console.error("API: /auth/session - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
