import {
  getLocalStorage,
  setLocalStorage,
  batchSetLocalStorage,
  optimizeLocalStorage,
  removeLocalStorage,
  isLocalStorageAvailable,
  getLocalStorageUsage,
} from "./local-storage"

// Add the import for eventBus at the top of the file
import { eventBus } from "./event-bus"

// Add this at the top of the file, after the imports
const DEBUG = process.env.NODE_ENV === "development"

// Create a structured logger helper
const logger = {
  info: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.info(`%c💾 DATA MANAGER: ${message}`, "color: #3b82f6; font-weight: bold;", ...data)
  },
  success: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.log(`%c✅ DATA MANAGER: ${message}`, "color: #10b981; font-weight: bold;", ...data)
  },
  warn: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.warn(`%c⚠️ DATA MANAGER: ${message}`, "color: #f59e0b; font-weight: bold;", ...data)
  },
  error: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.error(`%c❌ DATA MANAGER: ${message}`, "color: #ef4444; font-weight: bold;", ...data)
  },
  group: (name: string) => {
    if (!DEBUG) return
    console.group(`%c📋 DATA MANAGER: ${name}`, "color: #8b5cf6; font-weight: bold;")
  },
  groupEnd: () => {
    if (!DEBUG) return
    console.groupEnd()
  },
  debug: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.debug(`%c🔍 DATA MANAGER: ${message}`, "color: #6b7280; font-weight: bold;", ...data)
  },
  table: (data: any, message?: string) => {
    if (!DEBUG) return
    if (message) {
      console.log(`%c📊 DATA MANAGER: ${message}:`, "color: #8b5cf6; font-weight: bold;")
    }
    console.table(data)
  },
}

// Add a new function to validate block structure before saving it to ensure all blocks are valid

/**
 * Validates a time block to ensure it has all required properties before saving
 * @param block The block to validate
 * @returns The validated block with any missing properties added using defaults, or null if the block is fundamentally invalid
 */
export function validateBlock(block: any): any {
  if (!block) return null

  try {
    // Check if the object has minimal required properties to be considered a valid block
    const hasMinimalRequirements =
      block &&
      typeof block === "object" &&
      // At least one of these identifiers should be present
      (block.id || block.title || (block.startTime && block.endTime))

    if (!hasMinimalRequirements) {
      logger.error("Block fails minimal requirements check:", block)
      return null
    }

    // Ensure the block has all required fields
    const validatedBlock = {
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

    // Perform additional validation on time format
    const timeFormatRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeFormatRegex.test(validatedBlock.startTime)) {
      logger.warn(`Invalid startTime format (${validatedBlock.startTime}), resetting to default`)
      validatedBlock.startTime = "09:00"
    }

    if (!timeFormatRegex.test(validatedBlock.endTime)) {
      logger.warn(`Invalid endTime format (${validatedBlock.endTime}), resetting to default`)
      validatedBlock.endTime = "10:00"
    }

    // Validate date format (YYYY-MM-DD)
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateFormatRegex.test(validatedBlock.date)) {
      try {
        // Try to convert to ISO format
        const parsedDate = new Date(validatedBlock.date)
        if (!isNaN(parsedDate.getTime())) {
          validatedBlock.date = parsedDate.toISOString().split("T")[0]
        } else {
          logger.warn(`Invalid date format (${validatedBlock.date}), resetting to today`)
          validatedBlock.date = new Date().toISOString().split("T")[0]
        }
      } catch (e) {
        logger.warn(`Error parsing date (${validatedBlock.date}), resetting to today`)
        validatedBlock.date = new Date().toISOString().split("T")[0]
      }
    }

    // Validate that start time is before end time
    const [startHour, startMinute] = validatedBlock.startTime.split(":").map(Number)
    const [endHour, endMinute] = validatedBlock.endTime.split(":").map(Number)

    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    if (startMinutes >= endMinutes) {
      logger.warn(
        `End time (${validatedBlock.endTime}) is not after start time (${validatedBlock.startTime}), adjusting`,
      )
      validatedBlock.endTime = `${String(startHour + 1).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`
    }

    return validatedBlock
  } catch (error) {
    logger.error("Error validating block:", error)
    return null
  }
}

