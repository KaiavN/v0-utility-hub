import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase-client"

export async function POST(request: Request) {
  console.log("API: /auth/manual-signup called")

  try {
    const { email, displayName, password } = await request.json()

    console.log(`API: /auth/manual-signup - Processing signup for ${email}`)

    if (!email || !displayName || !password) {
      console.log("API: /auth/manual-signup - Missing required fields")
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("API: /auth/manual-signup - Password too short")
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Use regular Supabase client
    const supabase = createSupabaseClient()

    // Try to create the user directly with signUp
    console.log(`API: /auth/manual-signup - Creating user ${email}`)
    const { data: userData, error: createError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
      },
    })

    if (createError) {
      console.error(`API: /auth/manual-signup - Error creating user:`, createError)

      // Check if error is because user already exists
      if (createError.message.includes("already") || createError.message.includes("exists")) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
      }

      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    if (!userData.user) {
      console.error(`API: /auth/manual-signup - No user returned after creation`)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    console.log(`API: /auth/manual-signup - User created successfully, id: ${userData.user.id}`)

    // Create profile for the user
    console.log(`API: /auth/manual-signup - Creating profile for user ${userData.user.id}`)
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: userData.user.id,
        email: email,
        display_name: displayName,
        created_at: new Date().toISOString(),
      },
    ])

    if (profileError) {
      console.warn(`API: /auth/manual-signup - Error creating profile:`, profileError)
      // Continue anyway since user was created
    } else {
      console.log(`API: /auth/manual-signup - Profile created successfully`)
    }

    // Return success response
    return NextResponse.json({
      user: {
        id: userData.user.id,
        email: userData.user.email,
        displayName: displayName,
      },
      message: "User created successfully",
    })
  } catch (error) {
    console.error("API: /auth/manual-signup - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
