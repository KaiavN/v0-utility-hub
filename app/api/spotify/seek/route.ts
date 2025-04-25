import { type NextRequest, NextResponse } from "next/server"
import { getSpotifyApi } from "../utils/spotify-auth"

export async function POST(request: NextRequest) {
  try {
    const api = await getSpotifyApi()
    if (!api) {
      return NextResponse.json({ error: "Not authenticated with Spotify" }, { status: 401 })
    }

    const body = await request.json()
    const positionMs = body.position_ms
    const deviceId = body.deviceId

    if (typeof positionMs !== "number") {
      return NextResponse.json({ error: "Invalid position value" }, { status: 400 })
    }

    await api.seek(positionMs, deviceId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error seeking:", error)

    // Handle specific Spotify API errors
    if (error.message?.includes("NO_ACTIVE_DEVICE")) {
      return NextResponse.json({ error: "No active device found", errorCode: "NO_ACTIVE_DEVICE" }, { status: 404 })
    }

    return NextResponse.json({ error: error.message || "Failed to seek" }, { status: 500 })
  }
}