// Declare memoryCache
declare global {
  var memoryCache: any
}

// Define types for different data categories
export interface AppData {
  tasks?: any[]
  notes?: any[]
  recipes?: any[]
  recipeCategories?: any[]
  pomodoroSettings?: any
  pomodoroSession?: any
  bookmarks?: any[]
  passwordEntries?: any[]
  knowledgeItems?: any[]
  knowledgeTags?: any[]
  knowledgeCategories?: any[]
  knowledgeSettings?: any
  codeSnippets?: any[]
  mealPlannerData?: any
  workoutHistory?: any[]
  countdownTimers?: any[]
  contacts?: any[]
  contactGroups?: any[]
  financeData?: any
  markdownDocuments?: any[]
  eventTimers?: any
  userPreferences?: any
  ganttData?: any
  ganttSettings?: any
  spotifyPreferences?: any
  aiChatHistory?: any[]
  citations?: any[]
  assignments?: any[]
  projects?: any[]
  meetings?: any[]
  clients?: any[]
  billingData?: any[]
  flashcards?: any[]
  plannerData?: any
}

// Define settings interface
export interface AppSettings {
  theme?: string
  themeColor?: string
  fontSize?: number
  sidebarCollapsed?: boolean
  sidebarWidth?: number
  onboardingComplete?: boolean
  [key: string]: any
}

// Keys for localStorage
const DATA_KEYS: Record<keyof AppData, string> = {
  tasks: "tasks",
  notes: "notes",
  recipes: "recipes",
  recipeCategories: "recipeCategories",
  pomodoroSettings: "pomodoroSettings",
  pomodoroSession: "pomodoroSession",
  bookmarks: "bookmarks",
  passwordEntries: "passwordEntries",
  knowledgeItems: "knowledgeItems",
  knowledgeTags: "knowledgeTags",
  knowledgeCategories: "knowledgeCategories",
  knowledgeSettings: "knowledgeSettings",
  codeSnippets: "code-snippets",
  mealPlannerData: "mealPlannerData",
  workoutHistory: "workoutHistory",
  countdownTimers: "countdownTimers",
  contacts: "contacts",
  contactGroups: "contactGroups",
  financeData: "financeData",
  markdownDocuments: "markdownDocuments",
  eventTimers: "eventTimers",
  userPreferences: "userPreferences",
  ganttData: "ganttData", // Updated to match the actual storage key used in the gantt component
  ganttSettings: "gantt-settings",
  spotifyPreferences: "spotifyPreferences",
  aiChatHistory: "aiChatHistory",
  citations: "citations",
  assignments: "assignments",
  projects: "projects",
  meetings: "meetings",
  clients: "clients",
  billingData: "billingData",
  flashcards: "flashcards",
  plannerData: "plannerData", // Added for the calendar/planner feature
}

const SETTINGS_KEYS: Record<string, string> = {
  theme: "theme",
  themeColor: "global-theme-color",
  fontSize: "global-font-size",
  sidebarCollapsed: "sidebar-menu-collapsed",
  sidebarWidth: "sidebar-menu-width",
  onboardingComplete: "onboarding-complete",
}

// Load all app data
export function loadAllData(): AppData {
  const data: AppData = {}

  // Load each data category
  Object.entries(DATA_KEYS).forEach(([key, storageKey]) => {
    data[key as keyof AppData] = getLocalStorage(storageKey, null)
  })

  return data
}

// Save all app data
export function saveAllData(data: AppData): void {
  const updates: Record<string, any> = {}

  // Prepare updates for each data category
  Object.entries(DATA_KEYS).forEach(([key, storageKey]) => {
    const value = data[key as keyof AppData]
    if (value !== undefined) {
      updates[storageKey] = value
    }
  })

  // Batch save all updates
  batchSetLocalStorage(updates)
}

// Load app settings
export function loadSettings(): AppSettings {
  const settings: AppSettings = {}

  // Load each setting
  Object.entries(SETTINGS_KEYS).forEach(([key, storageKey]) => {
    settings[key] = getLocalStorage(storageKey, undefined)
  })

  return settings
}

