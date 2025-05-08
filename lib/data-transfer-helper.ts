// Add a new helper file to ensure data integrity during export/import

import { flushLocalStorageWrites } from "./local-storage"

/**
 * Helper functions for data transfer operations
 */

// Function to ensure all pending data is saved before export
export function ensureDataSaved(): Promise<void> {
  return new Promise((resolve) => {
    try {
      // Force flush any pending writes
      if (typeof flushLocalStorageWrites === "function") {
        flushLocalStorageWrites()
      }

      // Specifically check for planner data
      if (typeof window !== "undefined") {
        const plannerData = window.localStorage.getItem("plannerData")
        if (plannerData) {
          try {
            // Validate that it's proper JSON
            JSON.parse(plannerData)
            console.log("Planner data validated before export")
          } catch (e) {
            console.error("Planner data is not valid JSON:", e)
          }
        } else {
          console.warn("No planner data found in localStorage")
        }
      }

      // Small delay to ensure all async operations complete
      setTimeout(resolve, 100)
    } catch (e) {
      console.error("Error ensuring data is saved:", e)
      resolve() // Resolve anyway to not block the export
    }
  })
}

// Function to validate planner data structure
export function validatePlannerData(data: any): boolean {
  if (!data) return false

  // Check for required properties
  if (!Array.isArray(data.blocks)) {
    console.error("Planner data blocks is not an array")
    return false
  }

  if (!data.settings || typeof data.settings !== "object") {
    console.error("Planner data settings is not an object")
    return false
  }

  if (!data.stats || typeof data.stats !== "object") {
    console.error("Planner data stats is not an object")
    return false
  }

  return true
}

// Function to create default planner data
export function createDefaultPlannerData() {
  return {
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
}
