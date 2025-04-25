"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import type { SpotifyTrack } from "@/types"
import { useToast } from "@/components/ui/use-toast"

interface PlayerProps {
  tracks: SpotifyTrack[]
}

const Player: React.FC<PlayerProps> = ({ tracks }) => {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (currentTrack) {
      if (audio) {
        audio.pause()
      }
      const newAudio = new Audio(currentTrack.preview_url)
      setAudio(newAudio)
      if (isPlaying) {
        newAudio.play()
      }
      newAudio.addEventListener("ended", () => {
        setIsPlaying(false)
      })
    }

    return () => {
      if (audio) {
        audio.pause()
        audio.removeEventListener("ended", () => {
          setIsPlaying(false)
        })
      }
    }
  }, [currentTrack, isPlaying])

  const handlePlayTrack = useCallback((track: SpotifyTrack) => {
    if (!track.preview_url) {
      toast({
        title: "Preview Unavailable",
        description: "This track doesn't have a preview available from Spotify.",
        variant: "destructive",
      })
      return
    }

    setCurrentTrack(track)
    setIsPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    if (audio) {
      audio.pause()
    }
  }, [audio])

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    if (audio) {
      audio.play()
    }
  }, [audio])

  return (
    <div className="player">
      {currentTrack && (
        <>
          <h2>Now Playing: {currentTrack.name}</h2>
          <p>Artist: {currentTrack.artists[0].name}</p>
          <img
            src={currentTrack.album.images[0].url || "/placeholder.svg"}
            alt={currentTrack.name}
            style={{ width: "100px", height: "100px" }}
          />
          {isPlaying ? <button onClick={handlePause}>Pause</button> : <button onClick={handlePlay}>Play</button>}
        </>
      )}
      <ul>
        {tracks.map((track) => (
          <li key={track.id}>
            {track.name} - {track.artists[0].name}
            <button onClick={() => handlePlayTrack(track)}>Play</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Player
