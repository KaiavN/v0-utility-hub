"use client"

import type { SpotifyAlbum, SpotifyTrack } from "@/lib/spotify-types"
import { useSpotify } from "@/contexts/spotify-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, ExternalLink, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AlbumViewProps {
  album: SpotifyAlbum & { tracks: any }
}

export function AlbumView({ album }: AlbumViewProps) {
  const { playTrack, playContext } = useSpotify()

  const handlePlayTrack = (track: SpotifyTrack) => {
    playTrack(track.uri)
  }

  const handlePlayAlbum = () => {
    playContext(album.uri)
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatReleaseDate = (date: string) => {
    if (!date) return ""

    try {
      return new Date(date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return date
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 flex-shrink-0">
          <img
            src={album.images[0]?.url || "/placeholder.svg?height=192&width=192"}
            alt={album.name}
            className="w-full aspect-square object-cover rounded-md"
          />
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{album.name}</h1>
          <p className="text-muted-foreground mb-4">
            {album.artists.map((a) => a.name).join(", ")} •{" "}
            {album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1)} •{" "}
            {formatReleaseDate(album.release_date)}
          </p>

          <div className="flex flex-wrap gap-2 mb-4 text-sm text-muted-foreground">
            <span>{album.tracks.total} tracks</span>
          </div>

          <div className="flex gap-3">
            <Button onClick={handlePlayAlbum}>
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>

            <Button variant="outline" asChild>
              <a href={album.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Spotify
              </a>
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Tracks</CardTitle>
          <CardDescription>{album.tracks.total} tracks in this album</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2 p-2 border-b text-sm font-medium text-muted-foreground">
            <div className="col-span-1">#</div>
            <div className="col-span-9">Title</div>
            <div className="col-span-2 flex justify-end">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="divide-y">
            {album.tracks.items.map((track: SpotifyTrack, index: number) => (
              <div
                key={`${track.id}-${index}`}
                className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-accent group"
              >
                <div className="col-span-1 flex items-center">
                  <span className="group-hover:hidden">{index + 1}</span>
                  <button className="hidden group-hover:block" onClick={() => handlePlayTrack(track)}>
                    <Play className="h-4 w-4" />
                  </button>
                </div>

                <div className="col-span-9">
                  <p className="truncate font-medium">{track.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>

                <div className="col-span-2 text-right text-muted-foreground">{formatDuration(track.duration_ms)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