// Save app settings
export function saveSettings(settings: AppSettings): void {
  const updates: Record<string, any> = {}

  // Prepare updates for each setting
  Object.entries(SETTINGS_KEYS).forEach(([key, storageKey]) => {
    const value = settings[key]
    if (value !== undefined) {
      updates[storageKey] = value
    }
  })

  // Batch save all updates
  batchSetLocalStorage(updates)
}

// Optimize storage usage
export function optimizeStorage(): void {
  optimizeLocalStorage()
}

// Add a new function to validate data integrity:
export function validateDataIntegrity(): boolean {
  let isValid = true

  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    logger.error("LocalStorage is not available")
    return false
  }

  // Check each data category
  Object.entries(DATA_KEYS).forEach(([key, storageKey]) => {
    try {
      const data = getLocalStorage(storageKey, null)
      // If data exists but is corrupted (not null but invalid), log an error
      if (data === null) {
        // This is fine - data doesn't exist yet
      }
    } catch (error) {
      logger.error(`Data integrity issue with ${key}:`, error)
      isValid = false
    }
  })

  return isValid
}

// Add a function to validate and repair data structures
export function validateDataStructure<T>(category: keyof AppData, data: T): T {
  if (!data) return data

  // Create a deep copy to avoid mutating the original
  const validatedData = JSON.parse(JSON.stringify(data))

  // Validate specific data structures based on category
  switch (category) {
    case "plannerData":
      if (!validatedData.stats) {
        validatedData.stats = {
          totalTimeBlocked: 0,
          completedBlocks: 0,
          streak: 0,
          lastActiveDate: null,
        }
      } else {
        // Ensure all stats properties exist with valid values
        validatedData.stats = {
          totalTimeBlocked:
            typeof validatedData.stats.totalTimeBlocked === "number"
              ? Math.max(0, validatedData.stats.totalTimeBlocked)
              : 0,
          completedBlocks:
            typeof validatedData.stats.completedBlocks === "number"
              ? Math.max(0, validatedData.stats.completedBlocks)
              : 0,
          streak: typeof validatedData.stats.streak === "number" ? Math.max(0, validatedData.stats.streak) : 0,
          lastActiveDate: validatedData.stats.lastActiveDate || null,
        }
      }

      if (!validatedData.settings) {
        validatedData.settings = {
          dayStartHour: 6,
          dayEndHour: 22,
          timeSlotHeight: 80,
          defaultBlockDuration: 60,
          categories: [],
          templates: [],
          showCompletedBlocks: true,
        }
      } else {
        // Ensure all settings properties exist with valid values
        validatedData.settings = {
          dayStartHour:
            typeof validatedData.settings.dayStartHour === "number"
              ? Math.min(Math.max(validatedData.settings.dayStartHour, 0), 23)
              : 6,
          dayEndHour:
            typeof validatedData.settings.dayEndHour === "number"
              ? Math.min(Math.max(validatedData.settings.dayEndHour, 0), 23)
              : 22,
          timeSlotHeight:
            typeof validatedData.settings.timeSlotHeight === "number"
              ? Math.min(Math.max(validatedData.settings.timeSlotHeight, 40), 200)
              : 80,
          defaultBlockDuration:
            typeof validatedData.settings.defaultBlockDuration === "number"
              ? Math.min(Math.max(validatedData.settings.defaultBlockDuration, 5), 240)
              : 60,
          categories: Array.isArray(validatedData.settings.categories) ? validatedData.settings.categories : [],
          templates: Array.isArray(validatedData.settings.templates) ? validatedData.settings.templates : [],
          showCompletedBlocks:
            typeof validatedData.settings.showCompletedBlocks === "boolean"
              ? validatedData.settings.showCompletedBlocks
              : true,
        }
      }

      if (!Array.isArray(validatedData.blocks)) {
        validatedData.blocks = []
      } else {
        // Validate each block
        validatedData.blocks = validatedData.blocks
          .filter((block) => block && typeof block === "object")
          .map((block: any) => {
            // Replace this section with the following to use our validateBlock function:
            return validateBlock(block)
          })
      }
      break

    // Add other data structure validations as needed

    default:
      // No specific validation for this category
      break
  }

  return validatedData
}

