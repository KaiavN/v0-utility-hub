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
      // Don't return error immediately, continue with cookie cleanup
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
        // Delete the cookie
        response.cookies.set(name, "", {
          path: "/",
          expires: new Date(0),
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        })
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
      response.cookies.set(name, "", {
        path: "/",
        expires: new Date(0),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    })

    // Add cache control headers to prevent caching of this response
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    console.log("API: /auth/logout - Logout successful")
    return response
  } catch (error) {
    console.error("API: /auth/logout - Unexpected error:", error)

    // Even if there's an error, return success to ensure client-side cleanup happens
    const response = NextResponse.json({
      success: true,
      message: "Logout completed with warnings",
    })

    // Still try to clear cookies
    const knownCookies = ["sb-access-token", "sb-refresh-token", "supabase-auth-token", "sb-auth-token"]

    knownCookies.forEach((name) => {
      response.cookies.set(name, "", {
        path: "/",
        expires: new Date(0),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    })

    return response
  }
}
