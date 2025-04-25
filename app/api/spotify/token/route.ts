import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = cookies()
  const spotifyAccessToken = cookieStore.get("spotify_access_token")?.value
  const spotifyRefreshToken = cookieStore.get("spotify_refresh_token")?.value
  const tokenExpiry = cookieStore.get("spotify_token_expiry")?.value

  if (!spotifyAccessToken || !spotifyRefreshToken) {
    return NextResponse.json({ error: "Not authenticated with Spotify" }, { status: 401 })
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now()
  const expiryTime = tokenExpiry ? Number.parseInt(tokenExpiry) : 0
  const isExpired = now >= expiryTime - 300000 // 5 minutes buffer

  if (isExpired) {
    // Token is expired or about to expire, refresh it
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: spotifyRefreshToken,
        }),
      })

      if (!response.ok) {
        return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 })
      }

      const data = await response.json()
      const newAccessToken = data.access_token
      const expiresIn = data.expires_in
      const newExpiryTime = now + expiresIn * 1000

      // Store the new token in cookies
      const cookieOptions = { secure: true, httpOnly: true, path: "/" }

      // Set updated tokens in cookies
      cookies().set("spotify_access_token", newAccessToken, cookieOptions)
      cookies().set("spotify_token_expiry", newExpiryTime.toString(), cookieOptions)

      // If we got a new refresh token, update it too
      if (data.refresh_token) {
        cookies().set("spotify_refresh_token", data.refresh_token, cookieOptions)
      }

      return NextResponse.json({
        access_token: newAccessToken,
        expires_in: expiresIn,
        token_type: "Bearer",
      })
    } catch (error) {
      console.error("Error refreshing token:", error)
      return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 })
    }
  }

  // Token is still valid, return it
  return NextResponse.json({
    access_token: spotifyAccessToken,
    expires_in: Math.max(0, Math.floor((expiryTime - now) / 1000)),
    token_type: "Bearer",
  })
}
