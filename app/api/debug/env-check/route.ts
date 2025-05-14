import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseEnvStatus, getAuthEnvStatus, getUrlEnvStatus } from "@/lib/env-debug"

export async function GET(request: NextRequest) {
  // Only allow this endpoint in development or if explicitly enabled
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_ENV_DEBUG !== "true") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode or with ENABLE_ENV_DEBUG=true" },
      { status: 403 },
    )
  }

  // Check all environment variables
  const supabaseVars = getSupabaseEnvStatus()
  const authVars = getAuthEnvStatus()
  const urlVars = getUrlEnvStatus()

  // Combine all environment variable statuses
  const variables: Record<string, boolean> = {}

  // Add all variable statuses (just existence, not the values for security)
  Object.entries({
    ...supabaseVars,
    ...authVars,
    ...urlVars,
  }).forEach(([key, status]) => {
    variables[key] = status.exists
  })

  // Return the environment variable statuses
  return NextResponse.json({
    variables,
    timestamp: new Date().toISOString(),
  })
}
