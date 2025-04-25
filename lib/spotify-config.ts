// Central place for Spotify configuration
export const SPOTIFY_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "",
  CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || "",
  REDIRECT_URI:
    typeof window !== "undefined"
      ? `${window.location.origin}/spotify/callback`
      : typeof process.env.VERCEL_URL !== "undefined"
        ? `https://${process.env.VERCEL_URL}/spotify/callback`
        : "http://localhost:3000/spotify/callback",
  SCOPES: [
    "user-read-private",
    "user-read-email",
    "user-library-read",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-read-recently-played",
    "streaming",
    "playlist-read-private",
    "playlist-read-collaborative",
    "app-remote-control",
  ],
}
