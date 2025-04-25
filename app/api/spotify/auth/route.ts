import { type NextRequest, NextResponse } from "next/server"
import { SPOTIFY_CONFIG } from "@/lib/spotify-config"
const CLIENT_ID = SPOTIFY_CONFIG.CLIENT_ID
const REDIRECT_URI = SPOTIFY_CONFIG.REDIRECT_URI
const SCOPES = SPOTIFY_CONFIG.SCOPES.join(" ")

export async function GET(request: NextRequest) {
  const authUrl = new URL("https://accounts.spotify.com/authorize")
  authUrl.searchParams.append("client_id", CLIENT_ID || "")
  authUrl.searchParams.append("response_type", "code")
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI)
  authUrl.searchParams.append("scope", SCOPES)

  // Generate a random state value for security
  const state = Math.random().toString(36).substring(2, 15)
  authUrl.searchParams.append("state", state)

  return NextResponse.redirect(authUrl.toString())
}
