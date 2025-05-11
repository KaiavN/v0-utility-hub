import { NextResponse } from "next/server"

export async function GET() {
  // Log all environment variables with STORAGE_ prefix for debugging
  const storageEnvVars = Object.keys(process.env)
    .filter((key) => key.startsWith("STORAGE_"))
    .reduce(
      (obj, key) => {
        obj[key] = process.env[key] ? "Available" : "Missing"
        return obj
      },
      {} as Record<string, string>,
    )

  console.log("Available STORAGE_ environment variables:", storageEnvVars)

  // Get Supabase configuration from environment variables
  const supabaseUrl = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL || process.env.STORAGE_SUPABASE_URL
  const supabaseAnonKey = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if configuration is available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase configuration in environment variables")
    console.error("URL:", supabaseUrl ? "Available" : "Missing")
    console.error("Anon Key:", supabaseAnonKey ? "Available" : "Missing")

    return NextResponse.json(
      {
        error: "Missing Supabase configuration",
        debug: {
          envVars: storageEnvVars,
          url: supabaseUrl ? "Available" : "Missing",
          anonKey: supabaseAnonKey ? "Available" : "Missing",
        },
      },
      { status: 500 },
    )
  }

  // Return the configuration
  return NextResponse.json({
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  })
}
