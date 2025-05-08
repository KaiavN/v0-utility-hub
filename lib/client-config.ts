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

  // App URL
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
}
