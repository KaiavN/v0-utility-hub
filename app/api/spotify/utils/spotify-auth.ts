import { SpotifyAPI } from "@/lib/spotify-api"
import { cookies } from "next/headers"

export async function refreshAccessTokenIfNeeded(): Promise<string | null> {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value
  const tokenExpiry = cookieStore.get("spotify_token_expiry")?.value

  // If we don't have a refresh token, we can't refresh
  if (!refreshToken) {
    return null
  }

  // If token is still valid, return it
  if (accessToken && tokenExpiry && Number.parseInt(tokenExpiry) > Date.now()) {
    return accessToken
  }

  // Token is expired or missing, refresh it
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error("Missing Spotify client credentials")
      return null
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      console.error("Failed to refresh token:", await response.text())
      return null
    }

    const data = await response.json()

    // Set new cookies
    cookieStore.set("spotify_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: data.expires_in,
      path: "/",
    })

    cookieStore.set("spotify_token_expiry", (Date.now() + data.expires_in * 1000).toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: data.expires_in,
      path: "/",
    })

    // If we got a new refresh token, update it
    if (data.refresh_token) {
      cookieStore.set("spotify_refresh_token", data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      })
    }

    return data.access_token
  } catch (error) {
    console.error("Error refreshing token:", error)
    return null
  }
}

export async function getSpotifyApi(): Promise<SpotifyAPI | null> {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value

  if (!accessToken) {
    return null
  }

  return new SpotifyAPI(accessToken)
}
