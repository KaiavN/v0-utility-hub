import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json(
        {
          error: "Missing Supabase configuration",
          debug: {
            url: !!process.env.STORAGE_SUPABASE_URL,
            nextPublicUrl: !!process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL,
            anonKey: !!process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    })
  } catch (error) {
    console.error("Error in Supabase config API:", error)
    return NextResponse.json({ error: "Failed to get Supabase configuration" }, { status: 500 })
  }
}