// Add a function to repair corrupted data:
export function repairCorruptedData(): void {
  Object.entries(DATA_KEYS).forEach(([key, storageKey]) => {
    try {
      getLocalStorage(storageKey, null)
    } catch (error) {
      logger.warn(`Repairing corrupted data for ${key}`)
      removeLocalStorage(storageKey)
    }
  })
}

// Add a function to force immediate write of all pending data
export function forceSaveAllData(data?: AppData): void {
  console.log("🔄 Data Manager: forceSaveAllData called")

  const dataToSave = data || loadAllData()
  const updates: Record<string, any> = {}

  // Special handling for plannerData to ensure it's saved properly
  if (typeof window !== "undefined") {
    try {
      const rawData = window.localStorage.getItem("plannerData")
      if (rawData) {
        try {
          const plannerData = JSON.parse(rawData)
          console.log(
            "🔄 Data Manager: Found existing plannerData with",
            plannerData.blocks ? plannerData.blocks.length : 0,
            "blocks",
          )

          // Make sure we're not overwriting with empty data
          if (
            dataToSave.plannerData &&
            (!dataToSave.plannerData.blocks || dataToSave.plannerData.blocks.length === 0) &&
            plannerData.blocks &&
            plannerData.blocks.length > 0
          ) {
            console.log("⚠️ Data Manager: Preventing overwrite of plannerData with empty blocks")
            dataToSave.plannerData = plannerData
          }

          // Force an immediate save to ensure data persistence
          window.localStorage.setItem("plannerData", JSON.stringify(dataToSave.plannerData || plannerData))
          console.log(
            "✅ Data Manager: Forced immediate save of plannerData with",
            dataToSave.plannerData?.blocks?.length || plannerData.blocks?.length || 0,
            "blocks",
          )
        } catch (error) {
          console.error("❌ Data Manager: Error parsing plannerData in forceSaveAllData:", error)
        }
      } else if (dataToSave.plannerData) {
        // No existing data, but we have data to save
        window.localStorage.setItem("plannerData", JSON.stringify(dataToSave.plannerData))
        console.log("✅ Data Manager: Saved new plannerData with", dataToSave.plannerData.blocks?.length || 0, "blocks")
      }
    } catch (error) {
      console.error("❌ Data Manager: Error accessing localStorage in forceSaveAllData:", error)
    }
  }

  // Prepare updates for each data category
  Object.entries(DATA_KEYS).forEach(([key, storageKey]) => {
    const value = dataToSave[key as keyof AppData]
    if (value !== undefined) {
      updates[storageKey] = value
    }
  })

  // Batch save all updates immediately
  batchSetLocalStorage(updates, true)
  logger.success("Forced save of all data completed")

  // Emit events for each updated data category
  Object.entries(DATA_KEYS).forEach(([key, storageKey]) => {
    const value = dataToSave[key as keyof AppData]
    if (value !== undefined) {
      eventBus.publish(`data:${key}:updated`, value)
      eventBus.publish("data:updated", { collection: key })
    }
  })
}

// Data migration function (example)
export function migrateDataIfNeeded(): void {
  // Check for old data format
  const oldDataVersion = getLocalStorage("dataVersion", null)

  if (oldDataVersion === "1.0.0") {
    logger.info("Migrating data from version 1.0.0...")

    // Perform migration steps here
    // ...

    setLocalStorage("dataVersion", "2.0.0")
    logger.success("Data migration complete.")
  }
}

// Data validation and repair function (example)
export function checkAndRepairData(): void {
  // Check data integrity
  if (!validateDataIntegrity()) {
    logger.warn("Data integrity issues detected, attempting repair...")
    repairCorruptedData()
  }
}

