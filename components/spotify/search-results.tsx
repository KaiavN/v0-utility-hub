"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface SpotifySearchResult {
  tracks?: { items: any[] }
  albums?: { items: any[] }
  artists?: { items: any[] }
}

interface SearchResultsProps {
  query: string
}

const SearchResults: React.FC<SearchResultsProps> = ({ query }) => {
  const [results, setResults] = useState<SpotifySearchResult>({
    tracks: { items: [] },
    albums: { items: [] },
    artists: { items: [] },
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query || query.trim() === "") return

    const fetchResults = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`)

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`)
        }

        const data = await response.json()
        console.log("Search results:", data)

        if (data && (data.tracks?.items || data.albums?.items || data.artists?.items)) {
          setResults(data)
        } else {
          console.error("Invalid search response format:", data)
          setResults({ tracks: { items: [] }, albums: { items: [] }, artists: { items: [] } })
        }
      } catch (error) {
        console.error("Error searching Spotify:", error)
        setResults({ tracks: { items: [] }, albums: { items: [] }, artists: { items: [] } })
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {results.tracks?.items.length > 0 && (
        <div>
          <h3>Tracks</h3>
          <ul>
            {results.tracks.items.map((track: any) => (
              <li key={track.id}>
                {track.name} - {track.artists.map((artist: any) => artist.name).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.albums?.items.length > 0 && (
        <div>
          <h3>Albums</h3>
          <ul>
            {results.albums.items.map((album: any) => (
              <li key={album.id}>
                {album.name} - {album.artists.map((artist: any) => artist.name).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.artists?.items.length > 0 && (
        <div>
          <h3>Artists</h3>
          <ul>
            {results.artists.items.map((artist: any) => (
              <li key={artist.id}>{artist.name}</li>
            ))}
          </ul>
        </div>
      )}

      {!loading &&
        results.tracks?.items.length === 0 &&
        results.albums?.items.length === 0 &&
        results.artists?.items.length === 0 &&
        query.trim() !== "" && <div>No results found.</div>}
    </div>
  )
}

export default SearchResults
