import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  // Return the existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Get environment variables with STORAGE_ prefix
  const supabaseUrl = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables")
  }

  // Create a new client
  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return supabaseInstance
}
