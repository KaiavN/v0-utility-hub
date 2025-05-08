/**
 * Special recovery functions for planner data
 */

import { eventBus } from "./event-bus"

// Add the structured logger to this file as well

// Add this at the top of the file, after the imports
const DEBUG = process.env.NODE_ENV === "development"

// Create a structured logger helper
const logger = {
  info: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.info(`%c🔄 RECOVERY: ${message}`, "color: #3b82f6; font-weight: bold;", ...data)
  },
  success: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.log(`%c✅ RECOVERY: ${message}`, "color: #10b981; font-weight: bold;", ...data)
  },
  warn: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.warn(`%c⚠️ RECOVERY: ${message}`, "color: #f59e0b; font-weight: bold;", ...data)
  },
  error: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.error(`%c❌ RECOVERY: ${message}`, "color: #ef4444; font-weight: bold;", ...data)
  },
  group: (name: string) => {
    if (!DEBUG) return
    console.group(`%c📋 RECOVERY: ${name}`, "color: #8b5cf6; font-weight: bold;")
  },
  groupEnd: () => {
    if (!DEBUG) return
    console.groupEnd()
  },
  debug: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.debug(`%c🔍 RECOVERY: ${message}`, "color: #6b7280; font-weight: bold;", ...data)
  },
  // Special method for recovery steps
  step: (stepNumber: number, message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.log(`%c🔄 RECOVERY STEP ${stepNumber}: ${message}`, "color: #8b5cf6; font-weight: bold;", ...data)
  },
}

// Default categories for planner
const defaultCategories = [
  { id: "work", name: "Work", color: "bg-blue-500" },
  { id: "personal", name: "Personal", color: "bg-green-500" },
  { id: "health", name: "Health & Fitness", color: "bg-red-500" },
  { id: "learning", name: "Learning", color: "bg-purple-500" },
  { id: "social", name: "Social", color: "bg-yellow-500" },
  { id: "other", name: "Other", color: "bg-gray-500" },
]

// Default templates for planner
const defaultTemplates = [
  {
    id: "productive-day",
    name: "Productive Day",
    blocks: [
      {
        title: "Morning Routine",
        description: "Meditation, exercise, and breakfast",
        startTime: "06:00",
        endTime: "07:30",
        color: "bg-green-500",
        category: "health",
        isRecurring: true,
        recurringPattern: "weekdays",
      },
      {
        title: "Deep Work Session",
        description: "Focus on most important task",
        startTime: "08:00",
        endTime: "10:00",
        color: "bg-blue-500",
        category: "work",
        isRecurring: true,
        recurringPattern: "weekdays",
      },
      // Other blocks...
    ],
  },
  {
    id: "weekend-balance",
    name: "Weekend Balance",
    blocks: [
      {
        title: "Morning Exercise",
        description: "Workout or yoga session",
        startTime: "08:00",
        endTime: "09:00",
        color: "bg-red-500",
        category: "health",
        isRecurring: true,
        recurringPattern: "weekends",
      },
      // Other blocks...
    ],
  },
]

// Default planner data structure
export const defaultPlannerData = {
  blocks: [],
  settings: {
    dayStartHour: 6,
    dayEndHour: 22,
    timeSlotHeight: 80,
    defaultBlockDuration: 60,
    categories: defaultCategories,
    templates: defaultTemplates,
    showCompletedBlocks: true,
  },
  stats: {
    totalTimeBlocked: 0,
    completedBlocks: 0,
    streak: 0,
    lastActiveDate: null,
  },
}

// Add a block validation function to ensure blocks are properly formatted during recovery
import { validateBlock } from "./data-manager"

/**
 * Attempts to recover planner data from localStorage
 * This is a more aggressive recovery function that tries multiple approaches
 */
