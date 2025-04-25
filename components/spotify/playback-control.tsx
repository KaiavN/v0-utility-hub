"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useSpotify } from "../../contexts/SpotifyContext"

const PlaybackControl: React.FC = () => {
  const { currentTrack, playTrack, nextTrack, previousTrack } = useSpotify()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleNextTrack = () => {
    nextTrack()
  }

  const handlePreviousTrack = () => {
    previousTrack()
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTime = Number.parseFloat(event.target.value)
      audioRef.current.currentTime = seekTime
      setCurrentTime(seekTime)
    }
  }

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  useEffect(() => {
    if (isPlaying && audioRef.current && audioRef.current.src) {
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio playback started successfully")
          })
          .catch((error) => {
            console.error("Audio playback failed:", error)
            setIsPlaying(false)
          })
      }
    } else if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [isPlaying, currentTrack])

  useEffect(() => {
    if (currentTrack?.preview_url && audioRef.current) {
      console.log("Loading new track:", currentTrack.name)
      audioRef.current.load()
      if (isPlaying) {
        const playPromise = audioRef.current.play()

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Track change playback failed:", error)
            setIsPlaying(false)
          })
        }
      }
    }
  }, [currentTrack])

  return (
    <div className="playback-control">
      <audio
        ref={audioRef}
        src={currentTrack?.preview_url || ""}
        onEnded={handleNextTrack}
        onTimeUpdate={handleTimeUpdate}
        onError={(e) => console.error("Audio playback error:", e)}
        preload="auto"
        crossOrigin="anonymous"
      />
      <div className="controls">
        <button onClick={handlePreviousTrack} disabled={!currentTrack}>
          Previous
        </button>
        <button onClick={handlePlayPause} disabled={!currentTrack}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button onClick={handleNextTrack} disabled={!currentTrack}>
          Next
        </button>
      </div>
      <div className="progress">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={audioRef.current?.duration || 0}
          value={currentTime}
          onChange={handleSeek}
          disabled={!currentTrack}
        />
        <span>{formatTime(audioRef.current?.duration || 0)}</span>
      </div>
      {currentTrack && (
        <div className="track-info">
          <p>Now Playing: {currentTrack.name}</p>
        </div>
      )}
    </div>
  )
}

export default PlaybackControl
