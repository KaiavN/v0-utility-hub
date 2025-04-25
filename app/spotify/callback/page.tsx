"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function SpotifyCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = () => {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)

      const accessToken = params.get("access_token")
      const expiresIn = params.get("expires_in")
      const state = params.get("state")
      const storedState = localStorage.getItem("spotify_auth_state")

      // Clear the state from localStorage
      localStorage.removeItem("spotify_auth_state")

      if (accessToken && expiresIn) {
        if (state !== storedState) {
          setError("State mismatch error. Please try again.")
          return
        }

        // Calculate expiry time
        const expiryTime = new Date().getTime() + Number.parseInt(expiresIn) * 1000

        // Store token and expiry in localStorage
        localStorage.setItem("spotify_access_token", accessToken)
        localStorage.setItem("spotify_token_expiry", expiryTime.toString())

        // Redirect back to the Spotify page
        router.push("/spotify")
      } else {
        setError("Authentication failed. Please try again.")
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            onClick={() => router.push("/spotify")}
          >
            Return to Spotify
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Authenticating with Spotify...</p>
      </div>
    </div>
  )
}
