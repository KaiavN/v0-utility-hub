import { NextResponse } from "next/server"

export async function GET() {
  const config = {
    url: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  // Check if we have the required environment variables
  const debug = {
    hasUrl: !!process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY,
    envKeys: Object.keys(process.env).filter((key) => key.includes("SUPABASE") || key.includes("STORAGE")),
  }

  // If we're missing any required environment variables, return an error
  if (!config.url || !config.anonKey) {
    return NextResponse.json(
      {
        error: "Missing required Supabase environment variables",
        debug,
      },
      { status: 500 },
    )
  }

  return NextResponse.json(config)
}
