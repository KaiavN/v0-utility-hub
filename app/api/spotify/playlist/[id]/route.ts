import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const playlistId = params.id
    console.log("Fetching playlist:", playlistId)

    // First, get the playlist details
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error("Failed to fetch playlist:", response.status)
      return NextResponse.json({ error: "Failed to fetch playlist" }, { status: response.status })
    }

    const playlist = await response.json()

    // If the playlist has a lot of tracks, we might need to fetch them separately
    // because the initial response might not include all tracks
    if (playlist.tracks && playlist.tracks.total > playlist.tracks.items.length) {
      console.log(
        `Playlist has ${playlist.tracks.total} tracks, but only ${playlist.tracks.items.length} were returned. Fetching all tracks...`,
      )

      // Fetch all tracks for the playlist
      const allTracks = await fetchAllPlaylistTracks(playlistId, accessToken)

      if (allTracks) {
        playlist.tracks.items = allTracks
      }
    }

    console.log(`Returning playlist with ${playlist.tracks?.items?.length || 0} tracks`)
    return NextResponse.json(playlist)
  } catch (error) {
    console.error("Error fetching playlist:", error)
    return NextResponse.json({ error: "An error occurred while fetching the playlist" }, { status: 500 })
  }
}

async function fetchAllPlaylistTracks(playlistId: string, accessToken: string) {
  try {
    let tracks: any[] = []
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`

    while (url) {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        console.error("Failed to fetch playlist tracks:", response.status)
        return null
      }

      const data = await response.json()
      tracks = [...tracks, ...data.items]

      // If there are more tracks, continue fetching
      url = data.next
    }

    return tracks
  } catch (error) {
    console.error("Error fetching all playlist tracks:", error)
    return null
  }
}
