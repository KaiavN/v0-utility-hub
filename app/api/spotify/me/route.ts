import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshResponse = await fetch(new URL("/api/spotify/refresh", request.url))
      if (!refreshResponse.ok) {
        return NextResponse.json({ error: "Authentication expired" }, { status: 401 })
      }

      // Retry with new token
      const newAccessToken = cookieStore.get("spotify_access_token")?.value
      if (!newAccessToken) {
        return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 })
      }

      const retryResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      })

      if (!retryResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch user data" }, { status: retryResponse.status })
      }

      return NextResponse.json(await retryResponse.json())
    }

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: response.status })
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
