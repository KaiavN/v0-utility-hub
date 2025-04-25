"use client"

import React from "react"

// Add caching to reduce localStorage reads
const memoryCache: Record<string, any> = {}

// Track when cache was last updated
const cacheTimestamps: Record<string, number> = {}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000

// Throttle storage operations
let pendingWrites: Record<string, { value: any; timestamp: number }> = {}
let writeTimeout: NodeJS.Timeout | null = null
const WRITE_DELAY = 200 // ms

// Improved getLocalStorage function with caching
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  // Return from memory cache if available and not expired
  if (memoryCache[key] !== undefined && cacheTimestamps[key] && Date.now() - cacheTimestamps[key] < CACHE_EXPIRATION) {
    return memoryCache[key]
  }

  if (typeof window === "undefined") {
    return defaultValue
  }

  try {
    const item = window.localStorage.getItem(key)
    if (item === null) {
      return defaultValue
    }

    // For simple strings that don't need parsing
    if (
      typeof defaultValue === "string" &&
      !(
        item.startsWith("{") ||
        item.startsWith("[") ||
        item === "null" ||
        item === "true" ||
        item === "false" ||
        !isNaN(Number(item))
      )
    ) {
      memoryCache[key] = item as unknown as T
      cacheTimestamps[key] = Date.now()
      return item as unknown as T
    }

    // For values that need parsing
    try {
      const parsedItem = JSON.parse(item) as T
      // Store in memory cache
      memoryCache[key] = parsedItem
      cacheTimestamps[key] = Date.now()
      return parsedItem
    } catch (parseError) {
      console.error(`Error parsing localStorage item ${key}:`, parseError)
      // If parsing fails but item exists, return as string if appropriate
      if (typeof defaultValue === "string") {
        memoryCache[key] = item as unknown as T
        cacheTimestamps[key] = Date.now()
        return item as unknown as T
      }

      // Handle numbers specifically
      if (typeof defaultValue === "number" && !isNaN(Number(item))) {
        const numValue = Number(item)
        memoryCache[key] = numValue as unknown as T
        cacheTimestamps[key] = Date.now()
        return numValue as unknown as T
      }

      return defaultValue
    }
  } catch (error) {
    console.error(`Error accessing localStorage for ${key}:`, error)
    return defaultValue
  }
}

// Optimize processPendingWrites function
function processPendingWrites() {
  if (typeof window === "undefined") return

  const now = Date.now()
  const writesToProcess = { ...pendingWrites }
  pendingWrites = {}
  writeTimeout = null

  // Batch localStorage operations for better performance
  Object.entries(writesToProcess).forEach(([key, { value }]) => {
    try {
      // Update memory cache
      memoryCache[key] = value
      cacheTimestamps[key] = now

      // Write to localStorage
      const serialized = typeof value === "string" ? value : JSON.stringify(value)
      window.localStorage.setItem(key, serialized)
    } catch (error) {
      console.error(`Error writing localStorage for ${key}:`, error)
      // Try to store as string if serialization fails
      if (typeof value === "string") {
        try {
          window.localStorage.setItem(key, value)
        } catch (stringError) {
          console.error(`Failed to write string value for ${key}:`, stringError)
        }
      }
    }
  })
}

// Improved setLocalStorage function with throttling
export function setLocalStorage<T>(key: string, value: T, immediate = false): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    // Don't store undefined values
    if (value === undefined) {
      console.warn(`Attempted to store undefined value for key: ${key}`)
      return
    }

    // Check storage limits before writing
    try {
      const { percentage } = getLocalStorageUsage()
      if (percentage > 90) {
        console.warn("LocalStorage usage is above 90%, attempting to optimize")
        optimizeLocalStorage()
      }
    } catch (limitError) {
      console.error("Error checking storage limits:", limitError)
    }

    // Update memory cache immediately
    memoryCache[key] = value
    const now = Date.now()
    cacheTimestamps[key] = now

    // Queue the write
    pendingWrites[key] = { value, timestamp: now }

    // Process immediately if requested
    if (immediate) {
      if (writeTimeout) {
        clearTimeout(writeTimeout)
        writeTimeout = null
      }
      processPendingWrites()
    } else if (!writeTimeout) {
      // Set up a debounced write
      writeTimeout = setTimeout(processPendingWrites, WRITE_DELAY)
    }
  } catch (error) {
    console.error(`Error queueing localStorage write for ${key}:`, error)
  }
}

