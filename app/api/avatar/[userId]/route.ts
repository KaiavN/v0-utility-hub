import { NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const userId = params.userId

  if (!userId) {
    return new Response("User ID is required", { status: 400 })
  }

  try {
    const supabase = createSupabaseAdmin()

    // Get user profile
    const { data: profile, error } = await supabase.from("profiles").select("avatar_url").eq("id", userId).single()

    if (error || !profile) {
      // If no avatar, redirect to a default avatar
      return NextResponse.redirect(
        new URL(`https://ui-avatars.com/api/?name=User&background=random&size=200`, request.url),
      )
    }

    if (profile.avatar_url) {
      // If user has an avatar, redirect to it
      return NextResponse.redirect(new URL(profile.avatar_url, request.url))
    } else {
      // Generate an avatar based on user ID
      return NextResponse.redirect(
        new URL(`https://ui-avatars.com/api/?name=User&background=random&size=200`, request.url),
      )
    }
  } catch (error) {
    console.error("Error fetching avatar:", error)
    return NextResponse.redirect(
      new URL(`https://ui-avatars.com/api/?name=User&background=random&size=200`, request.url),
    )
  }
}
