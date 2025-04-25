"use client"

import { useState, useEffect, useRef } from "react"
import { useSpotify } from "@/contexts/spotify-context"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Music } from "lucide-react"

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    duration,
    position,
    volume,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    setVolume,
  } = useSpotify()

  const [isSeeking, setIsSeeking] = useState(false)
  const [localPosition, setLocalPosition] = useState(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isSeeking) {
      setLocalPosition(position)
    }
  }, [position, isSeeking])

  useEffect(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    if (isPlaying && !isSeeking) {
      progressInterval.current = setInterval(() => {
        setLocalPosition((prev) => {
          if (prev >= duration) {
            clearInterval(progressInterval.current!)
            return 0
          }
          return prev + 1000
        })
      }, 1000)
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [isPlaying, isSeeking, duration])

  const handleSeekChange = (value: number[]) => {
    setLocalPosition(value[0])
  }

  const handleSeekCommit = (value: number[]) => {
    seekTo(value[0])
    setIsSeeking(false)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  const formatTime = (ms: number) => {
    if (!ms) return "0:00"
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="h-5 w-5" />
    if (volume < 50) return <Volume1 className="h-5 w-5" />
    return <Volume2 className="h-5 w-5" />
  }

  if (!currentTrack) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center text-muted-foreground">
              <Music className="h-5 w-5 mr-2" />
              <span>No track playing</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="h-16 w-16 flex-shrink-0">
            <img
              src={currentTrack.album.images[0]?.url || "/placeholder.svg?height=64&width=64"}
              alt={currentTrack.name}
              className="h-full w-full object-cover rounded-md"
            />
          </div>

          <div className="flex-1 min-w-0 text-center md:text-left">
            <h3 className="font-medium truncate">{currentTrack.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {currentTrack.artists.map((a) => a.name).join(", ")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={skipToPrevious} className="h-9 w-9">
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button variant="outline" size="icon" onClick={togglePlayPause} className="h-10 w-10 rounded-full">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={skipToNext} className="h-9 w-9">
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 flex items-center gap-2 w-full md:max-w-xs">
            <span className="text-xs w-10 text-right">{formatTime(localPosition)}</span>
            <Slider
              value={[localPosition]}
              min={0}
              max={duration || 1}
              step={1000}
              onValueChange={handleSeekChange}
              onValueCommit={handleSeekCommit}
              onMouseDown={() => setIsSeeking(true)}
              onTouchStart={() => setIsSeeking(true)}
              className="flex-1"
            />
            <span className="text-xs w-10">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto md:max-w-[140px]">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {getVolumeIcon()}
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-full md:w-24"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
