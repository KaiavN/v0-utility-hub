import { NextResponse } from "next/server"
import { supabaseConfig } from "@/lib/env-config"

export async function GET() {
  try {
    // Check if we have the required environment variables
    if (!supabaseConfig.publicUrl || !supabaseConfig.publicAnonKey) {
      console.error("Missing Supabase environment variables in API route")

      // Check if we have the server-side variables as fallback
      const url = supabaseConfig.url || process.env.STORAGE_SUPABASE_URL || ""
      const anonKey = supabaseConfig.anonKey || process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

      if (!url || !anonKey) {
        return NextResponse.json({ error: "Supabase configuration is not available" }, { status: 500 })
      }

      // Return the server-side variables as fallback
      return NextResponse.json({
        url,
        anonKey,
      })
    }

    // Return the client-side variables
    return NextResponse.json({
      url: supabaseConfig.publicUrl,
      anonKey: supabaseConfig.publicAnonKey,
    })
  } catch (error) {
    console.error("Error in Supabase config API route:", error)
    return NextResponse.json({ error: "Failed to get Supabase configuration" }, { status: 500 })
  }
}
