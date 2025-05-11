import { createClient } from "@supabase/supabase-js"

// Create a singleton Supabase client
let supabaseInstance: any = null
let supabaseConfig: { url: string; anonKey: string } | null = null
let configPromise: Promise<{ url: string; anonKey: string }> | null = null

// Function to fetch Supabase configuration from the server
async function fetchSupabaseConfig(): Promise<{ url: string; anonKey: string }> {
  // If we already have a promise for the config, return it
  if (configPromise) {
    return configPromise
  }

  // Check if we have the config in localStorage
  if (typeof window !== "undefined") {
    const cachedConfig = localStorage.getItem("supabaseConfig")
    if (cachedConfig) {
      try {
        const parsed = JSON.parse(cachedConfig)
        if (parsed.url && parsed.anonKey) {
          supabaseConfig = parsed
          return parsed
        }
      } catch (e) {
        console.error("Error parsing cached Supabase config:", e)
      }
    }
  }

  // Create a new promise to fetch the config
  configPromise = new Promise(async (resolve, reject) => {
    try {
      console.log("Fetching Supabase configuration from server...")
      const response = await fetch("/api/config/supabase")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error fetching Supabase config:", errorData)
        reject(new Error(`Failed to fetch Supabase config: ${response.status}`))
        return
      }

      const config = await response.json()

      if (!config.url || !config.anonKey) {
        console.error("Invalid Supabase config received:", config)
        reject(new Error("Invalid Supabase configuration received from server"))
        return
      }

      // Cache the config in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("supabaseConfig", JSON.stringify(config))
      }

      supabaseConfig = config
      resolve(config)
    } catch (error) {
      console.error("Error fetching Supabase config:", error)
      reject(error)
    }
  })

  return configPromise
}

// Create a Supabase client
export async function createSupabaseClientAsync() {
  try {
    // For server-side rendering, always create a new instance
    if (typeof window === "undefined") {
      // Server-side: Use environment variables directly
      const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase environment variables for server-side")
        console.error("URL:", supabaseUrl ? "Available" : "Missing")
        console.error("Anon Key:", supabaseAnonKey ? "Available" : "Missing")
        return createDummyClient()
      }

      return createClient(supabaseUrl, supabaseAnonKey)
    }

    // For client-side, use singleton pattern
    if (!supabaseInstance) {
      // Fetch config if we don't have it yet
      if (!supabaseConfig) {
        supabaseConfig = await fetchSupabaseConfig()
      }

      // Create the client
      supabaseInstance = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    }

    return supabaseInstance
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return createDummyClient()
  }
}

// Synchronous version that returns a dummy client if the real one isn't ready
export function createSupabaseClient() {
  // For server-side rendering, always create a new instance
  if (typeof window === "undefined") {
    // Server-side: Use environment variables directly
    const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables for server-side")
      return createDummyClient()
    }

    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // For client-side, return the instance if it exists
  if (supabaseInstance) {
    return supabaseInstance
  }

  // If we have the config but no instance, create it
  if (supabaseConfig) {
    supabaseInstance = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    return supabaseInstance
  }

  // If we don't have the config yet, start fetching it and return a dummy client
  if (!configPromise) {
    fetchSupabaseConfig()
      .then((config) => {
        supabaseConfig = config
        supabaseInstance = createClient(config.url, config.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        })
      })
      .catch((error) => {
        console.error("Error fetching Supabase config:", error)
      })
  }

  // Return a dummy client until the real one is ready
  return createDummyClient()
}

// Create a Supabase admin client (server-side only)
export function createSupabaseAdmin() {
  try {
    if (typeof window !== "undefined") {
      console.error("Admin client should only be used server-side")
      return createDummyClient()
    }

    const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase admin environment variables")
      return createDummyClient()
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } catch (error) {
    console.error("Error creating Supabase admin client:", error)
    return createDummyClient()
  }
}

// Create a dummy client that won't crash the app
function createDummyClient() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: () => Promise.resolve({ error: new Error("Supabase client not initialized") }),
      signOut: () => Promise.resolve({ error: null }),
      exchangeCodeForSession: () => Promise.resolve({ data: null, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
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
    await createSupabaseClientAsync()
  }
}
