"use client"

import type React from "react"
import { createContext, useState, useRef, useEffect, useContext, type ReactNode } from "react"
import { toast } from "@/components/ui/use-toast"

export interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  preview_url: string | null
  duration_ms: number
}

interface SpotifyContextType {
  currentTrack: SpotifyTrack | null
  setCurrentTrack: (track: SpotifyTrack | null) => void
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  queue: SpotifyTrack[]
  addToQueue: (track: SpotifyTrack) => void
  removeFromQueue: (trackId: string) => void
  clearQueue: () => void
  audioRef: React.RefObject<HTMLAudioElement>
  currentTime: number
  duration: number
  volume: number
  setVolume: (volume: number) => void
  handleTimeUpdate: () => void
  handleNextTrack: () => void
  handlePreviousTrack: () => void
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined)

export const useSpotify = () => {
  const context = useContext(SpotifyContext)
  if (!context) {
    throw new Error("useSpotify must be used within a SpotifyProvider")
  }
  return context
}

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<SpotifyTrack[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [previousTrack, setPreviousTrack] = useState<SpotifyTrack | null>(null)
  const playPromiseRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    // Create a global audio element if it doesn't exist
    if (!audioRef.current) {
      const audio = new Audio()
      audio.volume = volume
      audioRef.current = audio
    }

    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return

    const handlePlayPause = async () => {
      try {
        if (isPlaying && currentTrack?.preview_url) {
          // Wait for any pending play promises to resolve before playing
          if (playPromiseRef.current) {
            await playPromiseRef.current.catch(() => {})
          }

          // Start playing and store the promise
          playPromiseRef.current = audioRef.current.play()
          await playPromiseRef.current
          playPromiseRef.current = null
        } else {
          // Wait for any pending play promises to resolve before pausing
          if (playPromiseRef.current) {
            await playPromiseRef.current.catch(() => {})
            playPromiseRef.current = null
          }

          audioRef.current.pause()
        }
      } catch (error) {
        console.error("Playback failed:", error)
        setIsPlaying(false)
        toast({
          title: "Playback Error",
          description: "There was an error playing this track. Please try another.",
          variant: "destructive",
        })
      }
    }

    handlePlayPause()
  }, [isPlaying, currentTrack])

  // Handle track changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return

    const loadAndPlayTrack = async () => {
      try {
        // Pause any current playback and wait for pending promises
        if (playPromiseRef.current) {
          await playPromiseRef.current.catch(() => {})
          playPromiseRef.current = null
        }

        audioRef.current.pause()

        if (currentTrack.preview_url) {
          audioRef.current.src = currentTrack.preview_url
          audioRef.current.load()
          setDuration(currentTrack.duration_ms / 1000)

          if (isPlaying) {
            // Add a small delay to ensure the audio is loaded
            setTimeout(async () => {
              try {
                playPromiseRef.current = audioRef.current!.play()
                await playPromiseRef.current
                playPromiseRef.current = null
              } catch (error) {
                console.error("Track change playback failed:", error)
                setIsPlaying(false)
                playPromiseRef.current = null
              }
            }, 100)
          }
        } else {
          toast({
            title: "Preview Unavailable",
            description: "This track doesn't have a preview available from Spotify.",
            variant: "destructive",
          })
          setIsPlaying(false)
        }
      } catch (error) {
        console.error("Error loading track:", error)
        setIsPlaying(false)
      }
    }

    loadAndPlayTrack()
  }, [currentTrack])

  // Set up event listeners
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current

    const handleTimeUpdateEvent = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEndedEvent = () => {
      handleNextTrack()
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleError = (e: Event) => {
      console.error("Audio error:", e)
      setIsPlaying(false)
      toast({
        title: "Playback Error",
        description: "There was an error playing this track. Please try another.",
        variant: "destructive",
      })
    }

    audio.addEventListener("timeupdate", handleTimeUpdateEvent)
    audio.addEventListener("ended", handleEndedEvent)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdateEvent)
      audio.removeEventListener("ended", handleEndedEvent)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("error", handleError)
    }
  }, [])

  const addToQueue = (track: SpotifyTrack) => {
    setQueue((prev) => [...prev, track])
    toast({
      title: "Added to Queue",
      description: `${track.name} by ${track.artists[0]?.name || "Unknown Artist"} added to queue`,
    })
  }

  const removeFromQueue = (trackId: string) => {
    setQueue((prev) => prev.filter((track) => track.id !== trackId))
  }

  const clearQueue = () => {
    setQueue([])
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleNextTrack = async () => {
    // Wait for any pending play promises to resolve
    if (playPromiseRef.current) {
      await playPromiseRef.current.catch(() => {})
      playPromiseRef.current = null
    }

    if (currentTrack) {
      setPreviousTrack(currentTrack)
    }

    if (queue.length > 0) {
      const nextTrack = queue[0]
      setCurrentTrack(nextTrack)
      setQueue((prev) => prev.slice(1))
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }

  const handlePreviousTrack = async () => {
    // Wait for any pending play promises to resolve
    if (playPromiseRef.current) {
      await playPromiseRef.current.catch(() => {})
      playPromiseRef.current = null
    }

    if (previousTrack) {
      if (currentTrack) {
        // Add current track to the front of the queue
        setQueue((prev) => [currentTrack, ...prev])
      }
      setCurrentTrack(previousTrack)
      setPreviousTrack(null)
      setIsPlaying(true)
    } else if (audioRef.current && audioRef.current.currentTime > 3) {
      // If more than 3 seconds in, restart the current track
      audioRef.current.currentTime = 0
    }
  }

  return (
    <SpotifyContext.Provider
      value={{
        currentTrack,
        setCurrentTrack,
        isPlaying,
        setIsPlaying,
        queue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        audioRef,
        currentTime,
        duration,
        volume,
        setVolume,
        handleTimeUpdate,
        handleNextTrack,
        handlePreviousTrack,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  )
}