export function recoverPlannerData(): boolean {
  // Check for backup data in sessionStorage
  if (typeof window !== "undefined") {
    try {
      const backupData = window.sessionStorage.getItem("plannerData_backup")
      if (backupData) {
        try {
          const parsedBackup = JSON.parse(backupData)
          if (
            parsedBackup &&
            parsedBackup.blocks &&
            Array.isArray(parsedBackup.blocks) &&
            parsedBackup.blocks.length > 0
          ) {
            logger.info(`Found backup plannerData in sessionStorage with ${parsedBackup.blocks.length} blocks`)

            // Check if localStorage has valid data
            const currentData = window.localStorage.getItem("plannerData")
            if (!currentData) {
              logger.info("No plannerData in localStorage, restoring from backup")
              window.localStorage.setItem("plannerData", backupData)
              return true
            }

            try {
              const parsedCurrent = JSON.parse(currentData)
              if (!parsedCurrent.blocks || !Array.isArray(parsedCurrent.blocks) || parsedCurrent.blocks.length === 0) {
                logger.info("Current plannerData is empty or invalid, restoring from backup")
                window.localStorage.setItem("plannerData", backupData)
                return true
              }

              // If backup has more blocks than current, use backup
              if (parsedBackup.blocks.length > parsedCurrent.blocks.length) {
                logger.info(
                  `Backup has more blocks (${parsedBackup.blocks.length}) than current (${parsedCurrent.blocks.length}), restoring from backup`,
                )
                window.localStorage.setItem("plannerData", backupData)
                return true
              }
            } catch (parseError) {
              logger.error("Error parsing current plannerData, restoring from backup:", parseError)
              window.localStorage.setItem("plannerData", backupData)
              return true
            }
          }
        } catch (parseError) {
          logger.error("Error parsing backup plannerData:", parseError)
        }
      }
    } catch (backupError) {
      logger.error("Error checking for backup plannerData:", backupError)
    }
  }
  try {
    logger.info("Attempting to recover planner data...")

    if (typeof window === "undefined") return false

    // First check if plannerData exists
    const rawData = window.localStorage.getItem("plannerData")

    if (!rawData) {
      logger.info("No plannerData found in localStorage, initializing with default")
      initializeDefaultPlannerData()
      return true
    }

    // Try to parse the data
    try {
      const parsedData = JSON.parse(rawData)

      // Check if it's valid
      if (isValidPlannerData(parsedData)) {
        logger.success("Existing plannerData is valid")
        return true
      }

      // If it's not valid, try to repair it
      logger.warn("Existing plannerData is invalid, attempting to repair")
      const repairedData = repairPlannerData(parsedData)

      // Save the repaired data
      window.localStorage.setItem("plannerData", JSON.stringify(repairedData))
      logger.success("Saved repaired plannerData")

      // Notify components
      eventBus.publish("data:plannerData:updated", repairedData)
      eventBus.publish("data:updated", { collection: "plannerData" })

      return true
    } catch (parseError) {
      logger.error("Error parsing plannerData:", parseError, { parseError })

      // Try to recover from common JSON errors
      try {
        const cleanedData = cleanJsonString(rawData)
        const recoveredData = JSON.parse(cleanedData)

        // Check if it's valid
        if (isValidPlannerData(recoveredData)) {
          logger.success("Successfully recovered plannerData from cleaned JSON")

          // Save the recovered data
          window.localStorage.setItem("plannerData", JSON.stringify(recoveredData))
          logger.success("Saved recovered plannerData")

          // Notify components
          eventBus.publish("data:plannerData:updated", recoveredData)
          eventBus.publish("data:updated", { collection: "plannerData" })

          return true
        }

        // If it's not valid, initialize with default
        logger.warn("Recovered data is not valid, initializing with default")
        initializeDefaultPlannerData()
        return true
      } catch (recoveryError) {
        logger.error("Failed to recover plannerData:", recoveryError, { recoveryError })

        // Initialize with default
        initializeDefaultPlannerData()
        return true
      }
    }
  } catch (error) {
    logger.error("Error in recoverPlannerData:", error, { error })

    // Initialize with default as a last resort
    try {
      initializeDefaultPlannerData()
      return true
    } catch (initError) {
      logger.error("Failed to initialize default plannerData:", initError, { initError })
      return false
    }
  }

  // Create a backup of the data in sessionStorage
  if (typeof window !== "undefined") {
    try {
      const currentData = window.localStorage.getItem("plannerData")
      if (currentData) {
        try {
          const parsedData = JSON.parse(currentData)
          if (parsedData && parsedData.blocks && Array.isArray(parsedData.blocks)) {
            logger.info(`Creating backup of plannerData with ${parsedData.blocks.length} blocks in sessionStorage`)
            window.sessionStorage.setItem("plannerData_backup", currentData)
          }
        } catch (parseError) {
          logger.error("Error parsing plannerData for backup:", parseError)
        }
      }
    } catch (backupError) {
      logger.error("Error creating backup of plannerData:", backupError)
    }
  }
  return false
}

