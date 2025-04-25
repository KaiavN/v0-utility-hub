import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { refreshAccessTokenIfNeeded } from "../utils/spotify-auth"

export async function GET() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated with Spotify" }, { status: 401 })
    }

    // Refresh token if needed
    const validToken = await refreshAccessTokenIfNeeded()
    if (!validToken) {
      return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 })
    }

    // Make request to Spotify API
    const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error?.message || "Failed to fetch devices" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching devices:", error)
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
  }
}
