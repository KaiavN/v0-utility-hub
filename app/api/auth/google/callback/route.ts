import { type NextRequest, NextResponse } from "next/server"
import { handleGoogleCallback } from "@/lib/google-auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Get code and state from URL
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Handle error from Google
    if (error) {
      console.error("Google auth error:", error)
      return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
    }

    // Validate parameters
    if (!code || !state) {
      return NextResponse.redirect(new URL("/?error=missing_params", request.url))
    }

    // Process the callback
    const result = await handleGoogleCallback(code, state)

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/?error=auth_error&error_description=${encodeURIComponent(result.error.message)}`, request.url),
      )
    }

    // Get the redirect path
    const redirectPath = cookies().get("redirectAfterLogin")?.value || "/"

    // Successful authentication, redirect to the app
    return NextResponse.redirect(new URL(redirectPath, request.url))
  } catch (error) {
    console.error("Error in Google callback route:", error)
    return NextResponse.redirect(
      new URL(`/?error=server_error&error_description=${encodeURIComponent(error.message)}`, request.url),
    )
  }
}