/**
 * Initializes default planner data in localStorage
 */
function initializeDefaultPlannerData(): void {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem("plannerData", JSON.stringify(defaultPlannerData))
    logger.success("Initialized plannerData with default structure")

    // Notify components
    eventBus.publish("data:plannerData:updated", defaultPlannerData)
    eventBus.publish("data:updated", { collection: "plannerData" })
  } catch (error) {
    logger.error("Error initializing default plannerData:", error, { error })
    throw error
  }
}

/**
 * Checks if the planner data has a valid structure
 */
function isValidPlannerData(data: any): boolean {
  if (!data || typeof data !== "object") return false

  // Check for required properties
  if (!Array.isArray(data.blocks)) return false
  if (!data.settings || typeof data.settings !== "object") return false
  if (!data.stats || typeof data.stats !== "object") return false

  // Check for required settings properties
  const requiredSettings = ["dayStartHour", "dayEndHour", "timeSlotHeight", "defaultBlockDuration"]
  for (const prop of requiredSettings) {
    if (typeof data.settings[prop] !== "number") return false
  }

  // Check for categories and templates
  if (!Array.isArray(data.settings.categories)) return false
  if (!Array.isArray(data.settings.templates)) return false

  // Check for required stats properties
  const requiredStats = ["totalTimeBlocked", "completedBlocks", "streak"]
  for (const prop of requiredStats) {
    if (typeof data.stats[prop] !== "number") return false
  }

  return true
}

/**
 * Attempts to repair invalid planner data
 */
