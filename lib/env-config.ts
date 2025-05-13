// This file exposes environment variables to the client safely

// Supabase configuration
export const supabaseConfig = {
  // Server-side variables (with STORAGE_ prefix)
  url: process.env.STORAGE_SUPABASE_URL || "",
  anonKey: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  serviceKey: process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || "",

  // Client-side variables (with STORAGE_ prefix for Next.js public variables)
  publicUrl: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL || "",
  publicAnonKey: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY || "",

  // Database connection info (for debugging)
  dbHost: process.env.STORAGE_POSTGRES_HOST || "",
  dbUser: process.env.STORAGE_POSTGRES_USER || "",
  dbName: process.env.STORAGE_POSTGRES_DATABASE || "",
}

// Site configuration
export const siteConfig = {
  url: process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || "",
}

// Debug configuration
export const debugConfig = {
  authDebug: process.env.NEXT_PUBLIC_AUTH_DEBUG === "true",
}
