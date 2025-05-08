/**
 * Utilities for error handling and logging
 */

// Custom error class for API errors
export class ApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

// Function to safely parse API errors
export function parseApiError(error: unknown): string {
  console.log("parseApiError: Parsing error:", error)

  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred"
}

// Function to log errors with consistent formatting
export function logError(context: string, error: unknown, additionalInfo?: any): void {
  console.error(`ERROR [${context}]:`, error)

  if (additionalInfo) {
    console.error(`Additional info for [${context}]:`, additionalInfo)
  }

  // If in development, log the stack trace
  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    console.error(`Stack trace for [${context}]:`, error.stack)
  }
}
