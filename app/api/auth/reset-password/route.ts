import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase-client"

export async function POST(request: Request) {
  console.log("API: /auth/reset-password called")

  try {
    const { email } = await request.json()

    console.log(`API: /auth/reset-password - Processing request for ${email}`)

    if (!email) {
      console.log("API: /auth/reset-password - No email provided")
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Get the origin for the redirect
    const origin = request.headers.get("origin") || "http://localhost:3000"
    const redirectUrl = `${origin}/reset-password`

    console.log(`API: /auth/reset-password - Using redirect URL: ${redirectUrl}`)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error(`API: /auth/reset-password - Error for ${email}:`, error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`API: /auth/reset-password - Reset email sent to ${email}`)
    return NextResponse.json({ message: "Password reset email sent" })
  } catch (error) {
    console.error("API: /auth/reset-password - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
