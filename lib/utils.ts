import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names into a single string using clsx and tailwind-merge
 * This optimizes the final class string by removing duplicates and conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Memoize formatCurrency for better performance
const currencyFormatters: Record<string, Intl.NumberFormat> = {}

export const formatCurrency = (amount: number, currency = "USD") => {
  // Create and cache formatter instances
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    })
  }
  return currencyFormatters[currency].format(amount)
}

// Memoize date formatters for better performance
const dateFormatters: Record<string, Intl.DateTimeFormat> = {}

export const formatDate = (dateString: string, format = "default") => {
  const date = new Date(dateString)

  if (!dateFormatters[format]) {
    dateFormatters[format] = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return dateFormatters[format].format(date)
}

/**
 * Formats a duration in milliseconds to a string in the format "mm:ss"
 * Optimized to avoid unnecessary calculations
 */
export function formatDuration(ms: number): string {
  if (!ms) return "0:00"

  // Use bitwise operations for faster integer division
  const minutes = ~~(ms / 60000)
  const seconds = ~~((ms % 60000) / 1000)

  // Use template literals for faster string concatenation
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to limit how often a function can be called
 * Ensures function is called at most once in the specified time period
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastFunc: ReturnType<typeof setTimeout>
  let lastRan: number

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      lastRan = Date.now()
      inThrottle = true

      setTimeout(() => {
        inThrottle = false
      }, limit)
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(
        () => {
          if (Date.now() - lastRan >= limit) {
            func(...args)
            lastRan = Date.now()
          }
        },
        limit - (Date.now() - lastRan),
      )
    }
  }
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  if (!json) return fallback

  try {
    return JSON.parse(json) as T
  } catch (error) {
    console.error("Error parsing JSON:", error)
    return fallback
  }
}

// Cache for formatBytes to avoid recalculating
const bytesCache = new Map<number, string>()

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  // Check cache first
  const cacheKey = bytes * 100 + decimals
  if (bytesCache.has(cacheKey)) {
    return bytesCache.get(cacheKey)!
  }

  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  const result = `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`

  // Cache the result
  bytesCache.set(cacheKey, result)

  return result
}

/**
 * Validates if a string is in the DD/MM/YYYY format
 * Returns an error message if invalid, or null if valid
 */
export function validateDateFormat(dateString: string): string | null {
  // Empty string is considered invalid
  if (!dateString.trim()) {
    return "Date is required"
  }

  // Check if the string matches the DD/MM/YYYY pattern exactly
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = dateString.match(regex)

  if (!match) {
    return "Date must be in DD/MM/YYYY format"
  }

  const day = Number.parseInt(match[1], 10)
  const month = Number.parseInt(match[2], 10) - 1 // Months are 0-indexed in JS Date
  const year = Number.parseInt(match[3], 10)

  // Validate ranges
  if (month < 0 || month > 11) {
    return "Month must be between 01 and 12"
  }

  if (day < 1) {
    return "Day must be at least 1"
  }

  // Check days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  if (day > daysInMonth) {
    return `Day must be between 1 and ${daysInMonth} for the selected month`
  }

  // Validate year
  if (year < 1000 || year > 9999) {
    return "Year must be a 4-digit number"
  }

  return null
}

/**
 * Parses a date string in DD/MM/YYYY format
 * Returns undefined if the format is invalid
 */
export function parseDate(dateString: string): Date | undefined {
  // Validate the date format first
  const validationError = validateDateFormat(dateString)
  if (validationError) {
    return undefined
  }

  // If we get here, we know the format is valid
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = dateString.match(regex)!

  const day = Number.parseInt(match[1], 10)
  const month = Number.parseInt(match[2], 10) - 1 // Months are 0-indexed in JS Date
  const year = Number.parseInt(match[3], 10)

  return new Date(year, month, day)
}

/**
 * Formats a date as DD/MM/YYYY for input display
 */
export function formatDateForInput(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Parses a date string in various formats and returns a valid Date object or undefined
 * Handles ISO dates, MM/DD/YYYY, DD/MM/YYYY, and natural language dates
 */
export function parseFlexibleDate(dateString: string): Date | undefined {
  if (!dateString) return undefined

  try {
    // Try as ISO format first
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) return date
    }

    // Try MM/DD/YYYY
    const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const mmddyyyyMatch = dateString.match(mmddyyyy)
    if (mmddyyyyMatch) {
      const month = Number.parseInt(mmddyyyyMatch[1], 10)
      const day = Number.parseInt(mmddyyyyMatch[2], 10)
      const year = Number.parseInt(mmddyyyyMatch[3], 10)
      const date = new Date(year, month - 1, day)
      if (!isNaN(date.getTime())) return date
    }

    // Try DD/MM/YYYY
    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const ddmmyyyyMatch = dateString.match(ddmmyyyy)
    if (ddmmyyyyMatch) {
      const day = Number.parseInt(ddmmyyyyMatch[1], 10)
      const month = Number.parseInt(ddmmyyyyMatch[2], 10)
      const year = Number.parseInt(ddmmyyyyMatch[3], 10)
      const date = new Date(year, month - 1, day)
      if (!isNaN(date.getTime())) return date
    }

    // Try natural language parsing as last resort
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) return date

    return undefined
  } catch (error) {
    console.error("Error parsing date:", error)
    return undefined
  }
}

/**
 * Converts any date string to YYYY-MM-DD format
 * Returns the original string if conversion fails
 */
export function toISODateString(dateString: string): string {
  const date = parseFlexibleDate(dateString)
  if (!date) return dateString

  return date.toISOString().split("T")[0]
}

export function flushLocalStorageWrites(): void {
  // Placeholder for the actual implementation
  console.log("Flushing localStorage writes...")
}
