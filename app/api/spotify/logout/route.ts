import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()

  // Clear Spotify cookies
  cookieStore.delete("spotify_access_token")
  cookieStore.delete("spotify_refresh_token")

  return NextResponse.json({ success: true })
}
