import { NextResponse } from "next/server"

export async function GET() {
  // Only expose what's needed for the client
  const config = {
    supabase: {
      url: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  }

  return NextResponse.json(config)
}
