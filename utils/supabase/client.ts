import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { logAllEnvStatus } from "@/lib/env-debug"

// Create a singleton instance to avoid multiple instances
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export const createClient = () => {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Try different environment variables for the URL
  const supabaseUrl =
    process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.STORAGE_SUPABASE_URL ||
    "https://hguhugnlvlmvtrduwiyn.supabase.co"

  // Try different environment variables for the anon key
  const supabaseAnonKey =
    process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndWh1Z25sdmxtdnRyZHV3aXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU2MzA0MDAsImV4cCI6MjAzMTIwNjQwMH0.Nh83ebqzf9Yt_1oJHn5DYMwkF_jnHkrZVWrDFzQDiKM"

  // Log environment variable status in development mode or if debugging is enabled
  if (process.env.NODE_ENV === "development" || process.env.ENABLE_ENV_DEBUG === "true") {
    console.log("Supabase Client Config:", {
      urlSource: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL
        ? "STORAGE_NEXT_PUBLIC_SUPABASE_URL"
        : process.env.NEXT_PUBLIC_SUPABASE_URL
          ? "NEXT_PUBLIC_SUPABASE_URL"
          : process.env.STORAGE_SUPABASE_URL
            ? "STORAGE_SUPABASE_URL"
            : "fallback",
      keySource: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY"
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? "NEXT_PUBLIC_SUPABASE_ANON_KEY"
          : "fallback",
    })

    // Additional debug info only visible in development
    if (process.env.NODE_ENV === "development") {
      logAllEnvStatus()
    }
  }

  // Create options with auth configuration
  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }

  // Create and store the Supabase client
  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, options)

  return supabaseInstance
}