// Add a function to clear the memory cache
export function clearLocalStorageCache(): void {
  Object.keys(memoryCache).forEach((key) => {
    delete memoryCache[key]
    delete cacheTimestamps[key]
  })
}

// Add a function to remove an item from localStorage and cache
export function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    // Remove from memory cache
    delete memoryCache[key]
    delete cacheTimestamps[key]

    // Remove from pending writes
    if (pendingWrites[key]) {
      delete pendingWrites[key]
    }

    // Remove from localStorage
    window.localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing localStorage item ${key}:`, error)
  }
}

// Add a function to batch save multiple items at once
export function batchSetLocalStorage(items: Record<string, any>, immediate = false): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const now = Date.now()

    // Update memory cache and queue writes for each item
    Object.entries(items).forEach(([key, value]) => {
      if (value !== undefined) {
        // Skip undefined values
        memoryCache[key] = value
        cacheTimestamps[key] = now
        pendingWrites[key] = { value, timestamp: now }
      }
    })

    // Process immediately if requested
    if (immediate) {
      if (writeTimeout) {
        clearTimeout(writeTimeout)
        writeTimeout = null
      }
      processPendingWrites()
    } else if (!writeTimeout) {
      // Set up a debounced write if not already scheduled
      writeTimeout = setTimeout(processPendingWrites, WRITE_DELAY)
    }
  } catch (error) {
    console.error("Error batch setting localStorage items:", error)
  }
}

// Add a function to get the total localStorage usage
export function getLocalStorageUsage(): { used: number; total: number; percentage: number } {
  if (typeof window === "undefined") {
    return { used: 0, total: 5 * 1024 * 1024, percentage: 0 }
  }

  try {
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += key.length + value.length
        }
      }
    }

    // Convert to bytes (2 bytes per character in localStorage)
    const usedBytes = totalSize * 2
    // Most browsers have a 5MB limit
    const totalBytes = 5 * 1024 * 1024
    const percentage = (usedBytes / totalBytes) * 100

    return {
      used: usedBytes,
      total: totalBytes,
      percentage,
    }
  } catch (error) {
    console.error("Error calculating localStorage usage:", error)
    return { used: 0, total: 5 * 1024 * 1024, percentage: 0 }
  }
}

// Optimize localStorage usage by removing empty or null values
export function optimizeLocalStorage(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const keysToRemove = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value === null || value.trim() === "") {
          keysToRemove.push(key)
        } else {
          try {
            const parsed = JSON.parse(value)
            if (parsed === null) {
              keysToRemove.push(key)
            }
          } catch (e) {
            // Not JSON, keep the value
          }
        }
      }
    }

    // Remove the identified keys
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
      delete memoryCache[key]
      delete cacheTimestamps[key]
      if (pendingWrites[key]) {
        delete pendingWrites[key]
      }
    })
  } catch (error) {
    console.error("Error optimizing localStorage:", error)
  }
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    return getLocalStorage(key, defaultValue)
  })

  // Use a ref to track if this is the initial render
  const isInitialRender = React.useRef(true)

  React.useEffect(() => {
    // Skip the first render to avoid unnecessary writes
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }

    setLocalStorage(key, storedValue)
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}

export function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const testKey = "__storage_test__"
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

// Add a function to force immediate write of all pending data
export function flushLocalStorageWrites(): void {
  if (writeTimeout) {
    clearTimeout(writeTimeout)
    writeTimeout = null
    processPendingWrites()
  }
}
