import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    // No content means no track is playing
    if (response.status === 204) {
      return NextResponse.json(null)
    }

    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshResponse = await fetch(new URL("/api/spotify/refresh", request.url))
      if (!refreshResponse.ok) {
        return NextResponse.json({ error: "Authentication expired" }, { status: 401 })
      }

      // Retry with new token
      const newAccessToken = cookieStore.get("spotify_access_token")?.value
      const retryResponse = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      })

      if (retryResponse.status === 204) {
        return NextResponse.json(null)
      }

      if (!retryResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch current track" }, { status: retryResponse.status })
      }

      return NextResponse.json(await retryResponse.json())
    }

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch current track" }, { status: response.status })
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error("Error fetching current track:", error)
    return NextResponse.json({ error: "Failed to fetch current track" }, { status: 500 })
  }
}
