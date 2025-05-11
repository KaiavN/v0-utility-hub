/**
 * Auth debugging utilities
 */

export function logAuthDebug(message: string, data?: any) {
  const isDebugMode = process.env.NEXT_PUBLIC_AUTH_DEBUG === "true"

  if (isDebugMode) {
    console.log(`[AUTH DEBUG] ${message}`, data || "")
  }
}

export function logAuthError(message: string, error: any) {
  console.error(`[AUTH ERROR] ${message}`, error)

  // Additional error details for debugging
  if (error && typeof error === "object") {
    if (error.message) console.error(`- Message: ${error.message}`)
    if (error.code) console.error(`- Code: ${error.code}`)
    if (error.status) console.error(`- Status: ${error.status}`)
    if (error.details) console.error(`- Details:`, error.details)
  }
}

export function getAuthErrorMessage(error: any): string {
  if (!error) return "Unknown error"

  // Handle string errors
  if (typeof error === "string") return error

  // Handle error objects
  if (error.message) return error.message

  // Handle Supabase specific errors
  if (error.error_description) return error.error_description
  if (error.error) return error.error

  return "An unexpected authentication error occurred"
}

// Helper to check if we're in a browser environment
export function isBrowser(): boolean {
  return typeof window !== "undefined"
}

// Helper to safely parse JWT tokens
export function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error("Error parsing JWT:", e)
    return null
  }
}

// Helper to extract auth info from URL
export function extractAuthInfoFromUrl() {
  if (!isBrowser()) return null

  try {
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, "?"))

    return {
      // From URL query params
      code: urlParams.get("code"),
      error: urlParams.get("error") || hashParams.get("error"),
      errorDescription: urlParams.get("error_description") || hashParams.get("error_description"),

      // From hash fragment
      accessToken: hashParams.get("access_token"),
      refreshToken: hashParams.get("refresh_token"),
      expiresIn: hashParams.get("expires_in"),
      tokenType: hashParams.get("token_type"),
      provider: hashParams.get("provider"),
    }
  } catch (e) {
    console.error("Error extracting auth info from URL:", e)
    return null
  }
}
