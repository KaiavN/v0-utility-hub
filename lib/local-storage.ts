"use client"

import React from "react"

// Add the structured logger to this file as well

// Add this at the top of the file, after the imports
const DEBUG = process.env.NODE_ENV === "development"

// Create a structured logger helper
const logger = {
  info: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.info(`%c🗄️ STORAGE: ${message}`, "color: #3b82f6; font-weight: bold;", ...data)
  },
  success: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.log(`%c✅ STORAGE: ${message}`, "color: #10b981; font-weight: bold;", ...data)
  },
  warn: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.warn(`%c⚠️ STORAGE: ${message}`, "color: #f59e0b; font-weight: bold;", ...data)
  },
  error: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.error(`%c❌ STORAGE: ${message}`, "color: #ef4444; font-weight: bold;", ...data)
  },
  group: (name: string) => {
    if (!DEBUG) return
    console.group(`%c📋 STORAGE: ${name}`, "color: #8b5cf6; font-weight: bold;")
  },
  groupEnd: () => {
    if (!DEBUG) return
    console.groupEnd()
  },
  debug: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.debug(`%c🔍 STORAGE: ${message}`, "color: #6b7280; font-weight: bold;", ...data)
  },
  table: (data: any, message?: string) => {
    if (!DEBUG) return
    if (message) {
      console.log(`%c📊 STORAGE: ${message}:`, "color: #8b5cf6; font-weight: bold;")
    }
    console.table(data)
  },
  // Special method for storage size reporting
  storageReport: (used: number, total: number, percentage: number) => {
    if (!DEBUG) return
    const color = percentage > 80 ? "#ef4444" : percentage > 60 ? "#f59e0b" : "#10b981"
    console.log(
      `%c📊 STORAGE USAGE: ${(used / 1024 / 1024).toFixed(2)}MB / ${(total / 1024 / 1024).toFixed(2)}MB (${percentage.toFixed(1)}%)`,
      `color: ${color}; font-weight: bold;`,
    )
    // Visual bar representation
    const barLength = 40
    const filledLength = Math.round((percentage / 100) * barLength)
    const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength)
    console.log(`%c${bar}`, `color: ${color}; font-weight: bold;`)
  },
}

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

// Improved getLocalStorage function with enhanced error handling and recovery
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === "undefined") {
      return defaultValue
    }

    const item = localStorage.getItem(key)

    // If item doesn't exist, return default
    if (item === null) {
      return defaultValue
    }

    try {
      // Parse the item
      const parsedItem = JSON.parse(item) as T

      // For array types, ensure we return an array
      if (Array.isArray(defaultValue) && !Array.isArray(parsedItem)) {
        console.error(`Expected array for ${key} but got:`, parsedItem)
        return defaultValue
      }

      return parsedItem
    } catch (parseError) {
      console.error(`Error parsing localStorage item ${key}:`, parseError)
      return defaultValue
    }
  } catch (error) {
    console.error(`Error accessing localStorage for ${key}:`, error)
    return defaultValue
  }
}

// Improve the setLocalStorage function to ensure data is properly saved
export function setLocalStorage<T>(key: string, value: T): void {
  try {
    if (typeof window === "undefined") {
      return
    }

    // Validate data before saving
    if (value === undefined || value === null) {
      console.warn(`Attempted to save ${key} with value:`, value)
      // Still save it, but log a warning
    }

    // For array types, ensure we're saving an array
    if (Array.isArray(value) && value.length > 0) {
      // Check if all items have required properties (for debugging)
      if (key === "countdownTimers" && !value[0].hasOwnProperty("id")) {
        console.warn("Countdown timer items may be missing required properties:", value)
      }
    }

    localStorage.setItem(key, JSON.stringify(value))

    // Special handling for plannerData to ensure it's properly saved
    if (key === "plannerData") {
      try {
        // Verify the save was successful
        const savedItem = localStorage.getItem(key)
        if (!savedItem) {
          console.error(`Failed to save plannerData to localStorage`)
          // Try again with a different approach
          const dataString = JSON.stringify(value)
          localStorage.removeItem(key)
          localStorage.setItem(key, dataString)

          // Verify again
          const retryItem = localStorage.getItem(key)
          if (!retryItem) {
            console.error(`Failed to save plannerData even after retry`)
          } else {
            console.log(`✅ SUCCESS: plannerData saved successfully after retry (${retryItem.length} chars)`)
          }
        } else {
          console.log(`✅ SUCCESS: plannerData saved successfully (${savedItem.length} chars)`)

          // Verify the data structure
          try {
            const parsedData = JSON.parse(savedItem)
            if (!parsedData.blocks || !Array.isArray(parsedData.blocks)) {
              console.error(`Saved plannerData has invalid blocks array`)
            } else {
              console.log(
                `✅ SUCCESS: Verified plannerData has valid blocks array with ${parsedData.blocks.length} blocks`,
              )
            }
          } catch (parseError) {
            console.error(`Error parsing saved plannerData:`, parseError)
          }
        }
      } catch (verifyError) {
        console.error(`Error verifying plannerData save:`, verifyError)
      }
    }

    // Verify the save was successful
    const savedItem = localStorage.getItem(key)
    if (!savedItem) {
      console.error(`Failed to save ${key} to localStorage`)
    } else {
      console.log(`✅ SUCCESS: ✅ Data saved via setLocalStorage for ${key}`)
    }
  } catch (error) {
    console.error(`Error saving to localStorage for ${key}:`, error)
  }
}

