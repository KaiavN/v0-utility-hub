"use client"

import { useEffect } from "react"
import { useSpotify } from "@/contexts/spotify-context"
import { usePathname } from "next/navigation"

/**
 * A component to manage Spotify connection across page navigations
 * This helps ensure the music keeps playing when navigating between pages
 */
export function SpotifyConnectionManager() {
  const { isAuthenticated, isPlaying, fetchDevices, currentTrack } = useSpotify()
  const pathname = usePathname()

  // Re-establish connection when navigating between pages
  useEffect(() => {
    if (isAuthenticated && (isPlaying || currentTrack)) {
      // Small delay to allow navigation to complete
      const timer = setTimeout(() => {
        console.log("Maintaining Spotify connection after navigation")
        fetchDevices()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [pathname, isAuthenticated, isPlaying, currentTrack, fetchDevices])

  return null
}
