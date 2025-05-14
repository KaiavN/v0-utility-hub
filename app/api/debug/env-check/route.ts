import { NextResponse } from "next/server"
import { getSupabaseEnvStatus, getAuthEnvStatus, getUrlEnvStatus } from "@/lib/env-debug"

export async function GET() {
  // Only enable this endpoint in development or when explicitly allowed
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_ENV_DEBUG !== "true") {
    return NextResponse.json({ error: "This endpoint is only available in development mode" }, { status: 403 })
  }

  // Get environment variable status
  const supabaseVars = getSupabaseEnvStatus()
  const authVars = getAuthEnvStatus()
  const urlVars = getUrlEnvStatus()

  // Convert to a simple exists/doesn't exist format for the response
  // to avoid exposing actual values
  const variables: Record<string, boolean> = {}

  // Process Supabase variables
  Object.entries(supabaseVars).forEach(([key, status]) => {
    variables[key] = status.exists
  })

  // Process Auth variables
  Object.entries(authVars).forEach(([key, status]) => {
    variables[key] = status.exists
  })

  // Process URL variables
  Object.entries(urlVars).forEach(([key, status]) => {
    variables[key] = status.exists
  })

  return NextResponse.json({ variables })
}
