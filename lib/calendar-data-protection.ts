/**
 * Advanced protection mechanisms for calendar data integrity
 * This module provides functions to prevent and fix common calendar data issues
 */

import { eventBus } from "./event-bus"
import { validateBlock } from "./data-manager"
import { deepValidatePlannerData } from "./planner-data-diagnostic"

// Add this at the top of the file
const DEBUG = process.env.NODE_ENV === "development"

// Create a structured logger helper
const logger = {
  info: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.info(`%c🛡️ CALENDAR PROTECTION: ${message}`, "color: #3b82f6; font-weight: bold;", ...data)
  },
  success: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.log(`%c✅ CALENDAR PROTECTION: ${message}`, "color: #10b981; font-weight: bold;", ...data)
  },
  warn: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.warn(`%c⚠️ CALENDAR PROTECTION: ${message}`, "color: #f59e0b; font-weight: bold;", ...data)
  },
  error: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.error(`%c❌ CALENDAR PROTECTION: ${message}`, "color: #ef4444; font-weight: bold;", ...data)
  },
}

/**
 * Safe wrapper function for adding blocks to the calendar
 * This ensures all blocks are validated before being added
 *
 * @param blocksToAdd Array of blocks to add
 * @returns Array of validated blocks
 */
export function safeAddBlocks(blocksToAdd: any[]): any[] {
  if (!Array.isArray(blocksToAdd)) {
    logger.error("blocksToAdd is not an array")
    return []
  }

  logger.info(`Validating ${blocksToAdd.length} blocks before adding`)

  // Validate each block
  const validatedBlocks = blocksToAdd.map((block) => validateBlock(block)).filter((block) => block !== null)

  const invalidCount = blocksToAdd.length - validatedBlocks.length
  if (invalidCount > 0) {
    logger.warn(`Filtered out ${invalidCount} invalid blocks`)
  }

  return validatedBlocks
}

/**
 * Sets up protection mechanisms for calendar data
 * Call this function once when the application initializes
 */
export function setupCalendarDataProtection(): void {
  if (typeof window === "undefined") return

  // Run periodic deep validation
  const runPeriodicValidation = () => {
    logger.info("Running periodic validation")
    try {
      deepValidatePlannerData()
    } catch (error) {
      logger.error("Error in periodic validation:", error)
    }
  }

  // Set up interval for periodic validation (every 30 minutes)
  setInterval(runPeriodicValidation, 30 * 60 * 1000)

  // Subscribe to data change events to validate data after changes
  eventBus.subscribe("data:plannerData:updated", (data: any) => {
    // Only validate if data contains blocks
    if (data && Array.isArray(data.blocks)) {
      const invalidBlocks = data.blocks.filter((block: any) => !validateBlock(block))
      if (invalidBlocks.length > 0) {
        logger.warn(`Detected ${invalidBlocks.length} invalid blocks after data update`)
        // Schedule a deep validation in the background
        setTimeout(() => {
          deepValidatePlannerData()
        }, 100)
      }
    }
  })

  logger.success("Calendar data protection set up successfully")
}

/**
 * Validates an array of blocks and filters out invalid ones
 * @param blocks Array of calendar blocks
 * @returns Array of valid blocks
 */
export function validateBlocks(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) return []

  const validBlocks = blocks.map((block) => validateBlock(block)).filter((block) => block !== null)

  const invalidCount = blocks.length - validBlocks.length
  if (invalidCount > 0) {
    logger.warn(`Filtered out ${invalidCount} invalid blocks`)
  }

  return validBlocks
}

// Initialize protection when module is loaded
if (typeof window !== "undefined") {
  // Delay setup to ensure everything is loaded
  setTimeout(setupCalendarDataProtection, 5000)
}
