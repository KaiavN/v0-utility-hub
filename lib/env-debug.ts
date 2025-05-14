// This file provides utilities for debugging environment variables

// Function to safely check if an environment variable exists
export function checkEnvVar(name: string): { exists: boolean; value: string | undefined } {
  const value = process.env[name]
  return {
    exists: value !== undefined && value !== "",
    value: value || undefined,
  }
}

// Get all Supabase-related environment variables
export function getSupabaseEnvStatus() {
  return {
    // Client-side variables
    STORAGE_NEXT_PUBLIC_SUPABASE_URL: checkEnvVar("STORAGE_NEXT_PUBLIC_SUPABASE_URL"),
    STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY: checkEnvVar("STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY"),

    // Server-side variables
    STORAGE_SUPABASE_URL: checkEnvVar("STORAGE_SUPABASE_URL"),
    STORAGE_SUPABASE_ANON_KEY: checkEnvVar("STORAGE_SUPABASE_ANON_KEY"),
    STORAGE_SUPABASE_SERVICE_ROLE_KEY: checkEnvVar("STORAGE_SUPABASE_SERVICE_ROLE_KEY"),

    // Database connection variables
    STORAGE_POSTGRES_URL: checkEnvVar("STORAGE_POSTGRES_URL"),
    STORAGE_POSTGRES_PRISMA_URL: checkEnvVar("STORAGE_POSTGRES_PRISMA_URL"),
    STORAGE_POSTGRES_URL_NON_POOLING: checkEnvVar("STORAGE_POSTGRES_URL_NON_POOLING"),
    STORAGE_POSTGRES_USER: checkEnvVar("STORAGE_POSTGRES_USER"),
    STORAGE_POSTGRES_PASSWORD: checkEnvVar("STORAGE_POSTGRES_PASSWORD"),
    STORAGE_POSTGRES_DATABASE: checkEnvVar("STORAGE_POSTGRES_DATABASE"),
    STORAGE_POSTGRES_HOST: checkEnvVar("STORAGE_POSTGRES_HOST"),

    // Other Supabase variables
    STORAGE_SUPABASE_JWT_SECRET: checkEnvVar("STORAGE_SUPABASE_JWT_SECRET"),
  }
}

// Get all authentication-related environment variables
export function getAuthEnvStatus() {
  return {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: checkEnvVar("NEXT_PUBLIC_GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: checkEnvVar("GOOGLE_CLIENT_SECRET"),
    GITHUB_CLIENT_ID: checkEnvVar("GITHUB_CLIENT_ID"),
    GITHUB_CLIENT_SECRET: checkEnvVar("GITHUB_CLIENT_SECRET"),
    NEXTAUTH_SECRET: checkEnvVar("NEXTAUTH_SECRET"),
  }
}

// Get all URL-related environment variables
export function getUrlEnvStatus() {
  return {
    NEXT_PUBLIC_APP_URL: checkEnvVar("NEXT_PUBLIC_APP_URL"),
    SITE_URL: checkEnvVar("SITE_URL"),
    NEXT_PUBLIC_VERCEL_URL: checkEnvVar("NEXT_PUBLIC_VERCEL_URL"),
  }
}

// Log all environment variable statuses
export function logAllEnvStatus() {
  console.log("=== Environment Variables Status ===")

  console.log("\n--- Supabase Variables ---")
  const supabaseStatus = getSupabaseEnvStatus()
  Object.entries(supabaseStatus).forEach(([key, status]) => {
    console.log(`${key}: ${status.exists ? "✅" : "❌"}`)
  })

  console.log("\n--- Auth Variables ---")
  const authStatus = getAuthEnvStatus()
  Object.entries(authStatus).forEach(([key, status]) => {
    console.log(`${key}: ${status.exists ? "✅" : "❌"}`)
  })

  console.log("\n--- URL Variables ---")
  const urlStatus = getUrlEnvStatus()
  Object.entries(urlStatus).forEach(([key, status]) => {
    console.log(`${key}: ${status.exists ? "✅" : "❌"}`)
  })

  console.log("\n=== End Environment Variables Status ===")
}
