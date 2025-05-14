import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { supabaseConfig } from "@/lib/env-config"

// Create a singleton instance to avoid multiple instances
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export const createClient = () => {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Try to get URL and key from multiple possible sources
  const supabaseUrl =
    process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL || supabaseConfig.publicUrl || process.env.STORAGE_SUPABASE_URL || ""

  const supabaseAnonKey = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.publicAnonKey || ""

  // Log available environment variables for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("Supabase Client Config:", {
      url: supabaseUrl ? "Available" : "Missing",
      key: supabaseAnonKey ? "Available" : "Missing",
      urlSource: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL
        ? "STORAGE_NEXT_PUBLIC_SUPABASE_URL"
        : supabaseConfig.publicUrl
          ? "supabaseConfig.publicUrl"
          : process.env.STORAGE_SUPABASE_URL
            ? "STORAGE_SUPABASE_URL"
            : "None",
      keySource: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY"
        : supabaseConfig.publicAnonKey
          ? "supabaseConfig.publicAnonKey"
          : "None",
    })
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables, using fallback values")
    // Use fallback values from the existing config
    supabaseInstance = createSupabaseClient(
      "https://hguhugnlvlmvtrduwiyn.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndWh1Z25sdmxtdnRyZHV3aXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU2MzA0MDAsImV4cCI6MjAzMTIwNjQwMH0.Nh83ebqzf9Yt_1oJHn5DYMwkF_jnHkrZVWrDFzQDiKM",
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    )
    return supabaseInstance
  }

  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return supabaseInstance
}
