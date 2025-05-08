import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // First try using our safe function
    const { data: safeCheckResult, error: safeCheckError } = await supabase.rpc("safe_check_email_exists", {
      check_email: email,
    })

    if (!safeCheckError) {
      return NextResponse.json({ exists: !!safeCheckResult })
    }

    console.warn("Safe email check failed, falling back to direct query:", safeCheckError)

    // Fall back to direct query with error handling
    try {
      const { data, error } = await supabase.from("auth.users").select("id").ilike("email", email).maybeSingle()

      if (error) {
        console.warn("Direct query failed, using count method:", error)

        // Try one more fallback with count
        const { count, error: countError } = await supabase
          .from("auth.users")
          .select("*", { count: "exact", head: true })
          .ilike("email", email)

        if (countError) {
          console.error("All email check methods failed:", countError)
          // Return false to allow signup attempt which will fail if email exists
          return NextResponse.json({ exists: false })
        }

        return NextResponse.json({ exists: count ? count > 0 : false })
      }

      return NextResponse.json({ exists: !!data })
    } catch (queryError) {
      console.error("Error checking email existence:", queryError)
      // Return false to allow signup attempt which will fail if email exists
      return NextResponse.json({ exists: false })
    }
  } catch (error) {
    console.error("Unexpected error in check-email route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
