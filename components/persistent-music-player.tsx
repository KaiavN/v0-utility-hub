"use client"

import { useState, useEffect } from "react"
import { useSpotify } from "@/contexts/spotify-context"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatDuration } from "@/lib/utils"
import { ChevronUp, ChevronDown, Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from "lucide-react"
import { usePathname } from "next/navigation"

export function PersistentMusicPlayer() {
  const {
    isAuthenticated,
    currentTrack,
    isPlaying,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    setVolume,
    volume,
    playbackPosition,
    playbackDuration,
    webPlayerActive,
    fetchDevices,
  } = useSpotify()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [prevVolume, setPrevVolume] = useState(50)
  const pathname = usePathname()

  // Re-fetch devices when path changes to ensure connection is maintained
  useEffect(() => {
    if (isAuthenticated) {
      // Small delay to allow navigation to complete
      const timer = setTimeout(() => {
        fetchDevices()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [pathname, isAuthenticated, fetchDevices])

  // Don't show the player if not authenticated or no track is playing
  if (!isAuthenticated || !currentTrack) {
    return null
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume)
      setIsMuted(false)
    } else {
      setPrevVolume(volume)
      setVolume(0)
      setIsMuted(true)
    }
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg transition-all duration-300 z-50 ${
        isExpanded ? "h-24 md:h-28" : "h-16"
      }`}
    >
      <div className="container mx-auto h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          {/* Track Info */}
          <div className="flex items-center flex-1 min-w-0">
            {currentTrack.album?.images?.[0]?.url && (
              <img
                src={currentTrack.album.images[0].url || "/placeholder.svg"}
                alt={currentTrack.album.name}
                className="w-12 h-12 rounded-md mr-3 hidden sm:block"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{currentTrack.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {currentTrack.artists?.map((artist) => artist.name).join(", ")}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={skipToPrevious} className="hidden sm:flex">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={skipToNext} className="hidden sm:flex">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Volume and Expand */}
          <div className="flex items-center justify-end flex-1 gap-2">
            <div className={`items-center gap-2 ${isExpanded ? "flex" : "hidden md:flex"}`}>
              <Button variant="ghost" size="icon" onClick={toggleMute} className="hidden sm:flex">
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : volume < 50 ? (
                  <Volume1 className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0])}
                className="w-20 md:w-28"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="ml-2">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar - Only visible when expanded */}
      {isExpanded && (
        <div className="absolute bottom-0 left-0 right-0 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs w-10 text-right">{formatDuration(playbackPosition)}</span>
            <Slider
              value={[playbackPosition]}
              min={0}
              max={playbackDuration || 1}
              step={1000}
              onValueChange={(value) => seekTo(value[0])}
              className="flex-1"
            />
            <span className="text-xs w-10">{formatDuration(playbackDuration)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
