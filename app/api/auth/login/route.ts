import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase-client"

export async function POST(request: Request) {
  console.log("API: /auth/login called")

  try {
    const { email, password } = await request.json()

    console.log(`API: /auth/login - Attempting login for ${email}`)

    if (!email || !password) {
      console.log("API: /auth/login - Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error(`API: /auth/login - Login failed for ${email}:`, error.message)
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.log(`API: /auth/login - Login successful for ${email}`)

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.warn(`API: /auth/login - Error fetching profile for ${email}:`, profileError.message)
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: profile?.display_name || data.user.email?.split("@")[0] || "",
        avatarUrl: profile?.avatar_url || null,
        role: profile?.role || "user",
      },
    })
  } catch (error) {
    console.error("API: /auth/login - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
