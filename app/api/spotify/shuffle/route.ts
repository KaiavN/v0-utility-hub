import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value

  if (!accessToken) {
    console.error("No Spotify access token found")
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const { state, deviceId } = await request.json()
    console.log("Shuffle request:", { state, deviceId })

    // Build the query parameters
    const params = new URLSearchParams()
    if (deviceId) {
      params.append("device_id", deviceId)
    }
    params.append("state", state ? "true" : "false")

    console.log("Sending shuffle request to Spotify API")
    const response = await fetch(`https://api.spotify.com/v1/me/player/shuffle?${params.toString()}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    console.log("Spotify API shuffle response status:", response.status)

    if (response.status === 204) {
      return NextResponse.json({ success: true })
    }

    if (response.status === 404) {
      console.error("No active device found for shuffle")
      return NextResponse.json(
        {
          error: "No active device found",
          errorCode: "NO_ACTIVE_DEVICE",
        },
        { status: 404 },
      )
    }

    // For other error responses, try to parse the error data
    let errorData = {}
    try {
      errorData = await response.json()
    } catch (e) {
      console.error("Failed to parse shuffle error response:", e)
    }

    console.error("Spotify API shuffle error:", errorData)

    return NextResponse.json(
      { error: errorData.error?.message || "Failed to set shuffle state" },
      { status: response.status },
    )
  } catch (error) {
    console.error("Error setting shuffle state:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
