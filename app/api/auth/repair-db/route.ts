import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is authenticated and has admin role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Run the integrity check function
    const { data: integrityResult, error: integrityError } = await supabase.rpc("check_auth_integrity")

    if (integrityError) {
      console.error("Error running integrity check:", integrityError)
      return NextResponse.json(
        { error: "Failed to run integrity check", details: integrityError.message },
        { status: 500 },
      )
    }

    // Normalize emails
    const { data: normalizeResult, error: normalizeError } = await supabase.rpc("normalize_user_emails")

    if (normalizeError) {
      console.error("Error normalizing emails:", normalizeError)
      return NextResponse.json(
        {
          error: "Failed to normalize emails",
          details: normalizeError.message,
          integrityResult,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      integrityResult,
      normalizeResult,
    })
  } catch (error) {
    console.error("Unexpected error in repair-db route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
