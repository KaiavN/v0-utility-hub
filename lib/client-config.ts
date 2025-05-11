// This file contains configuration that's embedded at build time
// and available to the client

type ClientConfig = {
  supabase: {
    url: string
    anonKey: string
  }
  app: {
    url: string
  }
}

// These values are embedded at build time
export const clientConfig: ClientConfig = {
  supabase: {
    url: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || "",
  },
}