function repairPlannerData(data: any): any {
  // Start with default data
  const repairedData = JSON.parse(JSON.stringify(defaultPlannerData))

  try {
    // If data is not an object, return default
    if (!data || typeof data !== "object") return repairedData

    // Try to salvage blocks if they exist
    if (Array.isArray(data.blocks)) {
      repairedData.blocks = data.blocks
        .filter((block: any) => block && typeof block === "object")
        .map((block: any) => {
          const validatedBlock = validateBlock({
            id: block.id || Date.now().toString() + Math.random().toString(36).substring(2),
            title: block.title || "Untitled Block",
            description: block.description || "",
            startTime: block.startTime || "09:00",
            endTime: block.endTime || "10:00",
            date: block.date || new Date().toISOString().split("T")[0],
            color: block.color || "bg-blue-500",
            category: block.category || "work",
            isRecurring: !!block.isRecurring,
            recurringPattern: block.recurringPattern,
            completed: !!block.completed,
          })
          return validatedBlock
        })
    }

    // Try to salvage settings if they exist
    if (data.settings && typeof data.settings === "object") {
      // Merge with default settings
      repairedData.settings = {
        ...repairedData.settings,
        dayStartHour:
          typeof data.settings.dayStartHour === "number"
            ? Math.min(Math.max(data.settings.dayStartHour, 0), 23)
            : repairedData.settings.dayStartHour,
        dayEndHour:
          typeof data.settings.dayEndHour === "number"
            ? Math.min(Math.max(data.settings.dayEndHour, 0), 23)
            : repairedData.settings.dayEndHour,
        timeSlotHeight:
          typeof data.settings.timeSlotHeight === "number"
            ? Math.min(Math.max(data.settings.timeSlotHeight, 40), 200)
            : repairedData.settings.timeSlotHeight,
        defaultBlockDuration:
          typeof data.settings.defaultBlockDuration === "number"
            ? Math.min(Math.max(data.settings.defaultBlockDuration, 5), 240)
            : repairedData.settings.defaultBlockDuration,
        showCompletedBlocks:
          typeof data.settings.showCompletedBlocks === "boolean"
            ? data.settings.showCompletedBlocks
            : repairedData.settings.showCompletedBlocks,
      }

      // Try to salvage categories
      if (Array.isArray(data.settings.categories) && data.settings.categories.length > 0) {
        repairedData.settings.categories = data.settings.categories
          .filter((cat: any) => cat && typeof cat === "object" && cat.id && cat.name && cat.color)
          .map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            color: cat.color,
          }))

        // If no valid categories were found, use defaults
        if (repairedData.settings.categories.length === 0) {
          repairedData.settings.categories = defaultCategories
        }
      }

      // Try to salvage templates
      if (Array.isArray(data.settings.templates) && data.settings.templates.length > 0) {
        repairedData.settings.templates = data.settings.templates
          .filter(
            (template: any) =>
              template &&
              typeof template === "object" &&
              template.id &&
              template.name &&
              Array.isArray(template.blocks),
          )
          .map((template: any) => ({
            id: template.id,
            name: template.name,
            blocks: Array.isArray(template.blocks)
              ? template.blocks
                  .filter((block: any) => block && typeof block === "object")
                  .map((block) => validateBlock(block))
              : [],
          }))
      }
    }

    // Try to salvage stats if they exist
    if (data.stats && typeof data.stats === "object") {
      repairedData.stats = {
        totalTimeBlocked:
          typeof data.stats.totalTimeBlocked === "number"
            ? Math.max(0, data.stats.totalTimeBlocked)
            : repairedData.stats.totalTimeBlocked,
        completedBlocks:
          typeof data.stats.completedBlocks === "number"
            ? Math.max(0, data.stats.completedBlocks)
            : repairedData.stats.completedBlocks,
        streak: typeof data.stats.streak === "number" ? Math.max(0, data.stats.streak) : repairedData.stats.streak,
        lastActiveDate: data.stats.lastActiveDate || repairedData.stats.lastActiveDate,
      }
    }

    return repairedData
  } catch (error) {
    logger.error("Error repairing planner data:", error, { error })
    return repairedData
  }
}

/**
 * Cleans a JSON string by fixing common issues
 */
function cleanJsonString(jsonString: string): string {
  try {
    // Remove trailing commas
    let cleaned = jsonString
      .replace(/,\s*}/g, "}") // Remove trailing commas in objects
      .replace(/,\s*\]/g, "]") // Remove trailing commas in arrays
      .replace(/\\/g, "\\\\") // Escape backslashes
      .replace(/\n/g, "\\n") // Escape newlines
      .replace(/\r/g, "\\r") // Escape carriage returns
      .replace(/\t/g, "\\t") // Escape tabs
      .replace(/\f/g, "\\f") // Escape form feeds

    // Fix unquoted property names
    cleaned = cleaned.replace(/(\w+)(?=\s*:)/g, '"$1"')

    // Fix missing quotes around string values
    cleaned = cleaned.replace(/:(\s*)([^{}[\]"'\s,]+)/g, ':$1"$2"')

    return cleaned
  } catch (error) {
    logger.error("Error cleaning JSON string:", error, { error })
    throw error
  }
}
