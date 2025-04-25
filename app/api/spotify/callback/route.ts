import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const REDIRECT_URI =
  typeof process.env.VERCEL_URL !== "undefined"
    ? `https://${process.env.VERCEL_URL}/spotify/callback`
    : "http://localhost:3000/spotify/callback"

export async function GET(request: NextRequest) {
  // Get the authorization code from the URL query parameters
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  // If there's an error or no code, redirect to the home page
  if (error || !code) {
    return NextResponse.redirect(new URL("/?spotify_error=true", request.url))
  }

  try {
    // Exchange the code for an access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`)
    }

    const tokenData = await tokenResponse.json()

    // Store the tokens in cookies (secure and HTTP-only)
    const cookieStore = cookies()

    // Set access token (short-lived)
    cookieStore.set("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: tokenData.expires_in,
      path: "/",
    })

    // Set refresh token (long-lived)
    cookieStore.set("spotify_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    // Redirect to the Spotify page
    return NextResponse.redirect(new URL("/spotify", request.url))
  } catch (error) {
    console.error("Error during Spotify authentication:", error)
    return NextResponse.redirect(new URL("/?spotify_error=true", request.url))
  }
}
