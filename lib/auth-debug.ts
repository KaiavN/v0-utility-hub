// Helper function to extract auth info from URL
export function extractAuthInfoFromUrl() {
  if (typeof window === "undefined") return null

  const url = new URL(window.location.href)
  const hash = window.location.hash

  // Extract from query params
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error") || ""
  const errorDescription = url.searchParams.get("error_description") || ""

  // Extract from hash if present
  let accessToken = ""
  let refreshToken = ""
  let expiresIn = ""

  if (hash) {
    const hashParams = new URLSearchParams(hash.substring(1))
    accessToken = hashParams.get("access_token") || ""
    refreshToken = hashParams.get("refresh_token") || ""
    expiresIn = hashParams.get("expires_in") || ""

    // Check for error in hash
    const hashError = hashParams.get("error")
    const hashErrorDescription = hashParams.get("error_description")

    if (hashError) {
      const error = hashError
      const errorDescription = hashErrorDescription || ""
    }
  }

  return {
    code,
    error,
    errorDescription,
    accessToken,
    refreshToken,
    expiresIn,
  }
}

// Debug logging function
export function logAuthDebug(message: string, data?: any) {
  if (process.env.NEXT_PUBLIC_AUTH_DEBUG === "true") {
    console.log(`[AUTH DEBUG] ${message}`, data || "")
  }
}

// Error logging function
export function logAuthError(message: string, error?: any) {
  console.error(`[AUTH ERROR] ${message}`, error || "")
}
