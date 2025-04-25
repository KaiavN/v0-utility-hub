import type {
  SpotifyAlbum,
  SpotifyArtist,
  SpotifyCategory,
  SpotifyPaging,
  SpotifyPlaybackState,
  SpotifyPlaylist,
  SpotifySearchResults,
  SpotifyTrack,
  SpotifyUser,
} from "./spotify-types"

const BASE_URL = "https://api.spotify.com/v1"

export class SpotifyAPI {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || "Failed to fetch from Spotify API")
    }

    return response.json()
  }

  // User profile
  async getCurrentUser(): Promise<SpotifyUser> {
    return this.fetch<SpotifyUser>("/me")
  }

  // Search
  async search(
    query: string,
    types: string[] = ["track", "artist", "album", "playlist"],
    limit = 20,
  ): Promise<SpotifySearchResults> {
    const params = new URLSearchParams({
      q: query,
      type: types.join(","),
      limit: limit.toString(),
    })
    return this.fetch<SpotifySearchResults>(`/search?${params.toString()}`)
  }

  // Browse
  async getFeaturedPlaylists(limit = 20): Promise<SpotifyPaging<SpotifyPlaylist>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })
    const response = await this.fetch<{ playlists: SpotifyPaging<SpotifyPlaylist> }>(
      `/browse/featured-playlists?${params.toString()}`,
    )
    return response.playlists
  }

  async getNewReleases(limit = 20): Promise<SpotifyPaging<SpotifyAlbum>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })
    const response = await this.fetch<{ albums: SpotifyPaging<SpotifyAlbum> }>(
      `/browse/new-releases?${params.toString()}`,
    )
    return response.albums
  }

  async getCategories(limit = 20): Promise<SpotifyPaging<SpotifyCategory>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })
    const response = await this.fetch<{ categories: SpotifyPaging<SpotifyCategory> }>(
      `/browse/categories?${params.toString()}`,
    )
    return response.categories
  }

  // Library
  async getUserPlaylists(limit = 50): Promise<SpotifyPaging<SpotifyPlaylist>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })
    return this.fetch<SpotifyPaging<SpotifyPlaylist>>(`/me/playlists?${params.toString()}`)
  }

  async getUserSavedTracks(limit = 50): Promise<SpotifyPaging<{ track: SpotifyTrack }>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })
    return this.fetch<SpotifyPaging<{ track: SpotifyTrack }>>(`/me/tracks?${params.toString()}`)
  }

  async getUserRecentlyPlayed(limit = 50): Promise<SpotifyPaging<{ track: SpotifyTrack }>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })
    return this.fetch<SpotifyPaging<{ track: SpotifyTrack }>>(`/me/player/recently-played?${params.toString()}`)
  }

  // Playlists
  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist & { tracks: SpotifyPaging<{ track: SpotifyTrack }> }> {
    return this.fetch<SpotifyPlaylist & { tracks: SpotifyPaging<{ track: SpotifyTrack }> }>(`/playlists/${playlistId}`)
  }

  // Albums
  async getAlbum(albumId: string): Promise<SpotifyAlbum & { tracks: SpotifyPaging<SpotifyTrack> }> {
    return this.fetch<SpotifyAlbum & { tracks: SpotifyPaging<SpotifyTrack> }>(`/albums/${albumId}`)
  }

  // Artists
  async getArtist(artistId: string): Promise<SpotifyArtist> {
    return this.fetch<SpotifyArtist>(`/artists/${artistId}`)
  }

  async getArtistTopTracks(artistId: string, market = "US"): Promise<{ tracks: SpotifyTrack[] }> {
    const params = new URLSearchParams({
      market,
    })
    return this.fetch<{ tracks: SpotifyTrack[] }>(`/artists/${artistId}/top-tracks?${params.toString()}`)
  }

  // Player
  async getPlaybackState(): Promise<SpotifyPlaybackState | null> {
    try {
      return await this.fetch<SpotifyPlaybackState>("/me/player")
    } catch (error) {
      return null
    }
  }

  async play(deviceId?: string, contextUri?: string, uris?: string[], positionMs?: number): Promise<void> {
    const params = new URLSearchParams()
    if (deviceId) {
      params.append("device_id", deviceId)
    }

    const body: any = {}
    if (contextUri) {
      body.context_uri = contextUri
    }
    if (uris && uris.length) {
      body.uris = uris
    }
    if (positionMs !== undefined) {
      body.position_ms = positionMs
    }

    await this.fetch(`/me/player/play?${params.toString()}`, {
      method: "PUT",
      body: Object.keys(body).length ? JSON.stringify(body) : undefined,
    })
  }

  async pause(deviceId?: string): Promise<void> {
    const params = new URLSearchParams()
    if (deviceId) {
      params.append("device_id", deviceId)
    }

    await this.fetch(`/me/player/pause?${params.toString()}`, {
      method: "PUT",
    })
  }

  async nextTrack(deviceId?: string): Promise<void> {
    const params = new URLSearchParams()
    if (deviceId) {
      params.append("device_id", deviceId)
    }

    await this.fetch(`/me/player/next?${params.toString()}`, {
      method: "POST",
    })
  }

  async previousTrack(deviceId?: string): Promise<void> {
    const params = new URLSearchParams()
    if (deviceId) {
      params.append("device_id", deviceId)
    }

    await this.fetch(`/me/player/previous?${params.toString()}`, {
      method: "POST",
    })
  }

  async seek(positionMs: number, deviceId?: string): Promise<void> {
    const params = new URLSearchParams({
      position_ms: positionMs.toString(),
    })
    if (deviceId) {
      params.append("device_id", deviceId)
    }

    await this.fetch(`/me/player/seek?${params.toString()}`, {
      method: "PUT",
    })
  }

  async setVolume(volumePercent: number, deviceId?: string): Promise<void> {
    const params = new URLSearchParams({
      volume_percent: Math.floor(volumePercent).toString(),
    })
    if (deviceId) {
      params.append("device_id", deviceId)
    }

    await this.fetch(`/me/player/volume?${params.toString()}`, {
      method: "PUT",
    })
  }
}
