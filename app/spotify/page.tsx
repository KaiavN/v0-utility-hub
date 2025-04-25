"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Search,
  ListMusic,
  Clock,
  Shuffle,
  AlertTriangle,
  RefreshCw,
  Laptop,
  Smartphone,
  Speaker,
  Volume2,
  Volume1,
  VolumeX,
  CheckCircle2,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDuration } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { useSpotify } from "@/contexts/spotify-context"
import { SpotifySetupInstructions } from "@/components/spotify-setup-instructions"
import { toast } from "@/components/ui/use-toast"

// Types
interface Artist {
  name: string
}

interface Image {
  url: string
  height: number
  width: number
}

interface Album {
  name: string
  images: Image[]
}

interface Track {
  id: string
  name: string
  uri: string
  artists: Artist[]
  album: Album
  duration_ms: number
  preview_url: string | null
}

interface PlaylistTrackItem {
  track: Track
}

interface Playlist {
  id: string
  name: string
  description: string
  images: Image[]
  uri: string
  tracks: {
    items: PlaylistTrackItem[]
    total: number
  }
}

interface Device {
  id: string
  name: string
  type: string
  is_active: boolean
  volume_percent: number
}

// Prevent prerendering of this page
export const dynamic = "force-dynamic"

export default function SpotifyPage() {
  // Use the context instead of managing state locally
  const {
    isAuthenticated,
    isInitializing: isLoading,
    currentTrack,
    isPlaying,
    playTrack,
    playContext,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    setVolume,
    volume,
    webPlayerReady: playerReady,
    webPlayerActive,
    isInitializingPlayer,
    initializeWebPlayer,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    noActiveDevice,
    fetchDevices,
    playlists,
    fetchPlaylists,
    fetchPlaylist,
    selectedPlaylist,
    handleSearch: handleSearchContext,
    api,
    isPremium,
    isPlaybackLoading,
    playbackPosition,
    playbackDuration,
    login,
    logout,
    authError,
  } = useSpotify()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{
    tracks?: { items: Track[] }
    artists?: { items: any[] }
    albums?: { items: any[] }
  }>({})
  const [isSearching, setIsSearching] = useState(false)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [prevVolume, setPrevVolume] = useState(50)
  const [connectionAttempted, setConnectionAttempted] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const playerRef = useRef<any>(null)
  const webPlayerDeviceId = useRef<string | null>(null)
  const requestAnimationRef = useRef<number | null>(null)
  const playerStateUpdateTimeRef = useRef<number>(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  // Load the Spotify Web Playback SDK script
  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("spotify-player")) {
      const script = document.createElement("script")
      script.id = "spotify-player"
      script.src = "https://sdk.scdn.co/spotify-player.js"
      script.async = true

      document.body.appendChild(script)
    }

    return () => {
      // Cleanup
      if (playerRef.current) {
        playerRef.current.disconnect()
      }

      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }

      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current)
      }
    }
  }, [])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    // Debounce search requests
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query)
    }, 500)
  }

  const handleSearch = async (query: string) => {
    if (!api || !query.trim()) {
      setSearchResults({})
      return
    }

    setIsSearching(true)
    try {
      const data = await api.search(query, ["track", "artist", "album"])
      setSearchResults(data)
    } catch (error) {
      console.error("Error searching Spotify:", error)
      toast({
        title: "Search Error",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const getDeviceIcon = (type: string) => {
    const type_lc = type.toLowerCase()
    if (type_lc.includes("computer") || type_lc.includes("laptop")) return <Laptop className="h-4 w-4" />
    if (type_lc.includes("smartphone") || type_lc.includes("phone") || type_lc.includes("mobile"))
      return <Smartphone className="h-4 w-4" />
    return <Speaker className="h-4 w-4" />
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

  const renderTrackList = (tracks: PlaylistTrackItem[] | Track[]) => {
    if (!tracks || tracks.length === 0) {
      return (
        <div className="text-center py-8">
          <p>No tracks available</p>
        </div>
      )
    }

    // Check if we're dealing with playlist items or direct tracks
    // Handle both array types safely
    const normalizedTracks: Track[] = []

    tracks.forEach((item: any) => {
      if (item.track) {
        // This is a playlist track item
        if (item.track.id && item.track.uri) {
          normalizedTracks.push(item.track)
        }
      } else if (item.id && item.uri) {
        // This is a direct track
        normalizedTracks.push(item)
      }
    })

    if (normalizedTracks.length === 0) {
      return (
        <div className="text-center py-8">
          <p>No valid tracks found</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left hidden md:table-cell">Album</th>
              <th className="px-4 py-2 text-right">
                <Clock className="h-4 w-4 inline" />
              </th>
            </tr>
          </thead>
          <tbody>
            {normalizedTracks.map((track, index) => (
              <tr
                key={track.id + index} // Add index to ensure uniqueness
                className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                  playingTrackId === track.id ? "bg-gray-100 dark:bg-gray-800" : ""
                }`}
                onClick={() => playTrack(track.uri)}
              >
                <td className="px-4 py-2 text-gray-500">
                  {playingTrackId === track.id ? (
                    <div className="flex items-center justify-center w-6 h-6">
                      {playingTrackId === "loading" || isPlaybackLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Play className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ) : (
                    index + 1
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center">
                    {track.album?.images?.[0]?.url && (
                      <img
                        src={track.album.images[0].url || "/placeholder.svg"}
                        alt={track.album.name}
                        className="w-10 h-10 mr-3 rounded"
                      />
                    )}
                    <div>
                      <div className={`font-medium ${playingTrackId === track.id ? "text-primary" : ""}`}>
                        {track.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {track.artists?.map((artist) => artist.name).join(", ")}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-500 hidden md:table-cell">{track.album?.name}</td>
                <td className="px-4 py-2 text-right text-gray-500">{formatDuration(track.duration_ms)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Spotify</h1>

      {!isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect to Spotify</CardTitle>
            <CardDescription>
              Connect your Spotify account to search for music, view your playlists, and control playback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={login} className="bg-green-500 hover:bg-green-600">
              <Music className="mr-2 h-4 w-4" />
              Connect Spotify
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {authError && <SpotifySetupInstructions />}
          {/* Web Player Status */}
          <Card className={`mb-6 ${webPlayerActive ? "border-2 border-green-500 dark:border-green-700" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle>Spotify Web Player</CardTitle>
                  {webPlayerActive && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                      Active
                    </span>
                  )}
                </div>
                {isInitializingPlayer && (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                    <span className="text-sm">Initializing...</span>
                  </div>
                )}
              </div>
              <CardDescription>
                {webPlayerActive
                  ? "Web Player is active - music will play directly in your browser"
                  : "Enable the Web Player to listen to music without opening Spotify"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {webPlayerActive ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleMute}>
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
                      className="w-full max-w-xs"
                    />
                    <span className="text-sm w-8 text-center">{volume}%</span>
                  </div>

                  {currentTrack && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-10 text-right">{formatDuration(playbackPosition)}</span>
                        <Slider
                          value={[playbackPosition]}
                          min={0}
                          max={playbackDuration || 1}
                          step={1000}
                          onValueChange={(value) => seekTo(value[0])}
                          onValueCommit={(value) => seekTo(value[0])}
                          className="flex-1"
                        />
                        <span className="text-xs w-10">{formatDuration(playbackDuration)}</span>
                      </div>
                    </div>
                  )}

                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle>Web Player Connected</AlertTitle>
                    <AlertDescription>
                      Music will play directly in your browser. No other devices needed.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={initializeWebPlayer}
                    disabled={isInitializingPlayer}
                    className="bg-green-500 hover:bg-green-600 w-full"
                  >
                    {isInitializingPlayer ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        <Music className="mr-2 h-4 w-4" />
                        Enable Web Player
                      </>
                    )}
                  </Button>

                  {connectionAttempted && !webPlayerActive && isPremium && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Connection Failed</AlertTitle>
                      <AlertDescription>
                        Failed to connect to Spotify Web Player. Please try again or use another device.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert variant="warning" className="bg-amber-50 dark:bg-amber-950">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Spotify Premium Required</AlertTitle>
                    <AlertDescription>
                      Spotify Premium is required to use the in-browser player. If you have Premium, click the button
                      above.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Selector - Only show if web player is not ready */}
          {!webPlayerActive && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Spotify Device</CardTitle>
                  <Button variant="ghost" size="sm" onClick={fetchDevices} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
                <CardDescription>Select which device to play music on</CardDescription>
              </CardHeader>
              <CardContent>
                {noActiveDevice ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No active devices found</AlertTitle>
                    <AlertDescription>
                      {isPremium
                        ? "Enable the web player or open Spotify on another device."
                        : "Please open Spotify on a device (such as the Spotify app on your phone, tablet, or computer) to play music."}
                    </AlertDescription>
                  </Alert>
                ) : devices.length > 0 ? (
                  <Select value={selectedDeviceId || undefined} onValueChange={(value) => setSelectedDeviceId(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a device" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          <div className="flex items-center">
                            {getDeviceIcon(device.type)}
                            <span className="ml-2">{device.name}</span>
                            {device.is_active && <span className="ml-2 text-green-500 text-xs">(Active)</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-gray-500">No devices found. Please open Spotify on a device.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Now Playing Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Now Playing</CardTitle>
            </CardHeader>
            <CardContent>
              {currentTrack ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {currentTrack.album?.images?.[0]?.url && (
                    <img
                      src={currentTrack.album.images[0].url || "/placeholder.svg"}
                      alt={currentTrack.album.name}
                      className="w-40 h-40 object-cover rounded-md shadow-md"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{currentTrack.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {currentTrack.artists?.map((artist) => artist.name).join(", ")}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{currentTrack.album?.name}</p>

                    <div className="flex items-center gap-4 mt-4">
                      <Button variant="outline" size="icon" onClick={skipToPrevious} disabled={isPlaybackLoading}>
                        {isPlaybackLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SkipBack className="h-4 w-4" />
                        )}
                      </Button>

                      <Button variant="default" size="icon" onClick={togglePlayPause} disabled={isPlaybackLoading}>
                        {isPlaybackLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      <Button variant="outline" size="icon" onClick={skipToNext} disabled={isPlaybackLoading}>
                        {isPlaybackLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SkipForward className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p>No track currently playing</p>
                  <Button variant="outline" className="mt-4" onClick={fetchDevices}>
                    Refresh
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Search and Playlists */}
          <Tabs defaultValue="search" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="playlists">
                <ListMusic className="h-4 w-4 mr-2" />
                Your Playlists
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Search Music</CardTitle>
                  <CardDescription>Search for songs, artists, and albums on Spotify</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search for songs, artists, or albums..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                      />
                    </div>
                  </div>

                  {isSearching ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {searchResults.tracks?.items?.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold mb-4">Tracks</h3>
                          {renderTrackList(searchResults.tracks.items)}
                        </div>
                      )}

                      {searchResults.artists?.items?.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold mb-4">Artists</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {searchResults.artists.items.slice(0, 8).map((artist) => (
                              <div key={artist.id} className="text-center">
                                <img
                                  src={artist.images?.[0]?.url || "/placeholder.svg?height=100&width=100"}
                                  alt={artist.name}
                                  className="w-full aspect-square object-cover rounded-full mb-2"
                                />
                                <p className="font-medium truncate">{artist.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.albums?.items?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Albums</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {searchResults.albums.items.slice(0, 8).map((album) => (
                              <div key={album.id} className="text-center">
                                <img
                                  src={album.images?.[0]?.url || "/placeholder.svg?height=200&width=200"}
                                  alt={album.name}
                                  className="w-full aspect-square object-cover rounded-md mb-2"
                                />
                                <p className="font-medium truncate">{album.name}</p>
                                <p className="text-sm text-gray-500 truncate">
                                  {album.artists.map((artist: any) => artist.name).join(", ")}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchQuery &&
                        !searchResults.tracks?.items?.length &&
                        !searchResults.artists?.items?.length &&
                        !searchResults.albums?.items?.length && (
                          <div className="text-center py-8">
                            <p>No results found for "{searchQuery}"</p>
                          </div>
                        )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="playlists">
              <Card>
                <CardHeader>
                  <CardTitle>Your Playlists</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPlaylist ? (
                    <>
                      <Button variant="ghost" className="mb-4" onClick={() => fetchPlaylist("")}>
                        ← Back to playlists
                      </Button>

                      <div className="flex flex-col md:flex-row gap-6 mb-6">
                        <img
                          src={selectedPlaylist.images?.[0]?.url || "/placeholder.svg?height=200&width=200"}
                          alt={selectedPlaylist.name}
                          className="w-40 h-40 object-cover rounded-md shadow-md"
                        />
                        <div>
                          <h2 className="text-2xl font-bold">{selectedPlaylist.name}</h2>
                          <p className="text-gray-500 dark:text-gray-400 mb-2">
                            {selectedPlaylist.description || "No description"}
                          </p>
                          <p className="text-sm">{selectedPlaylist.tracks?.items?.length || 0} tracks</p>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="default"
                              onClick={() => playContext(selectedPlaylist.uri)}
                              disabled={isPlaybackLoading || !selectedPlaylist.tracks?.items?.length}
                            >
                              {isPlaybackLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4 mr-2" />
                              )}
                              Play
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => playContext(selectedPlaylist.uri, true)}
                              disabled={isPlaybackLoading || !selectedPlaylist.tracks?.items?.length}
                            >
                              {isPlaybackLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Shuffle className="h-4 w-4 mr-2" />
                              )}
                              Shuffle
                            </Button>
                          </div>
                        </div>
                      </div>

                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <>
                          {selectedPlaylist.tracks?.items?.length > 0 ? (
                            renderTrackList(selectedPlaylist.tracks.items)
                          ) : (
                            <div className="text-center py-8">
                              <p>This playlist is empty</p>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {playlists.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {playlists.map((playlist) => (
                            <div
                              key={playlist.id}
                              className="cursor-pointer hover:opacity-80 transition-opacity transform hover:scale-105 duration-200 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                              onClick={() => fetchPlaylist(playlist.id)}
                            >
                              <div className="relative pb-[100%] mb-3">
                                <img
                                  src={playlist.images?.[0]?.url || "/placeholder.svg?height=200&width=200"}
                                  alt={playlist.name}
                                  className="absolute inset-0 w-full h-full object-cover rounded-md shadow-md"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-md">
                                  <div className="bg-white dark:bg-gray-800 rounded-full p-3">
                                    <ListMusic className="h-6 w-6 text-primary" />
                                  </div>
                                </div>
                              </div>
                              <p className="font-medium truncate">{playlist.name}</p>
                              <p className="text-sm text-gray-500">{playlist.tracks?.total || 0} tracks</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p>You don't have any playlists yet</p>
                          <Button variant="outline" className="mt-4" onClick={fetchPlaylists}>
                            Refresh
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button
            variant="outline"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={logout}
          >
            Disconnect Spotify
          </Button>
        </>
      )}
    </div>
  )
}