// Improve the processPendingWrites function to be more reliable
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
      let serialized
      try {
        serialized = typeof value === "string" ? value : JSON.stringify(value)
      } catch (serializeError) {
        logger.error(`Error serializing data for ${key}:`, serializeError)
        return // Skip this write
      }

      // Try to write to localStorage
      if (key === "plannerData") {
        logger.group("📝 processPendingWrites: plannerData")
        logger.debug(`Processing pending write for plannerData`)

        try {
          // Try to write to localStorage
          try {
            window.localStorage.setItem(key, serialized)
            logger.success(`Successfully saved plannerData to localStorage (${serialized.length} chars)`)

            // Verify the data was actually saved
            const savedData = window.localStorage.getItem(key)
            if (savedData) {
              logger.success(`Verified plannerData was saved (${savedData.length} chars)`)

              // Try to parse the saved data to ensure it's valid
              try {
                JSON.parse(savedData)
                logger.success("Verified saved data is valid JSON")
              } catch (parseError) {
                logger.error("Saved data is not valid JSON, trying again:", parseError)
                window.localStorage.setItem(key, serialized)
              }

              if (savedData.length !== serialized.length) {
                logger.warn(`Saved data length (${savedData.length}) differs from original (${serialized.length})`)
                // Try again
                window.localStorage.setItem(key, serialized)
              }
            } else {
              logger.error(`Failed to verify plannerData was saved - not found in localStorage after save`)
              // Try again with a different approach
              window.localStorage.removeItem(key)
              window.localStorage.setItem(key, serialized)
            }
          } catch (storageError) {
            logger.error(`Error writing plannerData to localStorage:`, storageError)

            // If we get a quota error, try to optimize storage
            if (
              storageError instanceof DOMException &&
              (storageError.code === 22 || storageError.name === "QuotaExceededError")
            ) {
              logger.warn("Storage quota exceeded, attempting to optimize...")
              optimizeLocalStorage()

              // Try again after optimization
              try {
                window.localStorage.setItem(key, serialized)
                logger.success(`Successfully wrote data for ${key} after optimization`)
              } catch (retryError) {
                logger.error(`Failed to write data for ${key} even after optimization:`, retryError)
              }
            }
          }
        } catch (error) {
          logger.error(`Unexpected error processing write for plannerData:`, error)
        }
        logger.groupEnd()
      } else {
        try {
          window.localStorage.setItem(key, serialized)
          logger.success(`Successfully saved data for key: ${key}`)
        } catch (storageError) {
          logger.error(`Error writing to localStorage for ${key}:`, storageError)

          // If we get a quota error, try to optimize storage
          if (
            storageError instanceof DOMException &&
            (storageError.code === 22 || storageError.name === "QuotaExceededError")
          ) {
            logger.warn("Storage quota exceeded, attempting to optimize...")
            optimizeLocalStorage()

            // Try again after optimization
            try {
              window.localStorage.setItem(key, serialized)
              logger.success(`Successfully wrote data for ${key} after optimization`)
            } catch (retryError) {
              logger.error(`Failed to write data for ${key} even after optimization:`, retryError)
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Unexpected error processing write for ${key}:`, error)
    }
  })
}

// Enhanced optimizeLocalStorage function with better cleaning strategies
export function optimizeLocalStorage(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    logger.info("Starting localStorage optimization...")
    const before = getLocalStorageUsage()

    const keysToRemove = []
    const keysToCompress = []

    // First pass: identify candidates for removal or compression
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)

        // Remove null, empty or undefined values
        if (value === null || value === "" || value === "undefined" || value === "null") {
          keysToRemove.push(key)
          continue
        }

        // Check for very large items that might be compressible
        if (value && value.length > 100000) {
          // 100KB threshold
          keysToCompress.push(key)
        }

        // Check for JSON parse errors (invalid JSON)
        try {
          JSON.parse(value)
        } catch (e) {
          // Not valid JSON, but might be a string - don't remove
        }
      }
    }

    // Remove the identified keys
    let removedCount = 0
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key)
        delete memoryCache[key]
        delete cacheTimestamps[key]
        if (pendingWrites[key]) {
          delete pendingWrites[key]
        }
        removedCount++
      } catch (error) {
        logger.error(`Error removing item ${key}:`, error)
      }
    })

    // Try to compress large items
    let compressedCount = 0
    keysToCompress.forEach((key) => {
      try {
        const value = localStorage.getItem(key)
        if (!value) return

        // Parse and re-stringify to remove any extra whitespace
        try {
          const parsed = JSON.parse(value)

          // Add special handling for plannerData
          if (key === "plannerData" && typeof parsed === "object" && parsed !== null) {
            try {
              // Ensure blocks array exists and is valid
              if (!Array.isArray(parsed.blocks)) {
                parsed.blocks = []
              } else {
                // Validate each block
                parsed.blocks = parsed.blocks
                  .filter((block) => block && typeof block === "object")
                  .map((block) => {
                    return {
                      id: block.id || Date.now().toString() + Math.random().toString(36).substring(2),
                      title: block.title || "Untitled Block",
                      description: block.description || "",
                      startTime: block.startTime || "09:00",
                      endTime: block.endTime || "10:00",
                      date: block.date || new Date().toISOString().split("T")[0],
                      color: block.color || "bg-blue-500",
                      category: block.category || "work",
                      isRecurring: !!block.isRecurring,
                      recurringPattern: block.recurringPattern || null,
                      completed: !!block.completed,
                    }
                  })
              }

              // Ensure settings exist
              if (!parsed.settings || typeof parsed.settings !== "object") {
                parsed.settings = {
                  dayStartHour: 6,
                  dayEndHour: 22,
                  timeSlotHeight: 80,
                  defaultBlockDuration: 60,
                  categories: [],
                  templates: [],
                  showCompletedBlocks: true,
                }
              }

              // Ensure stats exist
              if (!parsed.stats || typeof parsed.stats !== "object") {
                parsed.stats = {
                  totalTimeBlocked: 0,
                  completedBlocks: 0,
                  streak: 0,
                  lastActiveDate: null,
                }
              }
            } catch (validationError) {
              logger.error(`Error validating plannerData:`, validationError)
            }
          }

          const compressed = JSON.stringify(parsed)

          // Only save if we actually saved space
          if (compressed.length < value.length) {
            localStorage.setItem(key, compressed)
            compressedCount++
          }
        } catch (e) {
          // Not valid JSON, can't compress
        }
      } catch (error) {
        logger.error(`Error compressing item ${key}:`, error)
      }
    })

    const after = getLocalStorageUsage()
    logger.info(`LocalStorage optimization complete:
      - Removed ${removedCount} items
      - Compressed ${compressedCount} items`)
    logger.storageReport(before.used, before.total, before.percentage)
    logger.storageReport(after.used, after.total, after.percentage)
    logger.info(`Saved: ${((before.used - after.used) / 1024 / 1024).toFixed(2)}MB`)
  } catch (error) {
    logger.error("Error optimizing localStorage:", error)
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
  }

  // Process all pending writes
  processPendingWrites()

  // Also ensure plannerData is saved directly
  if (typeof window !== "undefined" && memoryCache["plannerData"]) {
    try {
      const plannerData = memoryCache["plannerData"]
      const serialized = JSON.stringify(plannerData)
      window.localStorage.setItem("plannerData", serialized)
      logger.success("Directly saved plannerData during flush")
    } catch (error) {
      logger.error("Error directly saving plannerData during flush:", error)
    }
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
    logger.error(`Error removing localStorage item ${key}:`, error)
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
    logger.error("Error batch setting localStorage items:", error)
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
    logger.error("Error calculating localStorage usage:", error)
    return { used: 0, total: 5 * 1024 * 1024, percentage: 0 }
  }
}

// Detect and fix common data issues
export function repairCommonDataIssues(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    logger.info("Checking for common data issues...")

    // Check for plannerData specifically
    const plannerDataKey = "plannerData"
    try {
      const plannerData = localStorage.getItem(plannerDataKey)

      if (plannerData) {
        try {
          // Try to parse it
          const parsed = JSON.parse(plannerData)

          // Check for common issues
          let needsRepair = false

          // 1. Missing blocks array
          if (!Array.isArray(parsed.blocks)) {
            parsed.blocks = []
            needsRepair = true
          }

          // 2. Missing or invalid settings
          if (!parsed.settings || typeof parsed.settings !== "object") {
            parsed.settings = {
              dayStartHour: 6,
              dayEndHour: 22,
              timeSlotHeight: 80,
              defaultBlockDuration: 60,
              categories: [],
              templates: [],
              showCompletedBlocks: true,
            }
            needsRepair = true
          }

          // 3. Missing or invalid stats
          if (!parsed.stats || typeof parsed.stats !== "object") {
            parsed.stats = {
              totalTimeBlocked: 0,
              completedBlocks: 0,
              streak: 0,
              lastActiveDate: null,
            }
            needsRepair = true
          }

          // Save repaired data if needed
          if (needsRepair) {
            logger.info("Repairing plannerData structure")
            localStorage.setItem(plannerDataKey, JSON.stringify(parsed))

            // Update memory cache
            memoryCache[plannerDataKey] = parsed
            cacheTimestamps[plannerDataKey] = Date.now()
          }
        } catch (parseError) {
          logger.error("Error parsing plannerData:", parseError)
          // Don't attempt to fix JSON parse errors here - that's handled in getLocalStorage
        }
      }
    } catch (plannerError) {
      logger.error("Error checking plannerData:", plannerError)
    }

    logger.info("Data issue check complete")
  } catch (error) {
    logger.error("Error repairing data issues:", error)
  }
}
