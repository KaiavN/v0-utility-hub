"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode, useRef, useCallback } from "react"
import { SpotifyAPI } from "@/lib/spotify-api"
import type { SpotifyTrack, SpotifyUser, SpotifyPlayerState } from "@/lib/spotify-types"
import { toast } from "@/components/ui/use-toast"
import { SPOTIFY_CONFIG } from "@/lib/spotify-config"

interface Device {
  id: string
  name: string
  type: string
  is_active: boolean
  volume_percent: number
}

interface SpotifyContextType {
  isAuthenticated: boolean
  isInitializing: boolean
  user: SpotifyUser | null
  api: SpotifyAPI | null
  currentTrack: SpotifyTrack | null
  isPlaying: boolean
  duration: number
  position: number
  volume: number
  deviceId: string | null
  playbackPosition: number
  playbackDuration: number
  devices: Device[]
  selectedDeviceId: string | null
  webPlayerReady: boolean
  webPlayerActive: boolean
  isInitializingPlayer: boolean
  isPlaybackLoading: boolean
  isPremium: boolean | null
  noActiveDevice: boolean
  searchResults: any
  playlists: any[]
  selectedPlaylist: any | null
  login: () => void
  logout: () => void
  playTrack: (trackUri: string) => Promise<void>
  playContext: (contextUri: string, trackIndex?: number) => Promise<void>
  togglePlayPause: () => Promise<void>
  seekTo: (positionMs: number) => Promise<void>
  skipToNext: () => Promise<void>
  skipToPrevious: () => Promise<void>
  setVolume: (volumePercent: number) => Promise<void>
  initializeWebPlayer: () => void
  fetchDevices: () => Promise<void>
  fetchPlaylists: () => Promise<void>
  fetchPlaylist: (playlistId: string) => Promise<void>
  handleSearch: (query: string) => Promise<void>
  setSelectedDeviceId: (deviceId: string | null) => void
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined)

const CLIENT_ID = SPOTIFY_CONFIG.CLIENT_ID
const REDIRECT_URI = SPOTIFY_CONFIG.REDIRECT_URI
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
const SCOPES = SPOTIFY_CONFIG.SCOPES

const TOKEN_KEY = "spotify_access_token"
const TOKEN_EXPIRY_KEY = "spotify_token_expiry"

