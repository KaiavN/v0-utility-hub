import { createClient } from "@supabase/supabase-js"
import { supabaseConfig } from "./env-config"

// Create a Supabase client for server-side use
export function createSupabaseServerClient() {
  const { url, serviceKey } = supabaseConfig

  if (!url || !serviceKey) {
    console.error("Missing Supabase environment variables for server-side")
    return createDummyClient()
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Create a dummy client for error handling
function createDummyClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      delete: () => Promise.resolve({ error: null }),
      update: () => Promise.resolve({ error: null }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
  }
}
