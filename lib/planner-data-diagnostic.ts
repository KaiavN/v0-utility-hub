/**
 * Diagnostic utilities for planner data issues
 */

import { eventBus } from "./event-bus"

// Define the structure of planner data for type checking
interface TimeBlock {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  date: string
  color: string
  category: string
  isRecurring: boolean
  recurringPattern?: "daily" | "weekly" | "monthly" | "weekdays" | "weekends"
  completed: boolean
}

interface PlannerData {
  blocks: TimeBlock[]
  settings: {
    dayStartHour: number
    dayEndHour: number
    timeSlotHeight: number
    defaultBlockDuration: number
    categories: Array<{ id: string; name: string; color: string }>
    templates: Array<any>
    showCompletedBlocks: boolean
  }
  stats: {
    totalTimeBlocked: number
    completedBlocks: number
    streak: number
    lastActiveDate: string | null
  }
}

// Default data structure for initialization
const defaultPlannerData: PlannerData = {
  blocks: [],
  settings: {
    dayStartHour: 6,
    dayEndHour: 22,
    timeSlotHeight: 80,
    defaultBlockDuration: 60,
    categories: [
      { id: "work", name: "Work", color: "bg-blue-500" },
      { id: "personal", name: "Personal", color: "bg-green-500" },
      { id: "health", name: "Health & Fitness", color: "bg-red-500" },
      { id: "learning", name: "Learning", color: "bg-purple-500" },
      { id: "social", name: "Social", color: "bg-yellow-500" },
      { id: "other", name: "Other", color: "bg-gray-500" },
    ],
    templates: [],
    showCompletedBlocks: true,
  },
  stats: {
    totalTimeBlocked: 0,
    completedBlocks: 0,
    streak: 0,
    lastActiveDate: null,
  },
}

// Add this at the top of the file, after the imports
const DEBUG = process.env.NODE_ENV === "development"

// Create a structured logger helper
const logger = {
  info: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.info(`%c🔍 DIAGNOSTIC INFO: ${message}`, "color: #3b82f6; font-weight: bold;", ...data)
  },
  success: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.log(`%c✅ DIAGNOSTIC SUCCESS: ${message}`, "color: #10b981; font-weight: bold;", ...data)
  },
  warn: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.warn(`%c⚠️ DIAGNOSTIC WARNING: ${message}`, "color: #f59e0b; font-weight: bold;", ...data)
  },
  error: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.error(`%c❌ DIAGNOSTIC ERROR: ${message}`, "color: #ef4444; font-weight: bold;", ...data)
  },
  group: (name: string) => {
    if (!DEBUG) return
    console.group(`%c📋 DIAGNOSTIC: ${name}`, "color: #8b5cf6; font-weight: bold;")
  },
  groupEnd: () => {
    if (!DEBUG) return
    console.groupEnd()
  },
  debug: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.debug(`%c🔍 DIAGNOSTIC DEBUG: ${message}`, "color: #6b7280; font-weight: bold;", ...data)
  },
  table: (data: any, message?: string) => {
    if (!DEBUG) return
    if (message) {
      console.log(`%c📊 DIAGNOSTIC: ${message}:`, "color: #8b5cf6; font-weight: bold;")
    }
    console.table(data)
  },
}

/**
 * Run a comprehensive diagnostic on planner data
 * This function checks for common issues and attempts to fix them
 */
