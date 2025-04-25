/**
 * Utility functions for exporting and importing all local storage data
 */

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
  "onboarding-complete",
  "theme",
  "themeMode",
  "sidebar-menu-collapsed",
  "sidebar-rail-collapsed",
  "sidebar-menu-width",
  "sidebar-rail-width",
  "sidebar-inset",
  "sidebar-header",
  "sidebar-footer",
  "sidebar-search",
  "sidebar-nav",
  "sidebar-rail",
  "sidebar-menu",
  "sidebar-menu-button",
  "sidebar-menu-item",
  "sidebar-group",
  "sidebar-group-label",
  "sidebar-group-content",
  "sidebar-input",
  "sidebar-trigger",
  "sidebar-provider",
  "sidebar-inset",
  "sidebar",
  "kanbanBoard",
  "financeData",
  "markdownDocuments",
  "eventTimers",
]

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

// Optimize the exportAllData function for better performance
export function exportAllData(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create an object with all localStorage data
      const allData: Record<string, any> = {}
      let hasData = false

      // Use a more efficient approach to collect data
      const promises = ALL_KEYS.map(async (key) => {
        const value = safeGetItem(key)
        if (value !== null) {
          allData[key] = value
          hasData = true
        }
      })

      // Process all keys in parallel
      Promise.all(promises)
        .then(() => {
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
          resolve()
        })
        .catch(reject)
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
      setTimeout(() => {
        try {
          if (!event.target?.result) {
            throw new Error("Failed to read file")
          }

          const jsonData = JSON.parse(event.target.result as string) as Record<string, any>

          // Validate the imported data
          if (!validateImportData(jsonData)) {
            resolve() // User canceled import after validation warning
            return
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
            } else {
              errorCount++
            }
          })

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
