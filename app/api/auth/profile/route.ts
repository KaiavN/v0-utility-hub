import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase-client"

export async function PUT(request: Request) {
  console.log("API: /auth/profile update called")

  try {
    const updateData = await request.json()
    console.log("API: /auth/profile - Update data received:", updateData)

    const supabase = createSupabaseClient()

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("API: /auth/profile - Error getting session:", sessionError.message)
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    if (!session) {
      console.log("API: /auth/profile - No active session")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`API: /auth/profile - Updating profile for user: ${userId}`)

    // Validate username if provided
    if (updateData.username) {
      if (updateData.username.length < 3 || updateData.username.length > 20) {
        console.log("API: /auth/profile - Invalid username length")
        return NextResponse.json({ error: "Username must be between 3 and 20 characters" }, { status: 400 })
      }

      if (!/^[a-zA-Z0-9_]+$/.test(updateData.username)) {
        console.log("API: /auth/profile - Invalid username format")
        return NextResponse.json(
          { error: "Username can only contain letters, numbers, and underscores" },
          { status: 400 },
        )
      }
    }

    // Prepare profile data
    const profileData: Record<string, any> = {}

    if (updateData.username) profileData.username = updateData.username
    if (updateData.displayName) profileData.display_name = updateData.displayName
    if (updateData.avatarUrl !== undefined) profileData.avatar_url = updateData.avatarUrl
    if (updateData.bio) profileData.bio = updateData.bio

    // Update profile
    const { error: updateError } = await supabase.from("profiles").update(profileData).eq("id", userId)

    if (updateError) {
      console.error("API: /auth/profile - Error updating profile:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`API: /auth/profile - Profile updated successfully for ${userId}`)

    // Get updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (fetchError) {
      console.warn("API: /auth/profile - Error fetching updated profile:", fetchError)
      // Return success even if we couldn't fetch the updated profile
      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: session.user.email,
        displayName: updatedProfile.display_name,
        username: updatedProfile.username,
        avatarUrl: updatedProfile.avatar_url,
        role: updatedProfile.role || "user",
      },
    })
  } catch (error) {
    console.error("API: /auth/profile - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  console.log("API: /auth/profile get called")

  try {
    const supabase = createSupabaseClient()

    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("API: /auth/profile GET - Error getting session:", sessionError.message)
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    if (!session) {
      console.log("API: /auth/profile GET - No active session")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`API: /auth/profile GET - Fetching profile for user: ${userId}`)

    // Get profile
    const { data: profile, error: fetchError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("API: /auth/profile GET - Error fetching profile:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!profile) {
      console.log(`API: /auth/profile GET - No profile found for ${userId}`)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log(`API: /auth/profile GET - Successfully fetched profile for ${userId}`)

    return NextResponse.json({
      profile: {
        id: userId,
        email: session.user.email,
        displayName: profile.display_name,
        username: profile.username,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        role: profile.role || "user",
        createdAt: profile.created_at,
      },
    })
  } catch (error) {
    console.error("API: /auth/profile GET - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