export function runPlannerDataDiagnostic(): {
  success: boolean
  issues: string[]
  fixed: string[]
  data: any | null
} {
  const issues: string[] = []
  const fixed: string[] = []
  let data: PlannerData | null = null

  try {
    logger.info("Step 1: Checking if localStorage is available")
    if (typeof window === "undefined") {
      issues.push("localStorage is not available (server-side rendering)")
      return { success: false, issues, fixed, data: defaultPlannerData }
    }

    logger.info("Step 2: Checking if plannerData exists in localStorage")
    const rawData = window.localStorage.getItem("plannerData")
    if (!rawData) {
      logger.warn("No plannerData found in localStorage")
      issues.push("No plannerData found in localStorage")

      // Initialize with default data
      window.localStorage.setItem("plannerData", JSON.stringify(defaultPlannerData))
      fixed.push("Initialized plannerData with default structure")
      data = defaultPlannerData

      // Notify components
      eventBus.publish("data:plannerData:updated", defaultPlannerData)
      eventBus.publish("data:updated", { collection: "plannerData" })

      return { success: true, issues, fixed, data }
    }

    logger.info("Step 3: Parsing plannerData from localStorage")
    try {
      data = JSON.parse(rawData)
    } catch (error) {
      logger.error("Failed to parse plannerData:", error)
      issues.push("Failed to parse plannerData from localStorage")

      // Reset to default data
      window.localStorage.setItem("plannerData", JSON.stringify(defaultPlannerData))
      fixed.push("Reset plannerData to default structure due to parse error")
      data = defaultPlannerData

      // Notify components
      eventBus.publish("data:plannerData:updated", defaultPlannerData)
      eventBus.publish("data:updated", { collection: "plannerData" })
    }

    logger.info("Step 4: Validating data structure")
    if (!data || typeof data !== "object") {
      logger.error("plannerData is not a valid object")
      issues.push("plannerData is not a valid object")

      // Reset to default data
      window.localStorage.setItem("plannerData", JSON.stringify(defaultPlannerData))
      fixed.push("Reset plannerData to default structure due to invalid data")
      data = defaultPlannerData

      // Notify components
      eventBus.publish("data:plannerData:updated", defaultPlannerData)
      eventBus.publish("data:updated", { collection: "plannerData" })
    } else {
      // Type check the data
      const typedData = data as PlannerData

      if (!typedData.blocks || !Array.isArray(typedData.blocks)) {
        logger.error("blocks property is missing or not an array")
        issues.push("blocks property is missing or not an array")
        typedData.blocks = []
        fixed.push("Initialized blocks property to an empty array")
      }

      if (!typedData.settings || typeof typedData.settings !== "object") {
        logger.error("settings property is missing or not an object")
        issues.push("settings property is missing or not an object")
        typedData.settings = defaultPlannerData.settings
        fixed.push("Initialized settings property to default settings")
      }

      if (!typedData.stats || typeof typedData.stats !== "object") {
        logger.error("stats property is missing or not an object")
        issues.push("stats property is missing or not an object")
        typedData.stats = defaultPlannerData.stats
        fixed.push("Initialized stats property to default stats")
      }

      data = typedData
    }

    logger.info("Step 5: Validating time block structure")
    if (data && data.blocks) {
      const invalidBlocks = data.blocks.filter((block) => {
        return (
          !block.id ||
          !block.title ||
          !block.description ||
          !block.startTime ||
          !block.endTime ||
          !block.date ||
          !block.color ||
          !block.category ||
          typeof block.isRecurring !== "boolean"
        )
      })

      if (invalidBlocks.length > 0) {
        logger.warn(`${invalidBlocks.length} invalid blocks found`)
        issues.push(`${invalidBlocks.length} invalid blocks found`)

        // Remove invalid blocks
        data.blocks = data.blocks.filter((block) => !invalidBlocks.includes(block))
        fixed.push(`Removed ${invalidBlocks.length} invalid blocks`)
      }
    }

    logger.info("Step 6: Saving updated plannerData to localStorage")
    window.localStorage.setItem("plannerData", JSON.stringify(data))
    fixed.push("Saved updated plannerData to localStorage")

    // Notify components
    eventBus.publish("data:plannerData:updated", data)
    eventBus.publish("data:updated", { collection: "plannerData" })

    return { success: true, issues, fixed, data }
  } catch (error) {
    logger.error("An unexpected error occurred:", error)
    issues.push("An unexpected error occurred")
    return { success: false, issues, fixed, data: defaultPlannerData }
  }
}