// Save specific data category
export function saveData<T>(category: keyof AppData, data: T): void {
  const storageKey = DATA_KEYS[category]
  if (!storageKey) {
    logger.error(`Invalid category: ${category}`)
    return
  }

  try {
    if (category === "plannerData") {
      logger.group(`💾 saveData: plannerData`)
      logger.info(`Saving plannerData...`)

      // Log the data structure
      if (data) {
        const plannerData = data as any
        logger.debug("Data structure check:", {
          hasBlocks: !!plannerData.blocks,
          blocksIsArray: Array.isArray(plannerData.blocks),
          blocksLength: Array.isArray(plannerData.blocks) ? plannerData.blocks.length : "N/A",
          hasSettings: !!plannerData.settings,
          hasStats: !!plannerData.stats,
        })
      } else {
        logger.warn("❌ plannerData is null or undefined")
      }
    }

    // Validate the data structure before saving
    const validatedData = validateDataStructure(category, data)

    if (category === "plannerData") {
      logger.success("✅ Data validated")

      // Compare original and validated data
      if (JSON.stringify(data) !== JSON.stringify(validatedData)) {
        logger.warn("⚠️ Data was modified during validation")
      }
    }

    // Check if data is too large (rough estimate)
    const dataSize = JSON.stringify(validatedData).length * 2 // 2 bytes per character
    if (dataSize > 2 * 1024 * 1024) {
      // 2MB warning threshold
      logger.warn(`Large data detected for ${category}: ~${(dataSize / (1024 * 1024)).toFixed(2)}MB`)
    }

    // Save to localStorage with error handling
    try {
      setLocalStorage(storageKey, validatedData)

      if (category === "plannerData") {
        logger.success("✅ Data saved to localStorage via setLocalStorage")

        // Verify the data was actually saved
        if (typeof window !== "undefined") {
          const savedRawData = window.localStorage.getItem(storageKey)
          if (savedRawData) {
            logger.success(`✅ Verified data was saved (${savedRawData.length} chars)`)

            try {
              const savedData = JSON.parse(savedRawData)
              logger.success("✅ Saved data can be parsed as JSON")

              // Check if the saved data has the expected structure
              if (savedData && typeof savedData === "object") {
                logger.debug("Saved data structure:", {
                  hasBlocks: !!savedData.blocks,
                  blocksIsArray: Array.isArray(savedData.blocks),
                  blocksLength: Array.isArray(savedData.blocks) ? savedData.blocks.length : "N/A",
                  hasSettings: !!savedData.settings,
                  hasStats: !!savedData.stats,
                })
              }
            } catch (parseError) {
              logger.error("❌ Saved data cannot be parsed as JSON:", parseError)
            }
          } else {
            logger.error("❌ Failed to verify data was saved - not found in localStorage after save")
          }
        }
      }

      // Emit events for data updates
      eventBus.publish(`data:${category}:updated`, validatedData)
      eventBus.publish("data:updated", { collection: category })

      if (category === "plannerData") {
        logger.info("📢 Published data update events")
      }
    } catch (storageError) {
      logger.error(`❌ Storage error saving data for ${category}:`, storageError)

      // Try to optimize storage and retry
      optimizeLocalStorage()
      try {
        setLocalStorage(storageKey, validatedData, true) // Force immediate save

        if (category === "plannerData") {
          logger.success("✅ Data saved after storage optimization")
        }

        // Still emit events
        eventBus.publish(`data:${category}:updated`, validatedData)
        eventBus.publish("data:updated", { collection: category })

        if (category === "plannerData") {
          logger.info("📢 Published data update events after retry")
        }
      } catch (retryError) {
        logger.error(`❌ Failed to save data for ${category} even after optimization:`, retryError)
        throw retryError // Re-throw for the outer catch
      }
    }

    if (category === "plannerData") {
      logger.groupEnd()
    }
  } catch (error) {
    logger.error(`❌ Error saving data for ${category}:`, error)
    if (category === "plannerData") {
      logger.groupEnd()
    }
  }
}

