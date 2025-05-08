/**
 * Utility functions for exporting and importing all local storage data
 */

// Import the helper functions
import { eventBus } from "./event-bus"
import { flushLocalStorageWrites } from "./local-storage"

// List of all localStorage keys used in the application
const ALL_KEYS = [
  "tasks",
  "notes",
  "recipes",
  "recipeCategories",
  "pomodoroSettings",
  "pomodoroSession",
  "bookmarks",
  "passwordEntries",
  "knowledgeItems",
  "knowledgeTags",
  "knowledgeCategories",
  "knowledgeSettings",
  "code-snippets",
  "mealPlannerData",
  "workoutHistory",
  "countdownTimers",
  "contacts",
  "contactGroups",
  "plannerData", // Ensure plannerData is included
  "markdownDocuments",
  "eventTimers",
  "financeData",
  // UI settings
  "theme",
  "themeMode",
  "sidebar-menu-collapsed",
  "sidebar-rail-collapsed",
  "sidebar-menu-width",
  "sidebar-rail-width",
  "onboarding-complete",
]

// Critical data keys that need special handling
const CRITICAL_DATA_KEYS = ["plannerData", "markdownDocuments", "recipes", "contacts", "tasks"]

// Safely get data from localStorage with error handling
function safeGetItem(key: string): any {
  try {
    const value = localStorage.getItem(key)
    if (!value) return null

    try {
      return JSON.parse(value)
    } catch {
      return value // Return as string if not valid JSON
    }
  } catch (err) {
    console.error(`Error retrieving ${key} from localStorage:`, err)
    return null
  }
}

// Safely set data to localStorage with error handling
function safeSetItem(key: string, value: any): boolean {
  try {
    const valueToStore = typeof value === "string" ? value : JSON.stringify(value)
    localStorage.setItem(key, valueToStore)
    return true
  } catch (err) {
    console.error(`Error storing ${key} to localStorage:`, err)
    return false
  }
}

// Backup critical data before export/import operations
function backupCriticalData(): Record<string, any> {
  const backup: Record<string, any> = {}

  CRITICAL_DATA_KEYS.forEach((key) => {
    try {
      const data = safeGetItem(key)
      if (data !== null) {
        backup[key] = data
        console.log(`Backed up ${key} data`)
      }
    } catch (error) {
      console.error(`Failed to backup ${key}:`, error)
    }
  })

  return backup
}

// Restore critical data if needed
function restoreCriticalData(backup: Record<string, any>): void {
  Object.entries(backup).forEach(([key, value]) => {
    try {
      if (safeGetItem(key) === null && value !== null) {
        console.log(`Restoring ${key} from backup`)
        safeSetItem(key, value)

        // Notify the application about the restored data
        if (key === "plannerData") {
          eventBus.publish("data:plannerData:updated", value)
          eventBus.publish("data:updated", { collection: "plannerData" })
        }
      }
    } catch (error) {
      console.error(`Failed to restore ${key}:`, error)
    }
  })
}

// Validate planner data structure
function validatePlannerData(data: any): boolean {
  if (!data) return false

  // Check for required properties
  if (!data.blocks || !Array.isArray(data.blocks)) {
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

// Create default planner data
function createDefaultPlannerData() {
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

// Optimize the exportAllData function for better performance
export function exportAllData(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Starting data export process...")

      // Force immediate save of any pending data
      if (typeof flushLocalStorageWrites === "function") {
        flushLocalStorageWrites()
      }

      // Backup critical data before export
      const criticalDataBackup = backupCriticalData()

      // Create an object with all localStorage data
      const allData: Record<string, any> = {}

      // Special handling for plannerData to ensure it's properly exported
      if (typeof window !== "undefined") {
        try {
          const rawPlannerData = window.localStorage.getItem("plannerData")
          if (rawPlannerData) {
            try {
              const plannerData = JSON.parse(rawPlannerData)
              console.log(
                "Found plannerData for export with",
                plannerData.blocks ? plannerData.blocks.length : 0,
                "blocks",
              )
              // Force an immediate save to ensure data is up to date
              window.localStorage.setItem("plannerData", rawPlannerData)
            } catch (parseError) {
              console.error("Error parsing plannerData during export:", parseError)
            }
          }
        } catch (error) {
          console.error("Error accessing plannerData during export:", error)
        }
      }

      let hasData = false

      // Process all keys
      for (const key of ALL_KEYS) {
        try {
          const value = safeGetItem(key)
          if (value !== null) {
            allData[key] = value
            hasData = true

            // Special handling for plannerData
            if (key === "plannerData") {
              console.log("Found plannerData for export:", value ? "data present" : "no data")

              // Validate planner data structure
              if (!validatePlannerData(value)) {
                console.warn("Planner data structure is invalid, using default")
                allData[key] = createDefaultPlannerData()
              }
            }
          }
        } catch (error) {
          console.error(`Error getting ${key} for export:`, error)
        }
      }

      if (!hasData) {
        alert("No data found to export.")
        resolve()
        return
      }

      // Add metadata to help with validation during import
      allData._metadata = {
        exportDate: new Date().toISOString(),
        appVersion: "1.0.0",
        dataFormat: "utility-hub-export-v1",
      }

      // Convert to JSON string
      const jsonData = JSON.stringify(allData, null, 2)

      // Create a blob and download link
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `utility-hub-data-${new Date().toISOString().split("T")[0]}.json`

      // Use a more efficient approach to trigger download
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Verify critical data is still intact after export
      restoreCriticalData(criticalDataBackup)

      console.log("Data export completed successfully")
      resolve()
    } catch (error) {
      console.error("Failed to export data:", error)
      alert("Failed to export data. See console for details.")
      reject(error)
    }
  })
}