// Add a new function below runPlannerDataDiagnostic to perform deep validation:

/**
 * Performs a thorough validation of all blocks in the planner data
 * This helps identify and remove problematic blocks before they cause issues
 */
export function deepValidatePlannerData() {
  try {
    logger.info("Running deep validation of planner data")

    if (typeof window === "undefined") {
      logger.warn("localStorage is not available (server-side rendering)")
      return { success: false, validated: 0, removed: 0 }
    }

    // Get the current data
    const rawData = window.localStorage.getItem("plannerData")
    if (!rawData) {
      logger.warn("No plannerData found in localStorage")
      return { success: false, validated: 0, removed: 0 }
    }

    try {
      const data = JSON.parse(rawData)

      // Check if blocks array exists
      if (!data.blocks || !Array.isArray(data.blocks)) {
        logger.warn("blocks property is missing or not an array")
        return { success: false, validated: 0, removed: 0 }
      }

      const originalCount = data.blocks.length
      logger.info(`Validating ${originalCount} blocks`)

      // Filter out any null or undefined entries
      const nonNullBlocks = data.blocks.filter((block) => block !== null && block !== undefined)
      if (nonNullBlocks.length < originalCount) {
        logger.warn(`Removed ${originalCount - nonNullBlocks.length} null/undefined blocks`)
      }

      // For each block, run the validateBlock function from data-manager
      const { validateBlock } = require("./data-manager")

      // Only keep blocks that pass validation
      const validBlocks = nonNullBlocks.map((block) => validateBlock(block)).filter((block) => block !== null)

      const removedCount = originalCount - validBlocks.length
      logger.info(`Removed ${removedCount} invalid blocks during deep validation`)

      // Only update if blocks were removed
      if (removedCount > 0) {
        data.blocks = validBlocks

        // Save back to localStorage
        window.localStorage.setItem("plannerData", JSON.stringify(data))

        // Notify components
        const { eventBus } = require("./event-bus")
        eventBus.publish("data:plannerData:updated", data)
        eventBus.publish("data:updated", { collection: "plannerData" })

        logger.success(`Deep validation complete: removed ${removedCount} blocks, saved ${validBlocks.length} blocks`)
      } else {
        logger.success(`Deep validation complete: all ${validBlocks.length} blocks are valid`)
      }

      return {
        success: true,
        validated: validBlocks.length,
        removed: removedCount,
      }
    } catch (error) {
      logger.error("Error during deep validation:", error)
      return { success: false, validated: 0, removed: 0 }
    }
  } catch (error) {
    logger.error("Unexpected error in deepValidatePlannerData:", error)
    return { success: false, validated: 0, removed: 0 }
  }
}

// Update fixPlannerDataIssues to use deep validation:
// Find the fixPlannerDataIssues function and replace it with:

// Fix planner data issues
export function fixPlannerDataIssues(): boolean {
  try {
    // First run the standard diagnostic
    const diagnosticResult = runPlannerDataDiagnostic()

    // Then perform deep validation to ensure all blocks are valid
    const validationResult = deepValidatePlannerData()

    return diagnosticResult.success && validationResult.success
  } catch (error) {
    logger.error("Error fixing planner data issues:", error)
    return false
  }
}

// Add debug functions to window
export function exposeDebugFunctions(): void {
  if (typeof window !== "undefined") {
    ;(window as any).debugPlannerData = {
      runDiagnostic: runPlannerDataDiagnostic,
      fixIssues: fixPlannerDataIssues,
      getDefaultData: () => defaultPlannerData,
      resetToDefault: () => {
        window.localStorage.setItem("plannerData", JSON.stringify(defaultPlannerData))
        eventBus.publish("data:plannerData:updated", defaultPlannerData)
        eventBus.publish("data:updated", { collection: "plannerData" })
      },
    }
  }
}
