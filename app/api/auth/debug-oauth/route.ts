import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseAdmin } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    // Get the Supabase admin client
    const supabase = createSupabaseAdmin()

    // Get the GitHub client ID and secret from environment variables
    const githubClientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ""
    const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || ""

    // Get the Supabase URL and anon key
    const supabaseUrl = process.env.STORAGE_SUPABASE_URL || process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    // Get the site URL
    const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || ""

    // Check if GitHub OAuth is configured in Supabase
    const { data: providers, error: providersError } = await supabase.auth.admin.listAuthProviders()

    // Return the debug information
    return NextResponse.json({
      githubConfigured: !!githubClientId && !!githubClientSecret,
      supabaseConfigured: !!supabaseUrl && !!supabaseAnonKey,
      siteUrl,
      callbackUrl: `${siteUrl}/auth/callback`,
      providers: providers || [],
      providersError: providersError?.message || null,
      // Mask sensitive information
      githubClientId: githubClientId ? `${githubClientId.substring(0, 4)}...` : null,
      githubClientSecret: githubClientSecret ? "configured" : null,
      publicClientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
        ? `${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID.substring(0, 4)}...`
        : null,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : null,
      timestamp: new Date().toISOString(),
      env: {
        hasNextPublicGithubClientId: !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        hasGithubClientId: !!process.env.GITHUB_CLIENT_ID,
        hasGithubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
      },
    })
  } catch (error) {
    console.error("Error in debug-oauth endpoint:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