// Declare the Spotify variable
declare global {
  interface Window {
    Spotify: any
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

export const SpotifyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [api, setApi] = useState<SpotifyAPI | null>(null)
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [volume, setVolumeState] = useState(50)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [playbackDuration, setPlaybackDuration] = useState(0)
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [webPlayerActive, setWebPlayerActive] = useState(false)
  const [isInitializingPlayer, setIsInitializingPlayer] = useState(false)
  const [isPlaybackLoading, setIsPlaybackLoading] = useState(false)
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [noActiveDevice, setNoActiveDevice] = useState(false)
  const [searchResults, setSearchResults] = useState<any>({})
  const [playlists, setPlaylists] = useState<any[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null)
  const requestAnimationRef = useRef<number | null>(null)
  const playerStateUpdateTimeRef = useRef<number>(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const [playerReady, setPlayerReady] = useState(false)

  // Initialize Spotify SDK
  useEffect(() => {
    if (!window.Spotify && !document.getElementById("spotify-player")) {
      const script = document.createElement("script")
      script.id = "spotify-player"
      script.src = "https://sdk.scdn.co/spotify-player.js"
      script.async = true
      document.body.appendChild(script)
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("Spotify Web Playback SDK Ready")
      setPlayerReady(true)
    }

    return () => {
      if (player) {
        player.disconnect()
      }

      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }

      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current)
      }

      const script = document.getElementById("spotify-player")
      if (script) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Check for existing token and initialize API
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)

        if (token && expiry && new Date().getTime() < Number.parseInt(expiry, 10)) {
          const spotifyApi = new SpotifyAPI(token)
          setApi(spotifyApi)

          try {
            const userData = await spotifyApi.getCurrentUser()
            setUser(userData)
            setIsAuthenticated(true)
            setIsPremium(userData.product === "premium")
            initializePlayer(token)

            // Fetch playlists and devices
            fetchPlaylists()
            fetchDevices()
          } catch (error) {
            console.error("Error fetching user data:", error)
            logout()
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setIsInitializing(false)
      }
    }

    checkAuth()
  }, [])

  const initializeWebPlayer = useCallback(() => {
    if (!api || !api.getAccessToken()) {
      toast({
        title: "Authentication Required",
        description: "Please reconnect your Spotify account.",
        variant: "destructive",
      })
      return
    }

    if (isInitializingPlayer) {
      return // Already initializing
    }

    console.log("Manually initializing web player...")
    setIsInitializingPlayer(true)

    // If the SDK is loaded but player failed to initialize
    if (window.Spotify && !playerReady) {
      initializePlayer(api.getAccessToken())
      return
    }

    // If SDK failed to load, reload it
    if (typeof window !== "undefined" && !window.Spotify) {
      const existingScript = document.getElementById("spotify-player")
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement("script")
      script.id = "spotify-player"
      script.src = "https://sdk.scdn.co/spotify-player.js"
      script.async = true

      script.onload = () => {
        console.log("Spotify Web Playback SDK reloaded")
        initializePlayer(api.getAccessToken())
      }

      document.body.appendChild(script)
    }
  }, [api, isInitializingPlayer, playerReady])

  const fetchDevices = async () => {
    if (!api) return

    try {
      const deviceData = await api.getMyDevices()
      console.log("Available devices:", deviceData.devices)

      // Add web player to devices if it's ready
      const deviceList = [...(deviceData.devices || [])]
      if (playerReady && deviceId) {
        // Check if web player is already in the list
        const webPlayerExists = deviceList.some((d) => d.id === deviceId)

        if (!webPlayerExists) {
          deviceList.push({
            id: deviceId,
            name: "Utility Hub Web Player",
            type: "Computer",
            is_active: selectedDeviceId === deviceId,
            volume_percent: volume,
          })
        }
      }

      setDevices(deviceList)

      // If we have active devices
      if (deviceList.length > 0) {
        // Set no active device to false
        setNoActiveDevice(false)

        // PRIORITY ORDER:
        // 1. Web player if ready
        // 2. Currently active device
        // 3. First available device
        if (playerReady && deviceId) {
          // Always prioritize web player when it's ready
          setSelectedDeviceId(deviceId)
        } else {
          // Find active device or use first one
          const activeDevice = deviceList.find((d: Device) => d.is_active)
          if (activeDevice) {
            console.log("Active device found:", activeDevice.name)
            setSelectedDeviceId(activeDevice.id)
          } else if (!selectedDeviceId && deviceList[0].id) {
            setSelectedDeviceId(deviceList[0].id)
          }
        }
      } else {
        setNoActiveDevice(!playerReady)
        console.log("No active devices found")
      }
    } catch (error) {
      console.error("Error fetching devices:", error)
    }
  }

  const fetchPlaylists = async () => {
    if (!api) return

    try {
      const playlistData = await api.getUserPlaylists()
      console.log("Playlists loaded:", playlistData.items?.length || 0)
      setPlaylists(playlistData.items || [])
    } catch (error) {
      console.error("Error fetching playlists:", error)
    }
  }

  const fetchPlaylist = async (playlistId: string) => {
    if (!api) return

    try {
      setSelectedPlaylist(null) // Clear previous playlist first

      console.log("Fetching playlist:", playlistId)
      const data = await api.getPlaylist(playlistId)

      // Ensure we have valid playlist data
      if (!data || !data.id) {
        console.error("Invalid playlist data structure:", data)
        toast({
          title: "Error",
          description: "Invalid playlist data returned. Please try again.",
          variant: "destructive",
        })
        return
      }

      console.log("Playlist loaded successfully:", data.name, "with", data.tracks.items.length, "tracks")
      setSelectedPlaylist(data)
    } catch (error) {
      console.error("Error fetching playlist:", error)
      toast({
        title: "Error",
        description: "Failed to load playlist. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSearch = async (query: string) => {
    if (!api || !query.trim()) {
      setSearchResults({})
      return
    }

    try {
      const data = await api.search(query, ["track", "artist", "album"])
      setSearchResults(data)
    } catch (error) {
      console.error("Error searching:", error)
      toast({
        title: "Search Error",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      })
    }
  }

  const initializePlayer = (token: string) => {
    if (!window.Spotify) {
      setTimeout(() => initializePlayer(token), 1000)
      return
    }

    const newPlayer = new window.Spotify.Player({
      name: "Utility Hub Web Player",
      getOAuthToken: (cb) => {
        cb(token)
      },
      volume: 0.5,
    })

    newPlayer.addListener("ready", ({ device_id }) => {
      console.log("Ready with Device ID", device_id)
      setDeviceId(device_id)
      setSelectedDeviceId(device_id)
      setNoActiveDevice(false)
      setIsInitializingPlayer(false)
      setWebPlayerActive(true)

      // Start polling for player state
      progressInterval.current = setInterval(() => {
        newPlayer.getCurrentState().then((state: SpotifyPlayerState) => {
          if (state) {
            const currentTime = Date.now()
            // Only update if more than 500ms has passed
            if (currentTime - playerStateUpdateTimeRef.current > 500) {
              playerStateUpdateTimeRef.current = currentTime
              processPlayerState(state)
            }
          }
        })
      }, 1000)

      // Add this code to ensure the player stays active during navigation
      // This helps prevent the player from disconnecting during page transitions
      window.addEventListener("beforeunload", (event) => {
        // Only prevent unload if music is playing
        if (isPlaying) {
          // This will show a confirmation dialog when trying to leave the site
          event.preventDefault()
          event.returnValue = ""
        }
      })

      // Activate this device immediately
      api
        ?.transferMyPlayback([device_id], { play: false })
        .then(() => {
          console.log("Successfully transferred playback to web player")

          // Try to get the player ready for immediate playback
          newPlayer
            .activateElement()
            .then(() => {
              console.log("Player element activated and ready for playback")
            })
            .catch((err) => {
              console.warn("Could not activate player element:", err)
            })

          // Show success message
          toast({
            title: "Web Player Connected",
            description: "Music will now play directly in your browser. Click on any song to play!",
          })
        })
        .catch((err) => {
          console.error("Error transferring playback:", err)
        })
    })

    newPlayer.addListener("not_ready", ({ device_id }) => {
      console.log("Web player disconnected:", device_id)
      setPlayerReady(false)
      setWebPlayerActive(false)

      toast({
        title: "Web Player Disconnected",
        description: "The web player has been disconnected. Trying to reconnect...",
        variant: "destructive",
      })

      // Clear interval
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }

      // Try to reconnect
      setTimeout(() => {
        if (newPlayer) {
          newPlayer.connect()
        }
      }, 3000)
    })

    newPlayer.addListener("player_state_changed", (state: SpotifyPlayerState) => {
      if (!state) return

      playerStateUpdateTimeRef.current = Date.now()
      processPlayerState(state)

      // If we get a state update, the player is definitely active
      setWebPlayerActive(true)
    })

    // Add error handling
    newPlayer.addListener("initialization_error", ({ message }) => {
      console.error("Failed to initialize player:", message)
      toast({
        title: "Player Error",
        description: "Failed to initialize Spotify player. Please try again.",
        variant: "destructive",
      })
      setIsInitializingPlayer(false)
    })

    newPlayer.addListener("authentication_error", ({ message }) => {
      console.error("Failed to authenticate:", message)
      toast({
        title: "Authentication Error",
        description: "Failed to authenticate with Spotify. Please reconnect.",
        variant: "destructive",
      })
      setIsInitializingPlayer(false)
    })

    newPlayer.addListener("account_error", ({ message }) => {
      console.error("Account error:", message)
      toast({
        title: "Premium Required",
        description: "Spotify Premium is required to use the web player.",
        variant: "destructive",
      })
      setIsPremium(false)
      setIsInitializingPlayer(false)
    })

    newPlayer.connect().then((success) => {
      if (success) {
        console.log("Successfully connected to Spotify!")
        setWebPlayerActive(true)
      } else {
        console.error("Failed to connect the player")
        setIsInitializingPlayer(false)
        setWebPlayerActive(false)

        toast({
          title: "Connection Error",
          description: "Failed to connect to Spotify. Please try again.",
          variant: "destructive",
        })
      }
    })

    setPlayer(newPlayer)
  }

  const processPlayerState = (state: SpotifyPlayerState) => {
    if (!state) return

    const {
      paused,
      position,
      duration,
      track_window: { current_track },
    } = state

    // Update playback state
    setIsPlaying(!paused)
    setPosition(position)
    setPlaybackPosition(position)
    setDuration(duration)
    setPlaybackDuration(duration)

    if (current_track) {
      const trackData: SpotifyTrack = {
        id: current_track.id,
        name: current_track.name,
        uri: current_track.uri,
        href: "",
        duration_ms: current_track.duration_ms,
        explicit: false,
        preview_url: null,
        external_urls: { spotify: "" },
        album: {
          id: "",
          name: current_track.album.name,
          uri: "",
          href: "",
          images: current_track.album.images.map((img) => ({ url: img.url, height: null, width: null })),
          release_date: "",
          album_type: "",
          artists: [],
          external_urls: { spotify: "" },
        },
        artists: current_track.artists.map((artist) => ({
          id: "",
          name: artist.name,
          uri: "",
          href: "",
          external_urls: { spotify: "" },
        })),
      }

      setCurrentTrack(trackData)
    }

    // Update progress in real-time when playing
    if (!paused) {
      updateProgress(position, duration)
    } else if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current)
    }
  }

  const updateProgress = (startPosition: number, duration: number) => {
    const startTime = Date.now()

    const animate = () => {
      // Calculate how much time has passed
      const timePassed = Date.now() - startTime
      // Add that to our starting position
      const currentPosition = startPosition + timePassed

      if (currentPosition < duration) {
        setPosition(currentPosition)
        setPlaybackPosition(currentPosition)
        requestAnimationRef.current = requestAnimationFrame(animate)
      } else {
        setPosition(duration)
        setPlaybackPosition(duration)
      }
    }

    if (requestAnimationRef.current) {
      cancelAnimationFrame(requestAnimationRef.current)
    }

    requestAnimationRef.current = requestAnimationFrame(animate)
  }

  // Position update interval
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying) {
      interval = setInterval(() => {
        setPosition((prev) => {
          if (prev >= duration) {
            clearInterval(interval)
            return 0
          }
          return prev + 1000
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, duration])

  const login = () => {
    if (!CLIENT_ID) {
      console.error("Spotify Client ID is not defined")
      return
    }

    const state = Math.random().toString(36).substring(2, 15)
    localStorage.setItem("spotify_auth_state", state)

    const authUrl = new URL(AUTH_ENDPOINT)
    authUrl.searchParams.append("client_id", CLIENT_ID)
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI)
    authUrl.searchParams.append("scope", SCOPES.join(" "))
    authUrl.searchParams.append("response_type", "token")
    authUrl.searchParams.append("state", state)
    authUrl.searchParams.append("show_dialog", "true")

    window.location.href = authUrl.toString()
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)

    if (player) {
      player.disconnect()
    }

    setIsAuthenticated(false)
    setUser(null)
    setApi(null)
    setPlayer(null)
    setDeviceId(null)
    setCurrentTrack(null)
    setIsPlaying(false)
  }

  const playTrack = async (trackUri: string) => {
    if (!api || !deviceId) return

    try {
      await api.play(deviceId, undefined, [trackUri])
    } catch (error) {
      console.error("Error playing track:", error)
    }
  }

  const playContext = async (contextUri: string, trackIndex?: number) => {
    if (!api || !deviceId) return

    try {
      await api.play(deviceId, contextUri)
    } catch (error) {
      console.error("Error playing context:", error)
    }
  }

  const togglePlayPause = async () => {
    if (!api || !deviceId) return

    try {
      if (isPlaying) {
        await api.pause(deviceId)
      } else {
        await api.play(deviceId)
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error)
    }
  }

  const seekTo = async (positionMs: number) => {
    if (!api || !deviceId) return

    try {
      await api.seek(positionMs, deviceId)
      setPosition(positionMs)
    } catch (error) {
      console.error("Error seeking:", error)
    }
  }

  const skipToNext = async () => {
    if (!api || !deviceId) return

    try {
      await api.nextTrack(deviceId)
    } catch (error) {
      console.error("Error skipping to next track:", error)
    }
  }

  const skipToPrevious = async () => {
    if (!api || !deviceId) return

    try {
      await api.previousTrack(deviceId)
    } catch (error) {
      console.error("Error skipping to previous track:", error)
    }
  }

  const setVolume = async (volumePercent: number) => {
    if (!api || !deviceId) return

    try {
      await api.setVolume(volumePercent, deviceId)
      setVolumeState(volumePercent)
    } catch (error) {
      console.error("Error setting volume:", error)
    }
  }

  const value = {
    isAuthenticated,
    isInitializing,
    user,
    api,
    currentTrack,
    isPlaying,
    duration,
    position,
    volume,
    deviceId,
    playbackPosition,
    playbackDuration,
    devices,
    selectedDeviceId,
    webPlayerReady: playerReady,
    webPlayerActive,
    isInitializingPlayer,
    isPlaybackLoading,
    isPremium,
    noActiveDevice,
    searchResults,
    playlists,
    selectedPlaylist,
    login,
    logout,
    playTrack,
    playContext,
    togglePlayPause,
    seekTo,
    skipToNext,
    skipToPrevious,
    setVolume,
    initializeWebPlayer,
    fetchDevices,
    fetchPlaylists,
    fetchPlaylist,
    handleSearch,
    setSelectedDeviceId,
  }

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
}

export const useSpotify = () => {
  const context = useContext(SpotifyContext)
  if (context === undefined) {
    throw new Error("useSpotify must be used within a SpotifyProvider")
  }
  return context
}
