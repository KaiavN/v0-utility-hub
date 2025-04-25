// Types for Spotify API responses
export interface SpotifyImage {
  url: string
  height: number | null
  width: number | null
}

export interface SpotifyArtist {
  id: string
  name: string
  uri: string
  href: string
  external_urls: {
    spotify: string
  }
  images?: SpotifyImage[]
}

export interface SpotifyAlbum {
  id: string
  name: string
  uri: string
  href: string
  images: SpotifyImage[]
  release_date: string
  album_type: string
  artists: SpotifyArtist[]
  external_urls: {
    spotify: string
  }
}

export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  href: string
  duration_ms: number
  explicit: boolean
  album: SpotifyAlbum
  artists: SpotifyArtist[]
  preview_url: string | null
  external_urls: {
    spotify: string
  }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  uri: string
  href: string
  description: string
  images: SpotifyImage[]
  owner: {
    id: string
    display_name: string
  }
  tracks: {
    total: number
    href: string
  }
  external_urls: {
    spotify: string
  }
}

export interface SpotifyCategory {
  id: string
  name: string
  href: string
  icons: SpotifyImage[]
}

export interface SpotifyPaging<T> {
  href: string
  items: T[]
  limit: number
  next: string | null
  offset: number
  previous: string | null
  total: number
}

export interface SpotifySearchResults {
  tracks?: SpotifyPaging<SpotifyTrack>
  artists?: SpotifyPaging<SpotifyArtist>
  albums?: SpotifyPaging<SpotifyAlbum>
  playlists?: SpotifyPaging<SpotifyPlaylist>
}

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: SpotifyImage[]
  country: string
  product: string
  external_urls: {
    spotify: string
  }
}

export interface SpotifyPlaybackState {
  device: {
    id: string
    is_active: boolean
    is_private_session: boolean
    is_restricted: boolean
    name: string
    type: string
    volume_percent: number
  }
  repeat_state: string
  shuffle_state: boolean
  context: {
    uri: string
    href: string
    external_urls: {
      spotify: string
    }
    type: string
  } | null
  timestamp: number
  progress_ms: number
  is_playing: boolean
  item: SpotifyTrack | null
}

export interface SpotifyPlayerState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      uri: string
      name: string
      duration_ms: number
      artists: Array<{ name: string }>
      album: {
        name: string
        images: Array<{ url: string }>
      }
    }
    previous_tracks: Array<any>
    next_tracks: Array<any>
  }
}
