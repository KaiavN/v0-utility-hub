// Client-side safe configuration
// This file contains environment variables that are safe to use on the client

// For client-side environment variables, we need to use NEXT_PUBLIC_ prefix
export const clientConfig = {
  // App environment
  isDevelopment: process.env.NODE_ENV === "development",

  // Spotify
  spotifyClientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "",

  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",

  // App URL - use the deployed URL in production, localhost in development
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://utilhub.vercel.app"),
}
