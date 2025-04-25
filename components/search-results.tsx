"use client"

import type {
  SpotifySearchResults,
  SpotifyTrack,
  SpotifyAlbum,
  SpotifyPlaylist,
  SpotifyArtist,
} from "@/lib/spotify-types"
import { useSpotify } from "@/contexts/spotify-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Play, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchResultsProps {
  results: SpotifySearchResults
  onSelectPlaylist: (playlist: SpotifyPlaylist) => void
  onSelectAlbum: (album: SpotifyAlbum) => void
}

export function SearchResults({ results, onSelectPlaylist, onSelectAlbum }: SearchResultsProps) {
  const { playTrack } = useSpotify()

  const handlePlayTrack = (track: SpotifyTrack) => {
    playTrack(track.uri)
  }

  return (
    <Tabs defaultValue="tracks">
      <TabsList className="mb-4">
        <TabsTrigger value="tracks">Tracks</TabsTrigger>
        <TabsTrigger value="artists">Artists</TabsTrigger>
        <TabsTrigger value="albums">Albums</TabsTrigger>
        <TabsTrigger value="playlists">Playlists</TabsTrigger>
      </TabsList>

      <TabsContent value="tracks">
        <div className="space-y-2">
          {results.tracks?.items.length === 0 && (
            <p className="text-center py-4 text-muted-foreground">No tracks found</p>
          )}

          {results.tracks?.items.map((track) => (
            <div key={track.id} className="flex items-center p-2 rounded-md hover:bg-accent group">
              <div className="h-12 w-12 mr-4 relative">
                <img
                  src={track.album.images[0]?.url || "/placeholder.svg?height=48&width=48"}
                  alt={track.name}
                  className="h-full w-full object-cover rounded-md"
                />
                <div
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
                  onClick={() => handlePlayTrack(track)}
                >
                  <Play className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-sm text-muted-foreground truncate">{track.artists.map((a) => a.name).join(", ")}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.floor(track.duration_ms / 60000)}:
                {Math.floor((track.duration_ms % 60000) / 1000)
                  .toString()
                  .padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="artists">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.artists?.items.length === 0 && (
            <p className="text-center py-4 text-muted-foreground col-span-full">No artists found</p>
          )}

          {results.artists?.items.map((artist: SpotifyArtist) => (
            <Card key={artist.id}>
              <CardContent className="p-4">
                <div className="aspect-square mb-3 overflow-hidden rounded-full">
                  <img
                    src={artist.images?.[0]?.url || "/placeholder.svg?height=150&width=150"}
                    alt={artist.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="font-medium leading-none truncate">{artist.name}</h3>
                  <p className="text-xs text-muted-foreground">Artist</p>
                </div>
                <div className="mt-3 flex justify-center">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="albums">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.albums?.items.length === 0 && (
            <p className="text-center py-4 text-muted-foreground col-span-full">No albums found</p>
          )}

          {results.albums?.items.map((album) => (
            <Card
              key={album.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSelectAlbum(album)}
            >
              <CardContent className="p-4">
                <div className="aspect-square mb-3 overflow-hidden rounded-md">
                  <img
                    src={album.images[0]?.url || "/placeholder.svg?height=150&width=150"}
                    alt={album.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium leading-none truncate">{album.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {album.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="playlists">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.playlists?.items.length === 0 && (
            <p className="text-center py-4 text-muted-foreground col-span-full">No playlists found</p>
          )}

          {results.playlists?.items.map((playlist) => (
            <Card
              key={playlist.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSelectPlaylist(playlist)}
            >
              <CardContent className="p-4">
                <div className="aspect-square mb-3 overflow-hidden rounded-md">
                  <img
                    src={playlist.images[0]?.url || "/placeholder.svg?height=150&width=150"}
                    alt={playlist.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium leading-none truncate">{playlist.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{playlist.owner.display_name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
