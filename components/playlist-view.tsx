"use client"

import type { SpotifyPlaylist, SpotifyTrack } from "@/lib/spotify-types"
import { useSpotify } from "@/contexts/spotify-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, ExternalLink, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlaylistViewProps {
  playlist: SpotifyPlaylist & { tracks: any }
}

export function PlaylistView({ playlist }: PlaylistViewProps) {
  const { playTrack, playContext } = useSpotify()

  const handlePlayTrack = (track: SpotifyTrack) => {
    playTrack(track.uri)
  }

  const handlePlayPlaylist = () => {
    playContext(playlist.uri)
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 flex-shrink-0">
          <img
            src={playlist.images[0]?.url || "/placeholder.svg?height=192&width=192"}
            alt={playlist.name}
            className="w-full aspect-square object-cover rounded-md"
          />
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{playlist.name}</h1>
          <p className="text-muted-foreground mb-4">{playlist.description}</p>

          <div className="flex flex-wrap gap-2 mb-4 text-sm text-muted-foreground">
            <span>By {playlist.owner.display_name}</span>
            <span>•</span>
            <span>{playlist.tracks.total} tracks</span>
          </div>

          <div className="flex gap-3">
            <Button onClick={handlePlayPlaylist}>
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>

            <Button variant="outline" asChild>
              <a href={playlist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
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
          <CardDescription>{playlist.tracks.total} tracks in this playlist</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2 p-2 border-b text-sm font-medium text-muted-foreground">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Title</div>
            <div className="col-span-4">Album</div>
            <div className="col-span-2 flex justify-end">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="divide-y">
            {playlist.tracks.items.map((item: any, index: number) => {
              const track = item.track
              if (!track) return null // Skip null tracks

              return (
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

                  <div className="col-span-5 flex items-center gap-3">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        src={track.album.images[0]?.url || "/placeholder.svg?height=40&width=40"}
                        alt={track.name}
                        className="h-full w-full object-cover rounded-sm"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{track.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artists.map((a: any) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-4 truncate text-muted-foreground">{track.album.name}</div>

                  <div className="col-span-2 text-right text-muted-foreground">{formatDuration(track.duration_ms)}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
