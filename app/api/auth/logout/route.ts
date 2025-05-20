import { NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase-client"
import { cookies } from "next/headers"

export async function POST() {
  console.log("API: /auth/logout called")

  try {
    const supabase = createSupabaseClient()

    // Sign out with Supabase - use global scope to sign out from all devices
    const { error } = await supabase.auth.signOut({
      scope: "global",
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

    // Get all cookies
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    // Clear all auth-related cookies
    const authCookiePrefixes = ["sb-", "supabase-auth-", "__session", "auth-", "token"]

    allCookies.forEach((cookie) => {
      const name = cookie.name
      if (
        authCookiePrefixes.some((prefix) => name.startsWith(prefix)) ||
        name.includes("auth") ||
        name.includes("token")
      ) {
        response.cookies.delete(name)

        // Also set an expired version of the cookie
        response.headers.append(
          "Set-Cookie",
          `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
        )
      }
    })

    // Explicitly clear known Supabase auth cookies
    const knownCookies = [
      "sb-access-token",
      "sb-refresh-token",
      "supabase-auth-token",
      "sb-auth-token",
      "sb-provider-token",
      "sb-auth-event",
      "sb-auth-data",
    ]

    knownCookies.forEach((name) => {
      response.cookies.delete(name)
      response.headers.append(
        "Set-Cookie",
        `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
      )
    })

    // Add cache control headers to prevent caching of this response
    response.headers.append("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.append("Pragma", "no-cache")
    response.headers.append("Expires", "0")

    console.log("API: /auth/logout - Logout successful")
    return response
  } catch (error) {
    console.error("API: /auth/logout - Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
