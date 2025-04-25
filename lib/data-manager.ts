import {
  getLocalStorage,
  setLocalStorage,
  batchSetLocalStorage,
  optimizeLocalStorage,
  removeLocalStorage,
  isLocalStorageAvailable,
} from "./local-storage"

// Add the import for eventBus at the top of the file
import { eventBus } from "./event-bus"

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
  billingData?: any
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

// Save specific data category
export function saveData<T>(category: keyof AppData, data: T): void {
  const storageKey = DATA_KEYS[category]
  if (storageKey) {
    setLocalStorage(storageKey, data)
    // Emit an event that data has been updated
    eventBus.publish(`data:${category}:updated`, data)
    eventBus.publish("data:updated", { collection: category })
  }
}

// Get specific data category
export function getData<T>(category: keyof AppData, defaultValue: T): T {
  const storageKey = DATA_KEYS[category]
  return storageKey ? getLocalStorage<T>(storageKey, defaultValue) : defaultValue
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

// Add a new function to validate data integrity:
export function validateDataIntegrity(): boolean {
  let isValid = true

  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    console.error("LocalStorage is not available")
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
      console.error(`Data integrity issue with ${key}:`, error)
      isValid = false
    }
  })

  return isValid
}

// Add a function to repair corrupted data:
export function repairCorruptedData(): void {
  Object.entries(DATA_KEYS).forEach(([key, storageKey]) => {
    try {
      getLocalStorage(storageKey, null)
    } catch (error) {
      console.warn(`Repairing corrupted data for ${key}`)
      removeLocalStorage(storageKey)
    }
  })
}

// Add a function to force immediate write of all pending data
export function forceSaveAllData(data?: AppData): void {
  const dataToSave = data || loadAllData()
  const updates: Record<string, any> = {}

  // Prepare updates for each data category
  Object.entries(DATA_KEYS).forEach(([key, storageKey]) => {
    const value = dataToSave[key as keyof AppData]
    if (value !== undefined) {
      updates[storageKey] = value
    }
  })

  // Batch save all updates immediately
  batchSetLocalStorage(updates, true)
  console.log("Forced save of all data completed")

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
    console.log("Migrating data from version 1.0.0...")

    // Perform migration steps here
    // ...

    setLocalStorage("dataVersion", "2.0.0")
    console.log("Data migration complete.")
  }
}

// Data validation and repair function (example)
export function checkAndRepairData(): void {
  // Check data integrity
  if (!validateDataIntegrity()) {
    console.warn("Data integrity issues detected, attempting repair...")
    repairCorruptedData()
  }
}