// Get specific data category
export function getData<T>(category: keyof AppData, defaultValue: T): T {
  const storageKey = DATA_KEYS[category]
  if (!storageKey) {
    logger.error(`Invalid category: ${category}`)
    return defaultValue
  }

  try {
    if (category === "plannerData") {
      logger.group(`🔍 getData: plannerData`)
      logger.info(`Retrieving plannerData...`)
    }

    // Get data from localStorage
    const data = getLocalStorage<T>(storageKey, defaultValue)

    if (category === "plannerData") {
      logger.success("✅ Retrieved data from localStorage")

      // Log the data structure
      if (data) {
        const plannerData = data as any
        logger.debug("Data structure check:", {
          hasBlocks: !!plannerData.blocks,
          blocksIsArray: Array.isArray(plannerData.blocks),
          blocksLength: Array.isArray(plannerData.blocks) ? plannerData.blocks.length : "N/A",
          hasSettings: !!plannerData.settings,
          hasStats: !!plannerData.stats,
        })
      } else {
        logger.warn("⚠️ Retrieved data is null or undefined, using default value")
      }
    }

    // Validate the data structure
    const validatedData = validateDataStructure(category, data)

    if (category === "plannerData") {
      logger.success("✅ Data validated")

      // Compare original and validated data
      if (JSON.stringify(data) !== JSON.stringify(validatedData)) {
        logger.warn("⚠️ Data was modified during validation")
      }
    }

    // If validation made changes, save the repaired data
    if (JSON.stringify(data) !== JSON.stringify(validatedData)) {
      if (category === "plannerData") {
        logger.warn(`⚠️ Data validation repaired ${category} data, saving fixed version`)
      }

      // Save the repaired data in the background
      setTimeout(() => {
        try {
          setLocalStorage(storageKey, validatedData)
          if (category === "plannerData") {
            logger.success(`✅ Repaired ${category} data saved`)
          }
        } catch (saveError) {
          logger.error(`❌ Error saving repaired ${category} data:`, saveError)
        }
      }, 0)
    }

    if (category === "plannerData") {
      logger.groupEnd()
    }

    return validatedData
  } catch (error) {
    logger.error(`❌ Error getting data for ${category}:`, error)
    if (category === "plannerData") {
      logger.groupEnd()
    }
    return defaultValue
  }
}

// Get specific setting
export function getSetting<T>(setting: string, defaultValue: T): T {
  const storageKey = SETTINGS_KEYS[setting]
  return storageKey ? getLocalStorage<T>(storageKey, defaultValue) : defaultValue
}

// Save specific setting
export function saveSetting<T>(setting: string, value: T): void {
  const storageKey = SETTINGS_KEYS[setting]
  if (storageKey) {
    setLocalStorage(storageKey, value)
  }
}

