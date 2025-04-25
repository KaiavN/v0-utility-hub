"use client"

import type React from "react"

import { createContext, useContext } from "react"
import type { SpotifyAPI } from "@/lib/spotify-api"
import type { SpotifyTrack, SpotifyUser } from "@/lib/spotify-types"

interface SpotifyContextType {
  isAuthenticated: boolean
  user: SpotifyUser | null
  api: SpotifyAPI | null
  currentTrack: SpotifyTrack | null
  isPlaying: boolean
  // Add other properties as needed
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined)

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... (Existing code for SpotifyProvider)
}

export const useSpotify = () => {
  const context = useContext(SpotifyContext)
  if (context === undefined) {
    throw new Error("useSpotify must be used within a SpotifyProvider")
  }
  return context
}
