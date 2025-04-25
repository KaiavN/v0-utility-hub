import { type NextRequest, NextResponse } from "next/server"
import { getSpotifyApi } from "../utils/spotify-auth"

export async function POST(request: NextRequest) {
  try {
    const api = await getSpotifyApi()
    if (!api) {
      return NextResponse.json({ error: "Not authenticated with Spotify" }, { status: 401 })
    }

    // Extract deviceId from request body if provided
    const body = (await request.json()) as {
      uri?: string
      uris?: string[]
      context_uri?: string
      deviceId?: string
    }
    const deviceId = body.deviceId

    await api.play(deviceId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error playing track:", error)

    // Handle specific Spotify API errors
    if (error.message?.includes("NO_ACTIVE_DEVICE")) {
      return NextResponse.json({ error: "No active device found", errorCode: "NO_ACTIVE_DEVICE" }, { status: 404 })
    }

    return NextResponse.json({ error: error.message || "Failed to play track" }, { status: 500 })
  }
}