// Add this function to check and fix the plannerData structure
export function fixPlannerDataStructure(): void {
  try {
    logger.group("🔧 fixPlannerDataStructure")
    logger.info("Checking plannerData structure...")

    // Get the raw data from localStorage
    if (typeof window === "undefined") {
      logger.info("Window is undefined, skipping")
      logger.groupEnd()
      return
    }

    const rawData = window.localStorage.getItem("plannerData")

    if (!rawData) {
      logger.info("No plannerData found in localStorage")

      // Initialize with default data
      const defaultData = {
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

      try {
        const dataString = JSON.stringify(defaultData)
        logger.info(`Initializing plannerData with default structure (${dataString.length} chars)`)
        window.localStorage.setItem("plannerData", dataString)
        logger.success("✅ Initialized plannerData with default structure")

        // Publish event to notify components
        if (typeof eventBus !== "undefined") {
          logger.info("📢 Publishing plannerData update events")
          eventBus.publish("data:plannerData:updated", defaultData)
          eventBus.publish("data:updated", { collection: "plannerData" })
        }
      } catch (initError) {
        logger.error("❌ Error initializing plannerData:", initError)
      }

      logger.groupEnd()
      return
    }

    logger.info(`Raw plannerData found (${rawData.length} chars)`)
    logger.info(`First 100 chars: ${rawData.substring(0, 100)}...`)

    try {
      // Try to parse the data
      let parsedData
      try {
        parsedData = JSON.parse(rawData)
        logger.success("✅ Successfully parsed plannerData JSON")
        logger.debug("Data structure:", {
          type: typeof parsedData,
          isArray: Array.isArray(parsedData),
          hasBlocks: parsedData && parsedData.blocks !== undefined,
          hasSettings: parsedData && parsedData.settings !== undefined,
          hasStats: parsedData && parsedData.stats !== undefined,
        })
      } catch (parseError) {
        logger.error("❌ Error parsing plannerData, attempting to repair:", parseError)

        // Try to clean the JSON string
        try {
          const cleanedData = cleanJsonString(rawData)
          parsedData = JSON.parse(cleanedData)
          logger.success("✅ Successfully parsed plannerData after cleaning")
        } catch (cleanError) {
          logger.error("❌ Failed to repair JSON, resetting to default:", cleanError)

          // If we can't parse it, reset to default
          parsedData = {
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
      }

      let needsUpdate = false

      // Check if it's incorrectly stored as an array
      if (Array.isArray(parsedData)) {
        logger.error("plannerData is incorrectly stored as an array, fixing structure...")

        // Create a proper structure with the array as the blocks property
        const blocks = [...parsedData] // Save the array
        parsedData = {
          blocks: blocks,
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

        needsUpdate = true
      } else if (typeof parsedData !== "object" || parsedData === null) {
        // If it's not an object at all, reset it
        logger.error("plannerData is not a valid object, resetting to default structure...")

        parsedData = {
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

        needsUpdate = true
      } else {
        // Make sure blocks is an array
        if (!Array.isArray(parsedData.blocks)) {
          logger.error("plannerData.blocks is not an array, fixing...")
          parsedData.blocks = []
          needsUpdate = true
        }

        // Make sure settings and stats exist
        if (!parsedData.settings || typeof parsedData.settings !== "object") {
          logger.error("plannerData.settings is missing or invalid, fixing...")
          parsedData.settings = {
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
          needsUpdate = true
        }

        if (!parsedData.stats || typeof parsedData.stats !== "object") {
          logger.error("plannerData.stats is missing or invalid, fixing...")
          parsedData.stats = {
            totalTimeBlocked: 0,
            completedBlocks: 0,
            streak: 0,
            lastActiveDate: null,
          }
          needsUpdate = true
        }
      }

      // Save the fixed structure if needed
      if (needsUpdate) {
        try {
          const dataString = JSON.stringify(parsedData)
          logger.info(`Saving fixed plannerData structure (${dataString.length} chars)`)
          window.localStorage.setItem("plannerData", dataString)
          logger.success("✅ plannerData structure fixed successfully")

          // Publish event to notify components
          if (typeof eventBus !== "undefined") {
            logger.info("📢 Publishing plannerData update events after fix")
            eventBus.publish("data:plannerData:updated", parsedData)
            eventBus.publish("data:updated", { collection: "plannerData" })
          }
        } catch (updateError) {
          logger.error("❌ Error saving fixed plannerData:", updateError)
        }
      } else {
        logger.success("✅ plannerData structure is valid, no fixes needed")
      }
    } catch (error) {
      logger.error("❌ Error fixing plannerData structure:", error)
    }
    logger.groupEnd()
  } catch (error) {
    logger.error("❌ Error in fixPlannerDataStructure:", error)
    logger.groupEnd()
  }
}

// Add this helper function to clean JSON strings
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
    logger.error("Error cleaning JSON string:", error)
    throw error
  }
}

// Update the performDataMaintenance function to include the fix
export function performDataMaintenance(): void {
  try {
    logger.info("Performing data maintenance...")

    // Fix plannerData structure first
    fixPlannerDataStructure()

    // Check data integrity
    const isValid = validateDataIntegrity()

    if (!isValid) {
      logger.warn("Data integrity issues detected, attempting repair...")
      repairCorruptedData()
    }

    // Optimize storage
    const { percentage } = getLocalStorageUsage()
    if (percentage > 70) {
      logger.info(`LocalStorage usage is at ${percentage.toFixed(1)}%, optimizing...`)
      optimizeLocalStorage()
    }

    // Validate specific data structures
    const plannerData = getData<any>("plannerData", null)
    if (plannerData) {
      const validatedData = validateDataStructure("plannerData", plannerData)

      // If validation made changes, save the repaired data
      if (JSON.stringify(plannerData) !== JSON.stringify(validatedData)) {
        logger.info("Data validation repaired planner data, saving fixed version")
        saveData("plannerData", validatedData)
      }
    }

    logger.success("Data maintenance completed")
  } catch (error) {
    logger.error("Error during data maintenance:", error)
  }
}
