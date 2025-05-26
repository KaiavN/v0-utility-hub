import { createClient } from "@supabase/supabase-js"
import { supabaseConfig } from "./env-config"

// Re-export createClient from @supabase/supabase-js
export { createClient } from "@supabase/supabase-js"

// Create a singleton Supabase client
let supabaseInstance: any = null
let configPromise: Promise<{ url: string; anonKey: string }> | null = null

// Function to fetch Supabase configuration
async function getSupabaseConfig() {
  // Check if we're on the server
  if (typeof window === "undefined") {
    // Server-side: Use environment variables
    const url = process.env.STORAGE_SUPABASE_URL || process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL || ""
    const anonKey = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    const serviceKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || ""

    if (!url || !anonKey) {
      console.warn("Missing Supabase environment variables on server")
    }

    return { url, anonKey, serviceKey }
  }

  // Client-side: Try to fetch from API if needed
  try {
    // Check localStorage first for faster startup
    const cachedConfig = localStorage.getItem("supabaseConfig")
    if (cachedConfig) {
      const parsed = JSON.parse(cachedConfig)
      if (parsed.url && parsed.anonKey) {
        return parsed
      }
    }

    // Fetch from API
    const response = await fetch("/api/config/supabase")
    if (!response.ok) {
      throw new Error(`Failed to fetch Supabase config: ${response.status}`)
    }

    const config = await response.json()
    if (!config.url || !config.anonKey) {
      throw new Error("Invalid Supabase configuration received")
    }

    // Cache for next time
    localStorage.setItem("supabaseConfig", JSON.stringify(config))
    return config
  } catch (error) {
    console.error("Error fetching Supabase config:", error)

    // Fallback to hardcoded values from env-config
    return {
      url: supabaseConfig.publicUrl || supabaseConfig.url,
      anonKey: supabaseConfig.publicAnonKey || supabaseConfig.anonKey,
      serviceKey: supabaseConfig.serviceKey,
    }
  }
}

// Function to create a Supabase client
export async function createSupabaseClientAsync() {
  try {
    // Get configuration
    const config = await getSupabaseConfig()

    // Validate config
    if (!config.url) {
      throw new Error("Supabase URL is required")
    }

    if (!config.anonKey) {
      throw new Error("Supabase anon key is required")
    }

    // For server-side rendering, always create a new instance
    if (typeof window === "undefined") {
      return createClient(config.url, config.serviceKey || config.anonKey)
    }

    // For client-side, use singleton pattern
    if (!supabaseInstance) {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "sb-auth-token",
          flowType: "pkce",
          detectSessionInUrl: true,
          // Specify cookie options carefully
          cookieOptions: {
            secure: typeof window !== "undefined" && window.location.protocol === "https:",
            sameSite: "Lax",
            path: "/",
          },
        },
        // Completely disable realtime
        realtime: {
          enabled: false,
        },
        global: {
          headers: {
            "x-application-name": "utility-hub",
          },
        },
      })
    }

    return supabaseInstance
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw error
  }
}

// Synchronous version that returns a dummy client if the real one isn't ready
export function createSupabaseClient() {
  // For server-side rendering, always create a new instance
  if (typeof window === "undefined") {
    const url = process.env.STORAGE_SUPABASE_URL || process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL || ""
    const anonKey = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    const serviceKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || ""

    if (!url || !anonKey) {
      console.warn("Missing Supabase environment variables on server, returning dummy client")
      return createDummyClient()
    }

    return createClient(url, serviceKey || anonKey)
  }

  // For client-side, return the instance if it exists
  if (supabaseInstance) {
    return supabaseInstance
  }

  // If we don't have the instance yet, try to use cached config
  try {
    const cachedConfig = localStorage.getItem("supabaseConfig")
    if (cachedConfig) {
      const config = JSON.parse(cachedConfig)
      if (config.url && config.anonKey) {
        supabaseInstance = createClient(config.url, config.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
          // Completely disable realtime
          realtime: {
            enabled: false,
          },
          global: {
            headers: {
              "x-application-name": "utility-hub",
            },
          },
        })
        return supabaseInstance
      }
    }
  } catch (e) {
    console.error("Error using cached config:", e)
  }

  // If we don't have the config yet, start fetching it
  if (!configPromise) {
    configPromise = getSupabaseConfig()
      .then((config) => {
        if (config.url && config.anonKey) {
          supabaseInstance = createClient(config.url, config.anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
            },
            // Completely disable realtime
            realtime: {
              enabled: false,
            },
          })
        }
        return config
      })
      .catch((error) => {
        console.error("Error fetching Supabase config:", error)
        return { url: "", anonKey: "" }
      })
  }

  // Return a dummy client until the real one is ready
  console.log("Returning dummy Supabase client until real one is ready")
  return createDummyClient()
}

// Create a Supabase admin client (server-side only)
export function createSupabaseAdmin() {
  if (typeof window !== "undefined") {
    console.error("Admin client should only be used server-side")
    return createDummyClient()
  }

  const url = process.env.STORAGE_SUPABASE_URL || process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || ""

  if (!url || !serviceKey) {
    console.error("Missing Supabase admin environment variables")
    return createDummyClient()
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Create a dummy client that won't crash the app
function createDummyClient() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: () => Promise.resolve({ error: new Error("Supabase client not initialized") }),
      signOut: () => Promise.resolve({ error: null }),
      signUp: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ error: null }),
      admin: {
        deleteUser: () => Promise.resolve({ error: null }),
      },
      exchangeCodeForSession: () => Promise.resolve({ data: null, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        or: () => ({
          neq: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      rpc: () => Promise.resolve({ data: null, error: null }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    removeChannel: () => {},
    channel: () => ({
      on: () => ({ on: () => ({ on: () => ({ on: () => ({ subscribe: () => {} }) }) }) }),
      subscribe: () => {},
    }),
  }
}

// Helper function to get a client instance
export function getSupabaseClient() {
  return createSupabaseClient()
}

// Helper function to initialize the Supabase client
export async function initSupabaseClient() {
  if (typeof window === "undefined") {
    return // No need to initialize on server
  }

  if (!supabaseInstance) {
    try {
      await createSupabaseClientAsync()
      return true
    } catch (error) {
      console.error("Error initializing Supabase client:", error)
      throw error
    }
  }

  return true
}