// Validate imported data
function validateImportData(data: any): boolean {
  // Check if it has the expected metadata
  if (!data._metadata) {
    console.warn("Import data is missing metadata. It may not be a valid export file.")
    return window.confirm("The import file doesn't appear to be a valid export. Import anyway?")
  }

  // Check if it has any of our expected keys
  const hasExpectedKeys = ALL_KEYS.some((key) => key in data)
  if (!hasExpectedKeys) {
    console.warn("Import data doesn't contain any expected keys.")
    return window.confirm("The import file doesn't contain any recognizable data. Import anyway?")
  }

  return true
}

// Import modes
export enum ImportMode {
  REPLACE = "replace",
  MERGE = "merge",
}

// Import data from a JSON file
export function importAllData(file: File, mode: ImportMode = ImportMode.REPLACE): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      // Use setTimeout to prevent ResizeObserver loop errors
      setTimeout(async () => {
        try {
          if (!event.target?.result) {
            throw new Error("Failed to read file")
          }

          console.log("Starting data import process...")

          // Backup critical data before import
          const criticalDataBackup = backupCriticalData()

          const jsonData = JSON.parse(event.target.result as string) as Record<string, any>

          // Validate the imported data
          if (!validateImportData(jsonData)) {
            resolve() // User canceled import after validation warning
            return
          }

          // Special handling for plannerData during import
          if (jsonData.plannerData) {
            console.log(
              "Found plannerData in import with",
              jsonData.plannerData.blocks ? jsonData.plannerData.blocks.length : 0,
              "blocks",
            )

            // Ensure it's properly structured
            if (!jsonData.plannerData.blocks) {
              console.warn("plannerData blocks array is missing, initializing empty array")
              jsonData.plannerData.blocks = []
            }

            if (!jsonData.plannerData.settings) {
              console.warn("plannerData settings object is missing, initializing with defaults")
              jsonData.plannerData.settings = {
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
              }
            }

            if (!jsonData.plannerData.stats) {
              console.warn("plannerData stats object is missing, initializing with defaults")
              jsonData.plannerData.stats = {
                totalTimeBlocked: 0,
                completedBlocks: 0,
                streak: 0,
                lastActiveDate: null,
              }
            }
          }

          if (mode === ImportMode.REPLACE) {
            // Clear current localStorage for keys that exist in the import
            ALL_KEYS.forEach((key) => {
              if (key in jsonData) {
                localStorage.removeItem(key)
              }
            })
          }

          // Import all data
          let successCount = 0
          let errorCount = 0

          Object.entries(jsonData).forEach(([key, value]) => {
            // Skip metadata
            if (key === "_metadata") return

            // Skip keys not in our ALL_KEYS list for safety
            if (!ALL_KEYS.includes(key)) {
              console.warn(`Skipping unknown key in import: ${key}`)
              return
            }

            // For merge mode, handle special cases
            if (mode === ImportMode.MERGE) {
              const existingData = safeGetItem(key)

              // If we have existing data and it's an array or object, merge them
              if (existingData !== null && typeof existingData === "object") {
                if (Array.isArray(existingData) && Array.isArray(value)) {
                  // For arrays, concatenate and remove duplicates if they have IDs
                  if (existingData.length > 0 && "id" in existingData[0]) {
                    const existingIds = new Set(existingData.map((item: any) => item.id))
                    const newItems = value.filter((item: any) => !existingIds.has(item.id))
                    value = [...existingData, ...newItems]
                  } else {
                    // Simple concatenation for arrays without IDs
                    value = [...existingData, ...value]
                  }
                } else if (!Array.isArray(existingData) && !Array.isArray(value)) {
                  // For objects, merge properties
                  value = { ...existingData, ...value }
                }
              }
            }

            // Store the value
            if (safeSetItem(key, value)) {
              successCount++

              // Log when plannerData is successfully imported
              if (key === "plannerData") {
                console.log("Successfully imported plannerData")

                // Notify the application about the updated data
                eventBus.publish("data:plannerData:updated", value)
                eventBus.publish("data:updated", { collection: "plannerData" })
              }
            } else {
              errorCount++

              // Log when plannerData import fails
              if (key === "plannerData") {
                console.error("Failed to import plannerData")
              }
            }
          })

          // Verify critical data is still intact after import
          restoreCriticalData(criticalDataBackup)

          if (errorCount > 0) {
            alert(
              `Import completed with ${successCount} items imported successfully and ${errorCount} errors. The page will now reload to apply changes.`,
            )
          } else {
            alert(
              `Data imported successfully! ${successCount} items were imported. The page will now reload to apply changes.`,
            )
          }

          // Use requestAnimationFrame to avoid ResizeObserver issues during reload
          requestAnimationFrame(() => {
            window.location.reload()
          })

          resolve()
        } catch (error) {
          console.error("Failed to import data:", error)
          alert("Failed to import data. The file may be corrupted or in the wrong format.")
          reject(error)
        }
      }, 0)
    }

    reader.onerror = (error) => {
      console.error("Error reading file:", error)
      alert("Error reading file. Please try again.")
      reject(error)
    }

    reader.readAsText(file)
  })
}
