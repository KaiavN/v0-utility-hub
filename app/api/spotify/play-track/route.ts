import { type NextRequest, NextResponse } from "next/server"
import { refreshAccessTokenIfNeeded } from "../utils/spotify-auth"

export async function POST(request: NextRequest) {
  try {
    const { uri, context_uri, deviceId, shuffle } = await request.json()

    console.log("Play track request:", { uri, context_uri, deviceId, shuffle })

    // Refresh token if needed
    const accessToken = await refreshAccessTokenIfNeeded()

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // If shuffle is requested, set it first
    if (shuffle === true) {
      await fetch("https://api.spotify.com/v1/me/player/shuffle?state=true", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        ...(deviceId ? { body: JSON.stringify({ device_id: deviceId }) } : {}),
      })
    }

    // Construct the request body based on what we're playing
    const body: any = {}

    if (deviceId) {
      body.device_id = deviceId
    }

    if (context_uri) {
      // Playing a playlist, album, or artist
      body.context_uri = context_uri
      body.position_ms = 0
    } else if (uri) {
      // Playing a single track
      body.uris = [uri]
      body.position_ms = 0
    }

    console.log("Sending play request to Spotify API:", body)

    // Make the API call to start playback
    const response = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Spotify API error:", errorText, "Status:", response.status)

      // Handle specific error cases
      if (response.status === 404) {
        return NextResponse.json({ error: "No active device found", errorCode: "NO_ACTIVE_DEVICE" }, { status: 404 })
      }

      return NextResponse.json(
        { error: `Spotify API error: ${errorText}`, status: response.status },
        { status: response.status },
      )
    }

    console.log("Successfully started playback")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error playing track:", error)
    return NextResponse.json({ error: "Failed to play track" }, { status: 500 })
  }
}
