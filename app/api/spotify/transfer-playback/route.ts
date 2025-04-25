import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value

    if (!accessToken) {
      console.error("No Spotify access token found")
      return NextResponse.json({ error: "Not authenticated with Spotify" }, { status: 401 })
    }

    const { deviceId } = await request.json()

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    console.log("Transferring playback to device:", deviceId)

    const response = await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        // Force play ensures the player becomes active even if nothing is currently playing
        play: true,
      }),
    })

    if (response.status === 204) {
      return NextResponse.json({ success: true })
    }

    // For error responses, try to parse the error data
    let errorData = {}
    try {
      if (response.status !== 204) {
        errorData = await response.json()
      }
    } catch (e) {
      console.error("Failed to parse error response:", e)
    }

    console.error("Spotify API error:", errorData)

    return NextResponse.json(
      { error: errorData.error?.message || "Failed to transfer playback" },
      { status: response.status === 204 ? 200 : response.status },
    )
  } catch (error) {
    console.error("Error transferring playback:", error)
    return NextResponse.json({ error: "An error occurred while transferring playback" }, { status: 500 })
  }
}
