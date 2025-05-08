"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Flame,
  MoreHorizontal,
  Plus,
  Settings,
  Trash,
  X,
  Check,
  ChevronDown,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorage, setLocalStorage, flushLocalStorageWrites } from "@/lib/local-storage"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { eventBus } from "@/lib/event-bus"
import { fixPlannerDataStructure, validateBlock } from "@/lib/data-manager"
// Add import for the diagnostic utility at the top of the file
import { runPlannerDataDiagnostic, exposeDebugFunctions } from "@/lib/planner-data-diagnostic"
// Add import for the integrity check component at the top of the file
import { PlannerDataIntegrityCheck } from "@/components/planner-data-integrity-check"
// Add the import at the top with other imports
import { setupCalendarDataProtection } from "@/lib/calendar-data-protection"

// Add this at the top of the file, after the imports
const DEBUG = process.env.NODE_ENV === "development"

// Create a structured logger helper
const logger = {
  info: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.info(`%c📅 INFO: ${message}`, "color: #3b82f6; font-weight: bold;", ...data)
  },
  success: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.log(`%c✅ SUCCESS: ${message}`, "color: #10b981; font-weight: bold;", ...data)
  },
  warn: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.warn(`%c⚠️ WARNING: ${message}`, "color: #f59e0b; font-weight: bold;", ...data)
  },
  error: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.error(`%c❌ ERROR: ${message}`, "color: #ef4444; font-weight: bold;", ...data)
  },
  group: (name: string) => {
    if (!DEBUG) return
    console.group(`%c📋 ${name}`, "color: #8b5cf6; font-weight: bold;")
  },
  groupEnd: () => {
    if (!DEBUG) return
    console.groupEnd()
  },
  debug: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.debug(`%c🔍 DEBUG: ${message}`, "color: #6b7280; font-weight: bold;", ...data)
  },
  table: (data: any, message?: string) => {
    if (!DEBUG) return
    if (message) {
      console.log(`%c📊 ${message}:`, "color: #8b5cf6; font-weight: bold;")
    }
    console.table(data)
  },
}

// Types
interface TimeBlock {
  id: string
  title: string
  description: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  date: string // YYYY-MM-DD format
  color: string
  category: string
  isRecurring: boolean
  recurringPattern?: "daily" | "weekly" | "monthly" | "weekdays" | "weekends"
  completed: boolean
}

interface Category {
  id: string
  name: string
  color: string
}

interface Template {
  id: string
  name: string
  blocks: Omit<TimeBlock, "id" | "date" | "completed">[]
}

interface PlannerSettings {
  dayStartHour: number // 0-23
  dayEndHour: number // 0-23
  timeSlotHeight: number // in pixels
  defaultBlockDuration: number // in minutes
  categories: Category[]
  templates: Template[]
  showCompletedBlocks: boolean
}

interface PlannerData {
  blocks: TimeBlock[]
  settings: PlannerSettings
  stats: {
    totalTimeBlocked: number // in minutes
    completedBlocks: number
    streak: number
    lastActiveDate: string | null
  }
}

// Default data
const defaultCategories: Category[] = [
  { id: "work", name: "Work", color: "bg-blue-500" },
  { id: "personal", name: "Personal", color: "bg-green-500" },
  { id: "health", name: "Health & Fitness", color: "bg-red-500" },
  { id: "learning", name: "Learning", color: "bg-purple-500" },
  { id: "social", name: "Social", color: "bg-yellow-500" },
  { id: "other", name: "Other", color: "bg-gray-500" },
]

const defaultTemplates: Template[] = [
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
      {
        title: "Email & Communication",
        description: "Check emails and messages",
        startTime: "10:00",
        endTime: "10:30",
        color: "bg-blue-500",
        category: "work",
        isRecurring: true,
        recurringPattern: "weekdays",
      },
      {
        title: "Lunch Break",
        description: "Healthy lunch and short walk",
        startTime: "12:00",
        endTime: "13:00",
        color: "bg-green-500",
        category: "personal",
        isRecurring: true,
        recurringPattern: "weekdays",
      },
      {
        title: "Learning Session",
        description: "Read or take an online course",
        startTime: "17:00",
        endTime: "18:00",
        color: "bg-purple-500",
        category: "learning",
        isRecurring: true,
        recurringPattern: "weekdays",
      },
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
      {
        title: "Hobby Time",
        description: "Work on personal project or hobby",
        startTime: "10:00",
        endTime: "12:00",
        color: "bg-green-500",
        category: "personal",
        isRecurring: true,
        recurringPattern: "weekends",
      },
      {
        title: "Social Activity",
        description: "Meet friends or family",
        startTime: "15:00",
        endTime: "18:00",
        color: "bg-yellow-500",
        category: "social",
        isRecurring: true,
        recurringPattern: "weekends",
      },
    ],
  },
]

const initialPlannerData: PlannerData = {
  blocks: [],
  settings: {
    dayStartHour: 6, // 6 AM
    dayEndHour: 22, // 10 PM
    timeSlotHeight: 80,
    defaultBlockDuration: 60, // 1 hour
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

// Validate and repair planner data structure
const validatePlannerData = (data: PlannerData): PlannerData => {
  try {
    // Create a deep copy to avoid mutating the original
    const validatedData = JSON.parse(JSON.stringify(data))

    // Ensure blocks array exists and is valid
    if (!Array.isArray(validatedData.blocks)) {
      logger.warn("Blocks array was invalid, resetting to empty array")
      validatedData.blocks = []
    } else {
      // Validate each block
      validatedData.blocks = validatedData.blocks
        .filter((block) => {
          // Filter out invalid blocks
          if (!block || typeof block !== "object") {
            logger.warn("Removed invalid block from planner data")
            return false
          }
          return true
        })
        .map((block) => {
          // Ensure all required block properties exist
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
            recurringPattern: block.recurringPattern,
            completed: !!block.completed,
          }
        })
    }

    // Ensure settings object exists
    if (!validatedData.settings || typeof validatedData.settings !== "object") {
      logger.warn("Settings object was invalid, resetting to defaults")
      validatedData.settings = { ...initialPlannerData.settings }
    } else {
      // Ensure all settings properties exist with valid values
      validatedData.settings = {
        ...initialPlannerData.settings,
        ...validatedData.settings,
        // Ensure numeric values are valid
        dayStartHour: Number.isInteger(validatedData.settings.dayStartHour)
          ? Math.min(Math.max(validatedData.settings.dayStartHour, 0), 23)
          : initialPlannerData.settings.dayStartHour,
        dayEndHour: Number.isInteger(validatedData.settings.dayEndHour)
          ? Math.min(Math.max(validatedData.settings.dayEndHour, 0), 23)
          : initialPlannerData.settings.dayEndHour,
        timeSlotHeight: Number.isInteger(validatedData.settings.timeSlotHeight)
          ? Math.min(Math.max(validatedData.settings.timeSlotHeight, 40), 200)
          : initialPlannerData.settings.timeSlotHeight,
        defaultBlockDuration: Number.isInteger(validatedData.settings.defaultBlockDuration)
          ? Math.min(Math.max(validatedData.settings.defaultBlockDuration, 5), 240)
          : initialPlannerData.settings.defaultBlockDuration,
      }

      // Ensure categories array exists and is valid
      if (!Array.isArray(validatedData.settings.categories)) {
        validatedData.settings.categories = [...defaultCategories]
      }

      // Ensure templates array exists and is valid
      if (!Array.isArray(validatedData.settings.templates)) {
        validatedData.settings.templates = [...defaultTemplates]
      }
    }

    // Ensure stats object exists
    if (!validatedData.stats || typeof validatedData.stats !== "object") {
      logger.warn("Stats object was invalid, resetting to defaults")
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

    return validatedData
  } catch (error) {
    logger.error("Error validating planner data, returning defaults:", error)
    return { ...initialPlannerData }
  }
}

// Helper functions
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
}

function formatDateForDisplay(dateString: string): string {
  try {
    // Check if the date string is valid
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      logger.warn(`Invalid date string: ${dateString}`)
      return "Invalid date"
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  } catch (error) {
    logger.error(`Error formatting date: ${dateString}`, error)
    return "Invalid date"
  }
}

function validateDateFormat(dateString: string): string | null {
  // Empty string is considered invalid
  if (!dateString.trim()) {
    return "Date is required"
  }

  // First try to parse as ISO format (YYYY-MM-DD)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/
  if (isoRegex.test(dateString)) {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return null // Valid ISO date
    }
  }

  // Check if the string matches the DD/MM/YYYY pattern exactly
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = dateString.match(regex)

  if (!match) {
    return "Date must be in DD/MM/YYYY or YYYY-MM-DD format"
  }

  const day = Number.parseInt(match[1], 10)
  const month = Number.parseInt(match[2], 10) - 1 // Months are 0-indexed in JS Date
  const year = Number.parseInt(match[3], 10)

  // Validate ranges
  if (month < 0 || month > 11) {
    return "Month must be between 01 and 12"
  }

  if (day < 1) {
    return "Day must be at least 1"
  }

  // Check days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  if (day > daysInMonth) {
    return `Day must be between 1 and ${daysInMonth} for the selected month`
  }

  // Validate year
  if (year < 1000 || year > 9999) {
    return "Year must be a 4-digit number"
  }

  return null
}

function parseDate(dateString: string): Date | null {
  // Try ISO format first (YYYY-MM-DD)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/
  if (isoRegex.test(dateString)) {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // Try DD/MM/YYYY format
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = dateString.match(regex)
  if (match) {
    const day = Number.parseInt(match[1], 10)
    const month = Number.parseInt(match[2], 10) - 1 // Months are 0-indexed in JS Date
    const year = Number.parseInt(match[3], 10)

    const date = new Date(year, month, day)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  return null
}

const getTimeBlocksForDate = (blocks: TimeBlock[], date: string): TimeBlock[] => {
  return blocks.filter((block) => block.date === date)
}

const calculateBlockHeight = (
  startTime: string,
  endTime: string,
  timeSlotHeight: number,
  dayStartHour: number,
  dayEndHour: number,
): { height: number; top: number } => {
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  const dayStartMinutes = dayStartHour * 60
  const dayEndMinutes = dayEndHour * 60

  // Clamp start time to day start/end bounds
  const startMinutes = Math.max(dayStartMinutes, Math.min(dayEndMinutes, startHour * 60 + startMinute))

  // Clamp end time to day start/end bounds
  const endMinutes = Math.max(dayStartMinutes, Math.min(dayEndMinutes, endHour * 60 + endMinute))

  const durationMinutes = endMinutes - startMinutes
  const minutesFromDayStart = startMinutes - dayStartMinutes

  const height = (durationMinutes / 60) * timeSlotHeight
  const top = (minutesFromDayStart / 60) * timeSlotHeight

  return { height, top }
}

const calculateBlockDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute

  return endMinutes - startMinutes
}

const generateTimeSlots = (startHour: number, endHour: number): string[] => {
  const slots = []
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`)
  }
  return slots
}

const getNextDay = (date: string): string => {
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)
  return nextDay.toISOString().split("T")[0]
}

const getPreviousDay = (date: string): string => {
  const prevDay = new Date(date)
  prevDay.setDate(prevDay.getDate() - 1)
  return prevDay.toISOString().split("T")[0]
}

const getDaysOfWeek = (date: string): string[] => {
  const currentDate = new Date(date)
  const day = currentDate.getDay() // 0 = Sunday, 6 = Saturday
  const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1) // Adjust to get Monday

  const monday = new Date(currentDate)
  monday.setDate(diff)

  const days = []
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday)
    nextDay.setDate(monday.getDate() + i)
    days.push(nextDay.toISOString().split("T")[0])
  }

  return days
}

export default function DailyPlannerPage() {
  // Define state first
  const [plannerData, setPlannerData] = useState<PlannerData>(initialPlannerData)
  const { toast } = useToast()
  const dataLoaded = useRef(false)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)

  // Fix plannerData structure if needed
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        fixPlannerDataStructure()
      } catch (error) {
        logger.error("Error fixing planner data structure:", error)
      }
    }
  }, [])

  // Load data from local storage
  useEffect(() => {
    try {
      // Expose debug functions for browser console
      exposeDebugFunctions()

      // Run diagnostic on load to catch and fix issues
      logger.info("Running planner data diagnostic on load")
      const diagnosticResult = runPlannerDataDiagnostic()

      if (diagnosticResult.issues.length > 0) {
        logger.warn(`Found ${diagnosticResult.issues.length} issues with planner data:`, diagnosticResult.issues)
      }

      if (diagnosticResult.fixed.length > 0) {
        logger.info(`Fixed ${diagnosticResult.fixed.length} issues with planner data:`, diagnosticResult.fixed)
      }

      // Only load data once to prevent overwriting changes
      if (!dataLoaded.current) {
        logger.group("📅 Calendar: Loading planner data")
        logger.info("Loading planner data from localStorage...")
        let savedData

        try {
          // First try to get the data directly from localStorage
          if (typeof window !== "undefined") {
            const rawData = window.localStorage.getItem("plannerData")
            if (rawData) {
              logger.info(`Raw plannerData found (${rawData.length} chars)`)
              logger.debug(`Raw data first 100 chars: ${rawData.substring(0, 100)}...`)

              try {
                savedData = JSON.parse(rawData)
                logger.success("✅ Successfully parsed plannerData from localStorage")

                // Log the blocks count for debugging
                if (savedData && Array.isArray(savedData.blocks)) {
                  logger.info(`Found ${savedData.blocks.length} blocks in localStorage`)

                  // Log the first block for debugging
                  if (savedData.blocks.length > 0) {
                    logger.debug("First block:", savedData.blocks[0])
                  }
                } else {
                  logger.warn("No blocks array found in plannerData or it's empty")
                }
              } catch (parseError) {
                logger.error("❌ Error parsing plannerData from localStorage:", parseError)
                // Fall back to the helper function
                savedData = getLocalStorage<PlannerData>("plannerData", initialPlannerData)
              }
            } else {
              logger.info("No plannerData found in localStorage, using default")
              savedData = initialPlannerData

              // Save the default data
              window.localStorage.setItem("plannerData", JSON.stringify(initialPlannerData))
            }
          } else {
            logger.info("Window is undefined, using initialPlannerData")
            savedData = initialPlannerData
          }
        } catch (storageError) {
          logger.error("❌ Error accessing localStorage:", storageError)
          savedData = initialPlannerData
        }

        // Ensure savedData is not null or undefined
        if (!savedData) {
          logger.warn("⚠️ savedData is null or undefined, using initialPlannerData")
          savedData = { ...initialPlannerData }
        }

        // Ensure blocks array exists
        if (!savedData.blocks || !Array.isArray(savedData.blocks)) {
          logger.warn("⚠️ savedData.blocks is not an array, initializing empty array")
          savedData.blocks = []
        }

        // Validate and repair the data before using it
        logger.info("Validating plannerData structure...")
        const validatedData = validatePlannerData(savedData)

        // If validation made changes, save the repaired data
        if (JSON.stringify(savedData) !== JSON.stringify(validatedData)) {
          logger.warn("⚠️ Data validation repaired planner data, saving fixed version")
          try {
            if (typeof window !== "undefined") {
              window.localStorage.setItem("plannerData", JSON.stringify(validatedData))
            }
            setLocalStorage("plannerData", validatedData, true)
            logger.success("✅ Saved repaired planner data to localStorage")
          } catch (saveError) {
            logger.error("❌ Error saving repaired planner data:", saveError)
          }
        }

        logger.info("Setting planner data state with validated data")
        logger.debug("Blocks count before setting state:", validatedData.blocks ? validatedData.blocks.length : 0)
        setPlannerData(validatedData)
        dataLoaded.current = true
        logger.success("✅ Data loaded successfully")

        // Update streak if needed
        updateStreak(validatedData)
        logger.groupEnd()
      }
    } catch (error) {
      logger.error("❌ Error loading planner data:", error)
      // Fall back to initial data if there's an error
      setPlannerData({ ...initialPlannerData })
      toast({
        title: "Data Loading Error",
        description: "Could not load your planner data. Using default settings.",
        variant: "destructive",
      })
      logger.groupEnd()
    }

    // Set up calendar data protection
    if (typeof window !== "undefined") {
      setupCalendarDataProtection()
    }
  }, [toast])

  // Subscribe to data updates
  useEffect(() => {
    // Subscribe to data updates
    const unsubscribe1 = eventBus.subscribe("data:plannerData:updated", (updatedData) => {
      logger.info("Calendar data updated via event, refreshing from event data")
      if (updatedData && !Array.isArray(updatedData) && updatedData.blocks) {
        setPlannerData(updatedData as PlannerData)
      } else {
        logger.info("Calendar data updated, refreshing from localStorage")
        const savedData = getLocalStorage<PlannerData>("plannerData", initialPlannerData)
        setPlannerData(savedData)
      }
    })

    // Also subscribe to general data updates
    const unsubscribe2 = eventBus.subscribe("data:updated", (updateInfo) => {
      if (updateInfo?.collection === "plannerData" || updateInfo?.collection === "calendar") {
        logger.info("Calendar data updated via general event, refreshing from localStorage")
        const savedData = getLocalStorage<PlannerData>("plannerData", initialPlannerData)
        setPlannerData(savedData)
      }
    })

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }, [])

  // Save data before unloading the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force immediate save of any pending data
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current)
        saveTimeout.current = null
      }
      setLocalStorage("plannerData", plannerData, true)
      flushLocalStorageWrites()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeUnload", handleBeforeUnload)
      // Also save when component unmounts
      handleBeforeUnload()
    }
  }, [plannerData])

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [selectedView, setSelectedView] = useState<"day" | "week">("day")
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [isAddingBlock, setIsAddingBlock] = useState(false)
  const [newBlock, setNewBlock] = useState<Omit<TimeBlock, "id" | "completed">>({
    title: "",
    description: "",
    startTime: "09:00",
    endTime: "10:00",
    date: selectedDate,
    color: "bg-blue-500",
    category: "work",
    isRecurring: false,
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [newCategory, setNewCategory] = useState<Omit<Category, "id">>({
    name: "",
    color: "bg-blue-500",
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")

  // Update streak when date changes
  useEffect(() => {
    updateStreak(plannerData)
  }, [selectedDate])

  // Save data to local storage with debounce
  const savePlannerData = useCallback(
    (data: PlannerData) => {
      try {
        logger.group("💾 Calendar: Saving planner data")

        // Make a deep copy to avoid reference issues
        logger.info("Creating deep copy of data")
        const dataCopy = JSON.parse(JSON.stringify(data))

        // Log the data structure
        logger.debug("Data structure check:", {
          hasBlocks: !!dataCopy.blocks,
          blocksIsArray: Array.isArray(dataCopy.blocks),
          blocksLength: Array.isArray(dataCopy.blocks) ? dataCopy.blocks.length : "N/A",
          hasSettings: !!dataCopy.settings,
          hasStats: !!dataCopy.stats,
        })

        // Validate the data before saving
        logger.info("Validating data...")
        const validatedData = validatePlannerData(dataCopy)

        // Update state with validated data
        logger.info("Updating state with validated data")
        setPlannerData(validatedData)

        // Clear any existing timeout
        if (saveTimeout.current) {
          logger.info("Clearing existing save timeout")
          clearTimeout(saveTimeout.current)
        }

        // Set a new timeout to save the data
        logger.info("Setting new save timeout")
        saveTimeout.current = setTimeout(() => {
          try {
            logger.info("Save timeout triggered, saving data to localStorage...")

            // Force immediate save to localStorage
            if (typeof window !== "undefined") {
              try {
                const dataString = JSON.stringify(validatedData)
                logger.info(`Saving data directly to localStorage (${dataString.length} chars)`)
                window.localStorage.setItem("plannerData", dataString)
                logger.success("✅ Successfully saved planner data directly to localStorage")

                // Verify the data was actually saved
                const savedData = window.localStorage.getItem("plannerData")
                if (savedData) {
                  logger.success(`✅ Verified data was saved (${savedData.length} chars)`)

                  // Also save using the helper function as a backup
                  setLocalStorage("plannerData", validatedData, true)

                  // Notify other components about the data change
                  eventBus.publish("data:plannerData:updated", validatedData)
                  eventBus.publish("data:updated", { collection: "plannerData" })
                } else {
                  logger.error("❌ Failed to verify data was saved - not found in localStorage after save")
                  // Fall back to helper function
                  setLocalStorage("plannerData", validatedData, true)
                  eventBus.publish("data:plannerData:updated", validatedData)
                  eventBus.publish("data:updated", { collection: "plannerData" })
                }
              } catch (directSaveError) {
                logger.error("❌ Error saving directly to localStorage:", directSaveError)
                // Fall back to the helper function
                setLocalStorage("plannerData", validatedData, true)
                eventBus.publish("data:plannerData:updated", validatedData)
                eventBus.publish("data:updated", { collection: "plannerData" })
              }
            } else {
              setLocalStorage("plannerData", validatedData, true)
              eventBus.publish("data:plannerData:updated", validatedData)
              eventBus.publish("data:updated", { collection: "plannerData" })
            }

            // Ensure all writes are processed
            flushLocalStorageWrites()

            logger.success("✅ Planner data saved successfully")
            logger.groupEnd()
          } catch (storageError) {
            logger.error("❌ Failed to save planner data to localStorage:", storageError)
            toast({
              title: "Storage Error",
              description: "Failed to save your changes. Please try again.",
              variant: "destructive",
            })
            logger.groupEnd()
          }
        }, 50) // Reduce debounce to 50ms for quicker saves

        logger.info("Save timeout set")
        logger.groupEnd()
      } catch (error) {
        logger.error("❌ Error in savePlannerData:", error)
        toast({
          title: "Error Saving Data",
          description: "An unexpected error occurred while saving your data.",
          variant: "destructive",
        })
        logger.groupEnd()
      }
    },
    [toast],
  )

  // Add a function to manually save all data when needed

  // Add this function after the savePlannerData function:
  const forceSavePlannerData = useCallback(() => {
    try {
      logger.group("🔄 Calendar: Force saving planner data")

      // Make a deep copy to avoid reference issues
      const dataCopy = JSON.parse(JSON.stringify(plannerData))

      // Validate the data
      const validatedData = validatePlannerData(dataCopy)

      // Direct save to localStorage
      if (typeof window !== "undefined") {
        try {
          const dataString = JSON.stringify(validatedData)
          window.localStorage.setItem("plannerData", dataString)
          logger.success("✅ Force saved planner data directly to localStorage")

          // Verify the save
          const savedData = window.localStorage.getItem("plannerData")
          if (savedData) {
            logger.success(`✅ Verified force save was successful (${savedData.length} chars)`)
          } else {
            logger.error("❌ Failed to verify force save")
          }
        } catch (error) {
          logger.error("❌ Error with direct force save:", error)
        }
      }

      // Also use the helper function
      setLocalStorage("plannerData", validatedData, true)
      flushLocalStorageWrites()

      // Notify other components
      eventBus.publish("data:plannerData:updated", validatedData)
      eventBus.publish("data:updated", { collection: "plannerData" })

      logger.success("✅ Force save completed")
      logger.groupEnd()
      // Notify other components
      eventBus.publish("data:plannerData:updated", validatedData)
      eventBus.publish("data:updated", { collection: "plannerData" })

      logger.success("✅ Force save completed")
      logger.groupEnd()
    } catch (error) {
      logger.error("❌ Error in forceSavePlannerData:", error)
      logger.groupEnd()
    }
  }, [plannerData])

  // Add this function after the forceSavePlannerData function
  const debugPlannerData = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        const rawData = window.localStorage.getItem("plannerData")
        if (rawData) {
          try {
            const parsedData = JSON.parse(rawData)
            console.log("📊 Current plannerData in localStorage:", parsedData)
            console.log("📊 Blocks count:", parsedData.blocks ? parsedData.blocks.length : 0)
            console.log(
              "📊 First block:",
              parsedData.blocks && parsedData.blocks.length > 0 ? parsedData.blocks[0] : "No blocks",
            )

            // Compare with state
            console.log("📊 Current plannerData in state:", plannerData)
            console.log("📊 State blocks count:", plannerData.blocks ? plannerData.blocks.length : 0)

            return parsedData
          } catch (error) {
            console.error("❌ Error parsing plannerData from localStorage:", error)
          }
        } else {
          console.warn("⚠️ No plannerData found in localStorage")
        }
      }
    } catch (error) {
      console.error("❌ Error in debugPlannerData:", error)
      return null
    }
    return null
  }, [plannerData])

  // Expose debug function to window
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).debugPlannerData = debugPlannerData
      ;(window as any).forceSavePlannerData = forceSavePlannerData
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).debugPlannerData
        delete (window as any).forceSavePlannerData
      }
    }
  }, [debugPlannerData, forceSavePlannerData])

  // Make sure this function is exposed to the global window object so it can be called from the global save button
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).forceSavePlannerData = forceSavePlannerData
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).forceSavePlannerData
      }
    }
  }, [forceSavePlannerData])

  // Add this effect to ensure data is saved when navigating away
  useEffect(() => {
    // Save data when component unmounts or before navigation
    return () => {
      if (plannerData && dataLoaded.current) {
        logger.group("📤 Calendar: Component unmounting")
        logger.info("Calendar component unmounting, saving data...")
        if (saveTimeout.current) {
          logger.info("Clearing pending save timeout")
          clearTimeout(saveTimeout.current)
          saveTimeout.current = null
        }

        try {
          logger.info("Saving data immediately")
          const dataString = JSON.stringify(plannerData)
          logger.info(`Data size: ${dataString.length} chars`)

          // Try direct save first for better control
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem("plannerData", dataString)
              logger.success("✅ Data saved directly to localStorage")

              // Verify the save
              const savedData = window.localStorage.getItem("plannerData")
              if (savedData) {
                logger.success(`✅ Verified data was saved (${savedData.length} chars)`)

                // Check if blocks were saved
                try {
                  const parsedData = JSON.parse(savedData)
                  if (Array.isArray(parsedData.blocks)) {
                    logger.success(`✅ Verified ${parsedData.blocks.length} blocks were saved correctly`)
                  }
                } catch (parseError) {
                  logger.error("❌ Error verifying saved data:", parseError)
                }
              } else {
                logger.error("❌ Failed to verify data was saved")
                // Fall back to helper
                setLocalStorage("plannerData", plannerData, true)
              }
            } catch (directSaveError) {
              logger.error("❌ Error with direct save:", directSaveError)
              // Fall back to helper
              setLocalStorage("plannerData", plannerData, true)
            }
          } else {
            setLocalStorage("plannerData", plannerData, true) // Force immediate save
          }

          logger.success("✅ Data saved via setLocalStorage")

          flushLocalStorageWrites() // Ensure writes are processed
          logger.success("✅ LocalStorage writes flushed")

          // Verify the data was actually saved
          if (typeof window !== "undefined") {
            const savedData = window.localStorage.getItem("plannerData")
            if (savedData) {
              logger.success(`✅ Verified data was saved (${savedData.length} chars)`)
            } else {
              logger.error("❌ Failed to verify data was saved - not found in localStorage after save")
            }
          }
        } catch (error) {
          logger.error("❌ Error saving data on unmount:", error)
        }
        logger.groupEnd()
      }
    }
  }, [plannerData])

  // Modify the addTimeBlock function to show a confirmation and verify the save
  const addTimeBlock = useCallback(() => {
    if (!newBlock.title) {
      toast({
        title: "Title required",
        description: "Please provide a title for your time block.",
        variant: "destructive",
      })
      return
    }

    // Validate times
    const startTime = newBlock.startTime.split(":").map(Number)
    const endTime = newBlock.endTime.split(":").map(Number)
    const startMinutes = startTime[0] * 60 + startTime[1]
    const endMinutes = endTime[0] * 60 + endTime[1]

    if (startMinutes >= endMinutes) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      })
      return
    }

    // Ensure date is in the correct format
    let formattedDate = newBlock.date
    // If date is not in YYYY-MM-DD format, try to convert it
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      try {
        const date = new Date(formattedDate)
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split("T")[0]
        } else {
          toast({
            title: "Invalid date",
            description: "Please provide a valid date.",
            variant: "destructive",
          })
          return
        }
      } catch (error) {
        toast({
          title: "Invalid date",
          description: "Please provide a valid date.",
          variant: "destructive",
        })
        return
      }
    }

    const block: TimeBlock = {
      ...newBlock,
      date: formattedDate, // Use the formatted date
      id: Date.now().toString(),
      completed: false,
    }

    // Run the block through the validateBlock function to ensure all properties are valid
    const validatedBlock = validateBlock(block)

    if (!validatedBlock) {
      toast({
        title: "Invalid block data",
        description: "The time block contains invalid data and cannot be added.",
        variant: "destructive",
      })
      return
    }

    // Continue with the rest of the function using the validated block
    // Handle recurring blocks
    if (validatedBlock.isRecurring && validatedBlock.recurringPattern) {
      const blocksToAdd: TimeBlock[] = [validatedBlock]

      // Add recurring blocks for the next 4 weeks
      const currentDate = new Date(validatedBlock.date)
      const endDate = new Date(currentDate)
      endDate.setDate(endDate.getDate() + 28) // 4 weeks ahead

      const nextDate = new Date(currentDate)
      nextDate.setDate(nextDate.getDate() + 1) // Start from tomorrow

      while (nextDate <= endDate) {
        const dayOfWeek = nextDate.getDay() // 0 = Sunday, 6 = Saturday
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        let shouldAddBlock = false

        switch (validatedBlock.recurringPattern) {
          case "daily":
            shouldAddBlock = true
            break
          case "weekly":
            shouldAddBlock = nextDate.getDay() === currentDate.getDay()
            break
          case "monthly":
            shouldAddBlock = nextDate.getDate() === currentDate.getDate()
            break
          case "weekdays":
            shouldAddBlock = isWeekday
            break
          case "weekends":
            shouldAddBlock = isWeekend
            break
        }

        if (shouldAddBlock) {
          const recurringBlock = {
            ...validatedBlock,
            id: Date.now().toString() + nextDate.getTime(),
            date: nextDate.toISOString().split("T")[0],
          }

          // Validate each recurring block before adding
          const validatedRecurringBlock = validateBlock(recurringBlock)
          if (validatedRecurringBlock) {
            blocksToAdd.push(validatedRecurringBlock)
          } else {
            logger.warn(`Skipped invalid recurring block for date ${nextDate.toISOString().split("T")[0]}`)
          }
        }

        nextDate.setDate(nextDate.getDate() + 1)
      }

      // Filter out any null blocks before adding
      const validBlocksToAdd = blocksToAdd.filter((block) => block !== null)

      // If we have no valid blocks, show an error
      if (validBlocksToAdd.length === 0) {
        toast({
          title: "Invalid recurring blocks",
          description: "Could not create valid recurring blocks. Please check your input.",
          variant: "destructive",
        })
        return
      }

      const updatedBlocks = [...plannerData.blocks, ...validBlocksToAdd]

      // Update total time blocked
      const blockDuration = calculateBlockDuration(validatedBlock.startTime, validatedBlock.endTime)
      const updatedTotalTimeBlocked = plannerData.stats.totalTimeBlocked + blockDuration * validBlocksToAdd.length

      const updatedData = {
        ...plannerData,
        blocks: updatedBlocks,
        stats: {
          ...plannerData.stats,
          totalTimeBlocked: updatedTotalTimeBlocked,
          lastActiveDate: new Date().toISOString().split("T")[0],
        },
      }

      // Update state first
      setPlannerData(updatedData)

      // Force an immediate save to ensure data persistence
      try {
        // Direct save to localStorage for immediate persistence
        if (typeof window !== "undefined") {
          const dataString = JSON.stringify(updatedData)
          window.localStorage.setItem("plannerData", dataString)
          console.log("✅ Direct save of recurring blocks successful", updatedData.blocks.length)
        }

        // Also use the helper function
        setLocalStorage("plannerData", updatedData, true)
        flushLocalStorageWrites()

        // Notify other components
        eventBus.publish("data:plannerData:updated", updatedData)
        eventBus.publish("data:updated", { collection: "plannerData" })

        toast({
          title: "Recurring blocks added",
          description: `Added ${validBlocksToAdd.length} recurring time blocks.`,
        })
      } catch (error) {
        console.error("❌ Error saving recurring blocks:", error)
        toast({
          title: "Error saving blocks",
          description: "There was a problem saving your blocks. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      // Add single block
      const updatedBlocks = [...plannerData.blocks, validatedBlock]

      // Update total time blocked
      const blockDuration = calculateBlockDuration(validatedBlock.startTime, validatedBlock.endTime)
      const updatedTotalTimeBlocked = plannerData.stats.totalTimeBlocked + blockDuration

      const updatedData = {
        ...plannerData,
        blocks: updatedBlocks,
        stats: {
          ...plannerData.stats,
          totalTimeBlocked: updatedTotalTimeBlocked,
          lastActiveDate: new Date().toISOString().split("T")[0],
        },
      }

      // Update state first
      setPlannerData(updatedData)

      // Force an immediate save to ensure data persistence
      try {
        // Direct save to localStorage for immediate persistence
        if (typeof window !== "undefined") {
          const dataString = JSON.stringify(updatedData)
          window.localStorage.setItem("plannerData", dataString)
          console.log("✅ Direct save of single block successful", updatedData.blocks.length)
        }

        // Also use the helper function
        setLocalStorage("plannerData", updatedData, true)
        flushLocalStorageWrites()

        // Notify other components
        eventBus.publish("data:plannerData:updated", updatedData)
        eventBus.publish("data:updated", { collection: "plannerData" })

        toast({
          title: "Block added",
          description: "Your time block has been added to your schedule.",
        })
      } catch (error) {
        console.error("❌ Error saving block:", error)
        toast({
          title: "Error saving block",
          description: "There was a problem saving your block. Please try again.",
          variant: "destructive",
        })
      }
    }

    // Reset form
    setNewBlock({
      title: "",
      description: "",
      startTime: "09:00",
      endTime: "10:00",
      date: selectedDate,
      color: "bg-blue-500",
      category: "work",
      isRecurring: false,
    })

    setIsAddingBlock(false)
  }, [newBlock, plannerData, selectedDate, toast, setLocalStorage, flushLocalStorageWrites, eventBus])

  // Add this effect to ensure data is saved when the user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force immediate save of any pending data
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current)
        saveTimeout.current = null
      }

      if (typeof window !== "undefined" && plannerData) {
        try {
          const dataString = JSON.stringify(plannerData)
          window.localStorage.setItem("plannerData", dataString)
          logger.success("✅ Saved data before unload")

          // Also use the helper function as backup
          setLocalStorage("plannerData", plannerData, true)
          flushLocalStorageWrites()
        } catch (error) {
          console.error("Failed to save data before unload:", error)
          // Try the helper function as fallback
          setLocalStorage("plannerData", plannerData, true)
          flushLocalStorageWrites()
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      // Also save when component unmounts
      handleBeforeUnload()
    }
  }, [plannerData])

  // Update an existing time block
  const updateTimeBlock = useCallback(() => {
    if (!editingBlock) return

    // Validate times
    const startTime = editingBlock.startTime.split(":").map(Number)
    const endTime = editingBlock.endTime.split(":").map(Number)
    const startMinutes = startTime[0] * 60 + startTime[1]
    const endMinutes = endTime[0] * 60 + endTime[1]

    if (startMinutes >= endMinutes) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      })
      return
    }

    // Calculate duration difference for stats update
    const oldBlock = plannerData.blocks.find((b) => b.id === editingBlock.id)
    const oldDuration = oldBlock ? calculateBlockDuration(oldBlock.startTime, oldBlock.endTime) : 0
    const newDuration = calculateBlockDuration(editingBlock.startTime, editingBlock.endTime)
    const durationDifference = newDuration - oldDuration

    const updatedBlocks = plannerData.blocks.map((block) => (block.id === editingBlock.id ? editingBlock : block))

    const updatedData = {
      ...plannerData,
      blocks: updatedBlocks,
      stats: {
        ...plannerData.stats,
        totalTimeBlocked: plannerData.stats.totalTimeBlocked + durationDifference,
        lastActiveDate: new Date().toISOString().split("T")[0],
      },
    }

    savePlannerData(updatedData)
    setEditingBlock(null)

    toast({
      title: "Block updated",
      description: "Your time block has been updated.",
    })
  }, [editingBlock, plannerData, savePlannerData, toast])

  // Delete a time block
  const deleteTimeBlock = useCallback(
    (blockId: string) => {
      const blockToDelete = plannerData.blocks.find((block) => block.id === blockId)
      if (!blockToDelete) return

      // Update total time blocked
      const blockDuration = calculateBlockDuration(blockToDelete.startTime, blockToDelete.endTime)
      const updatedTotalTimeBlocked = plannerData.stats.totalTimeBlocked - blockDuration

      // Update completed blocks count if needed
      const completedBlocksAdjustment = blockToDelete.completed ? -1 : 0

      const updatedBlocks = plannerData.blocks.filter((block) => block.id !== blockId)

      const updatedData = {
        ...plannerData,
        blocks: updatedBlocks,
        stats: {
          ...plannerData.stats,
          totalTimeBlocked: Math.max(0, updatedTotalTimeBlocked),
          completedBlocks: Math.max(0, plannerData.stats.completedBlocks + completedBlocksAdjustment),
          lastActiveDate: new Date().toISOString().split("T")[0],
        },
      }

      savePlannerData(updatedData)

      toast({
        title: "Block deleted",
        description: "Your time block has been deleted.",
      })
    },
    [plannerData, savePlannerData, toast],
  )

  // Toggle block completion status
  const toggleBlockCompletion = useCallback(
    (blockId: string) => {
      const updatedBlocks = plannerData.blocks.map((block) => {
        if (block.id === blockId) {
          return { ...block, completed: !block.completed }
        }
        return block
      })

      const completedBlocksAdjustment = updatedBlocks.find((b) => b.id === blockId)?.completed ? 1 : -1

      const updatedData = {
        ...plannerData,
        blocks: updatedBlocks,
        stats: {
          ...plannerData.stats,
          completedBlocks: Math.max(0, plannerData.stats.completedBlocks + completedBlocksAdjustment),
          lastActiveDate: new Date().toISOString().split("T")[0],
        },
      }

      savePlannerData(updatedData)
    },
    [plannerData, savePlannerData],
  )

  // Add a new category
  const addCategory = useCallback(() => {
    if (!newCategory.name) {
      toast({
        title: "Category name required",
        description: "Please provide a name for the category.",
        variant: "destructive",
      })
      return
    }

    const category: Category = {
      ...newCategory,
      id: Date.now().toString(),
    }

    const updatedCategories = [...plannerData.settings.categories, category]

    const updatedData = {
      ...plannerData,
      settings: {
        ...plannerData.settings,
        categories: updatedCategories,
      },
    }

    savePlannerData(updatedData)

    setNewCategory({
      name: "",
      color: "bg-blue-500",
    })

    toast({
      title: "Category added",
      description: "Your new category has been added.",
    })
  }, [newCategory, plannerData, savePlannerData, toast])

  // Delete a category
  const deleteCategory = useCallback(
    (categoryId: string) => {
      // Don't allow deleting if blocks are using this category
      const blocksUsingCategory = plannerData.blocks.some((block) => block.category === categoryId)

      if (blocksUsingCategory) {
        toast({
          title: "Cannot delete category",
          description: "This category is being used by one or more time blocks.",
          variant: "destructive",
        })
        return
      }

      const updatedCategories = plannerData.settings.categories.filter((category) => category.id !== categoryId)

      const updatedData = {
        ...plannerData,
        settings: {
          ...plannerData.settings,
          categories: updatedCategories,
        },
      }

      savePlannerData(updatedData)

      toast({
        title: "Category deleted",
        description: "The category has been deleted.",
      })
    },
    [plannerData, savePlannerData, toast],
  )

  // Apply a template to the selected date
  const applyTemplate = useCallback(() => {
    if (!selectedTemplate) {
      toast({
        title: "No template selected",
        description: "Please select a template to apply.",
        variant: "destructive",
      })
      return
    }

    const template = plannerData.settings.templates.find((t) => t.id === selectedTemplate)
    if (!template) {
      toast({
        title: "Template not found",
        description: "The selected template could not be found.",
        variant: "destructive",
      })
      return
    }

    const blocksToAdd: TimeBlock[] = template.blocks.map((block) => ({
      ...block,
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      date: selectedDate,
      completed: false,
    }))

    // Calculate total duration of new blocks
    const totalDuration = blocksToAdd.reduce((total, block) => {
      return total + calculateBlockDuration(block.startTime, block.endTime)
    }, 0)

    const updatedData = {
      ...plannerData,
      blocks: [...plannerData.blocks, ...blocksToAdd],
      stats: {
        ...plannerData.stats,
        totalTimeBlocked: plannerData.stats.totalTimeBlocked + totalDuration,
        lastActiveDate: new Date().toISOString().split("T")[0],
      },
    }

    savePlannerData(updatedData)
    setSelectedTemplate("")

    toast({
      title: "Template applied",
      description: `Added ${blocksToAdd.length} blocks to your schedule.`,
    })
  }, [plannerData, savePlannerData, selectedDate, selectedTemplate, toast])

  // Update settings
  const updateSettings = useCallback(
    (settings: PlannerSettings) => {
      const updatedData = {
        ...plannerData,
        settings,
      }

      savePlannerData(updatedData)
      setIsSettingsOpen(false)

      toast({
        title: "Settings updated",
        description: "Your planner settings have been updated.",
      })
    },
    [plannerData, savePlannerData, toast],
  )

  // Calculate productivity score (0-100)
  const calculateProductivityScore = (): number => {
    const blocksToday = plannerData.blocks.filter((block) => block.date === selectedDate)
    if (blocksToday.length === 0) return 0

    const completedBlocks = blocksToday.filter((block) => block.completed)
    return Math.round((completedBlocks.length / blocksToday.length) * 100)
  }

  // Calculate total hours planned for selected date
  const calculateTotalHoursPlanned = (): number => {
    const blocksToday = plannerData.blocks.filter((block) => block.date === selectedDate)

    const totalMinutes = blocksToday.reduce((total, block) => {
      return total + calculateBlockDuration(block.startTime, block.endTime)
    }, 0)

    return Math.round((totalMinutes / 60) * 10) / 10 // Round to 1 decimal place
  }

  const timeSlots = useMemo(
    () => generateTimeSlots(plannerData.settings.dayStartHour, plannerData.settings.dayEndHour),
    [plannerData.settings.dayStartHour, plannerData.settings.dayEndHour],
  )
  const weekDays = useMemo(() => getDaysOfWeek(selectedDate), [selectedDate])
  const blocksForSelectedDate = useMemo(
    () => getTimeBlocksForDate(plannerData.blocks, selectedDate),
    [plannerData.blocks, selectedDate],
  )
  const updateStreak = useCallback(
    (data: PlannerData) => {
      const today = new Date().toISOString().split("T")[0]
      if (data.stats.lastActiveDate === today) {
        return // Already updated today
      }

      if (data.stats.lastActiveDate === getPreviousDay(today)) {
        // Increase streak
        const updatedData = {
          ...data,
          stats: {
            ...data.stats,
            streak: data.stats.streak + 1,
            lastActiveDate: today,
          },
        }
        savePlannerData(updatedData)
      } else {
        // Reset streak
        const updatedData = {
          ...data,
          stats: {
            ...data.stats,
            streak: 1,
            lastActiveDate: today,
          },
        }
        savePlannerData(updatedData)
      }
    },
    [savePlannerData],
  )

  // The rest of the component remains the same...
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 sticky top-0 z-10 bg-background pt-2 pb-4 border-b">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Daily Planner</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Plan your day with time blocks and boost your productivity
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setIsAddingBlock(true)} className="transition-all hover:scale-105">
              <Plus className="mr-2 h-4 w-4" />
              Add Time Block
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  Templates
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Apply Template</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {plannerData.settings.templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id)
                      applyTemplate()
                    }}
                  >
                    {template.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Templates
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Rest of the component... */}
      {/* This would be the same as the original component */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-4">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">Calendar</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedDate(getPreviousDay(selectedDate))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedDate(getNextDay(selectedDate))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal truncate">
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{formatDateForDisplay(selectedDate)}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    {/* This would be a calendar component in a real implementation */}
                    <div className="p-4">
                      <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">View</h3>
                </div>
                <div className="mt-2 flex items-center rounded-md border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full rounded-none rounded-l-md ${selectedView === "day" ? "bg-muted" : ""}`}
                    onClick={() => setSelectedView("day")}
                  >
                    Day
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full rounded-none rounded-r-md ${selectedView === "week" ? "bg-muted" : ""}`}
                    onClick={() => setSelectedView("week")}
                  >
                    Week
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium">Today's Stats</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Productivity</span>
                      <div className="flex items-center">
                        <span
                          className={`font-medium ${
                            calculateProductivityScore() >= 70
                              ? "text-green-500"
                              : calculateProductivityScore() >= 40
                                ? "text-yellow-500"
                                : "text-red-500"
                          }`}
                        >
                          {calculateProductivityScore()}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          calculateProductivityScore() >= 70
                            ? "bg-green-500"
                            : calculateProductivityScore() >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${calculateProductivityScore()}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground truncate">Hours Planned</p>
                      <p className="text-xl font-bold">{calculateTotalHoursPlanned()}</p>
                      <p className="text-xs text-muted-foreground truncate">{blocksForSelectedDate.length} blocks</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground truncate">Day Streak</p>
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <p className="text-xl font-bold">{plannerData.stats.streak}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {plannerData.stats.completedBlocks} total completed
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">Categories</h3>
                  <div className="space-y-1">
                    {plannerData.settings.categories.map((category) => (
                      <div key={category.id} className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${category.color} flex-shrink-0`} />
                        <span className="text-sm truncate">{category.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="md:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedView === "day"
                    ? formatDateForDisplay(selectedDate)
                    : `Week of ${formatDateForDisplay(weekDays[0])}`}
                </CardTitle>
                <Badge variant="outline" className="font-mono">
                  {blocksForSelectedDate.length} blocks
                </Badge>
              </div>
              {selectedView === "day" && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    {blocksForSelectedDate.filter((block) => block.completed).length} / {blocksForSelectedDate.length}{" "}
                    tasks completed
                  </p>
                  <Progress
                    value={
                      (blocksForSelectedDate.filter((block) => block.completed).length / blocksForSelectedDate.length) *
                      100
                    }
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedView === "day" ? (
                <div className="relative">
                  <div className="absolute left-16 right-0 top-0 bottom-0">
                    {/* Time slots */}
                    {timeSlots.map((time, index) => (
                      <div
                        key={time}
                        className={`absolute left-0 right-0 border-t border-dashed border-muted-foreground/20 ${index === 0 ? "border-t-0" : ""}`}
                        style={{
                          top: `${index * plannerData.settings.timeSlotHeight}px`,
                          height: `${plannerData.settings.timeSlotHeight}px`,
                        }}
                      />
                    ))}

                    {/* Time blocks */}
                    {blocksForSelectedDate.length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="rounded-lg border border-dashed border-primary/50 bg-background p-8 text-center">
                          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">No time blocks planned</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Start planning your day by adding time blocks or applying a template.
                          </p>
                          <div className="mt-6 flex gap-2 justify-center">
                            <Button onClick={() => setIsAddingBlock(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Time Block
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                  Apply Template
                                  <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {plannerData.settings.templates.map((template) => (
                                  <DropdownMenuItem
                                    key={template.id}
                                    onClick={() => {
                                      setSelectedTemplate(template.id)
                                      applyTemplate()
                                    }}
                                  >
                                    {template.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )}
                    {blocksForSelectedDate.map((block) => {
                      const { height, top } = calculateBlockHeight(
                        block.startTime,
                        block.endTime,
                        plannerData.settings.timeSlotHeight,
                        plannerData.settings.dayStartHour,
                        plannerData.settings.dayEndHour,
                      )

                      // Get the category color from the settings
                      const category = plannerData.settings.categories.find((c) => c.id === block.category)
                      const categoryColor = category ? category.color : block.color

                      return (
                        <div
                          key={block.id}
                          className={`absolute left-0 right-0 rounded-md border p-2 transition-all hover:ring-2 hover:ring-primary hover:shadow-md ${categoryColor} ${block.completed ? "opacity-60" : "opacity-90"}`}
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(40, height)}px`, // Min height to ensure small blocks are still clickable
                          }}
                        >
                          <div className="flex h-full flex-col overflow-hidden">
                            <div className="flex items-start justify-between">
                              <div
                                className="font-medium text-white cursor-pointer truncate max-w-[calc(100%-60px)] text-shadow-sm"
                                onClick={() => setEditingBlock(block)}
                                style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}
                              >
                                {block.title}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-6 w-6 text-white hover:bg-white/20 transition-colors ${block.completed ? "bg-white/20" : ""}`}
                                  onClick={() => toggleBlockCompletion(block.id)}
                                  title={block.completed ? "Mark as incomplete" : "Mark as complete"}
                                >
                                  {block.completed ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-white hover:bg-white/20 transition-colors"
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingBlock(block)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        // Clone this block
                                        const newBlock: TimeBlock = {
                                          ...block,
                                          id: Date.now().toString(),
                                          completed: false,
                                        }
                                        const updatedBlocks = [...plannerData.blocks, newBlock]
                                        savePlannerData({
                                          ...plannerData,
                                          blocks: updatedBlocks,
                                        })
                                        toast({
                                          title: "Block duplicated",
                                          description: "A copy of this time block has been created.",
                                        })
                                      }}
                                    >
                                      <Copy className="mr-2 h-4 w-4" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => deleteTimeBlock(block.id)}
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            {height > 60 && (
                              <>
                                <div
                                  className="mt-1 text-sm text-white truncate font-medium"
                                  style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.5)" }}
                                >
                                  {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                </div>
                                {height > 80 && block.description && (
                                  <div
                                    className="mt-1 line-clamp-2 text-xs text-white/90"
                                    style={{ textShadow: "0px 1px 1px rgba(0,0,0,0.4)" }}
                                  >
                                    {block.description}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Time labels */}
                  <div className="relative w-16 pr-2">
                    {timeSlots.map((time, index) => (
                      <div
                        key={time}
                        className="absolute right-0 text-right text-xs text-muted-foreground"
                        style={{
                          top: `${index * plannerData.settings.timeSlotHeight - 8}px`,
                        }}
                      >
                        {formatTime(time)}
                      </div>
                    ))}
                  </div>

                  {/* Spacer for time slots */}
                  <div
                    style={{
                      height: `${timeSlots.length * plannerData.settings.timeSlotHeight}px`,
                      marginLeft: "16px",
                    }}
                  />
                </div>
              ) : (
                // Week view
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-8 gap-2">
                      <div className="p-2 text-center font-medium"></div>
                      {weekDays.map((day) => {
                        const date = new Date(day)
                        const isToday = day === new Date().toISOString().split("T")[0]

                        return (
                          <div
                            key={day}
                            className={`rounded-t-lg p-2 text-center font-medium transition-colors hover:bg-primary/10 cursor-pointer ${isToday ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                            onClick={() => {
                              setSelectedDate(day)
                              setSelectedView("day")
                            }}
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-sm">{date.toLocaleDateString("en-US", { weekday: "short" })}</span>
                              <span className="text-lg font-bold">{date.getDate()}</span>
                              <span className="text-xs">{date.toLocaleDateString("en-US", { month: "short" })}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-2 grid grid-cols-8 gap-2">
                      <div className="p-2 text-center font-medium">Morning</div>
                      {weekDays.map((day) => {
                        const dayBlocks = plannerData.blocks
                          .filter((block) => block.date === day)
                          .filter((block) => {
                            const hour = Number.parseInt(block.startTime.split(":")[0])
                            return hour >= 5 && hour < 12
                          })

                        return (
                          <div key={day} className="min-h-[100px] rounded-sm border p-2">
                            {dayBlocks.length > 0 ? (
                              <div className="space-y-1">
                                {dayBlocks.map((block) => {
                                  // Get the category color from the settings
                                  const category = plannerData.settings.categories.find((c) => c.id === block.category)
                                  const categoryColor = category ? category.color : block.color

                                  return (
                                    <div
                                      key={block.id}
                                      className={`rounded p-1 text-xs ${categoryColor} ${block.completed ? "opacity-60" : "opacity-80"}`}
                                      onClick={() => {
                                        setSelectedDate(day)
                                        setSelectedView("day")
                                      }}
                                    >
                                      <div className="font-medium text-white">{block.title}</div>
                                      <div className="text-white/80">
                                        {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div
                                className="flex h-full items-center justify-center text-xs text-muted-foreground"
                                onClick={() => {
                                  setSelectedDate(day)
                                  setSelectedView("day")
                                  setIsAddingBlock(true)
                                  setNewBlock((prev) => ({
                                    ...prev,
                                    date: day,
                                    startTime: "09:00",
                                    endTime: "10:00",
                                  }))
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-2 grid grid-cols-8 gap-2">
                      <div className="p-2 text-center font-medium">Afternoon</div>
                      {weekDays.map((day) => {
                        const dayBlocks = plannerData.blocks
                          .filter((block) => block.date === day)
                          .filter((block) => {
                            const hour = Number.parseInt(block.startTime.split(":")[0])
                            return hour >= 12 && hour < 17
                          })

                        return (
                          <div key={day} className="min-h-[100px] rounded-sm border p-2">
                            {dayBlocks.length > 0 ? (
                              <div className="space-y-1">
                                {dayBlocks.map((block) => {
                                  // Get the category color from the settings
                                  const category = plannerData.settings.categories.find((c) => c.id === block.category)
                                  const categoryColor = category ? category.color : block.color

                                  return (
                                    <div
                                      key={block.id}
                                      className={`rounded p-1 text-xs ${categoryColor} ${block.completed ? "opacity-60" : "opacity-80"}`}
                                      onClick={() => {
                                        setSelectedDate(day)
                                        setSelectedView("day")
                                      }}
                                    >
                                      <div className="font-medium text-white">{block.title}</div>
                                      <div className="text-white/80">
                                        {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div
                                className="flex h-full items-center justify-center text-xs text-muted-foreground"
                                onClick={() => {
                                  setSelectedDate(day)
                                  setSelectedView("day")
                                  setIsAddingBlock(true)
                                  setNewBlock((prev) => ({
                                    ...prev,
                                    date: day,
                                    startTime: "13:00",
                                    endTime: "14:00",
                                  }))
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-2 grid grid-cols-8 gap-2">
                      <div className="p-2 text-center font-medium">Evening</div>
                      {weekDays.map((day) => {
                        const dayBlocks = plannerData.blocks
                          .filter((block) => block.date === day)
                          .filter((block) => {
                            const hour = Number.parseInt(block.startTime.split(":")[0])
                            return hour >= 17 && hour < 24
                          })

                        return (
                          <div key={day} className="min-h-[100px] rounded-sm border p-2">
                            {dayBlocks.length > 0 ? (
                              <div className="space-y-1">
                                {dayBlocks.map((block) => {
                                  // Get the category color from the settings
                                  const category = plannerData.settings.categories.find((c) => c.id === block.category)
                                  const categoryColor = category ? category.color : block.color

                                  return (
                                    <div
                                      key={block.id}
                                      className={`rounded p-1 text-xs ${categoryColor} ${block.completed ? "opacity-60" : ""}`}
                                      style={{
                                        backgroundColor: `var(--${categoryColor.replace("bg-", "")})`,
                                        opacity: block.completed ? 0.6 : 0.8,
                                      }}
                                      onClick={() => {
                                        setSelectedDate(day)
                                        setSelectedView("day")
                                      }}
                                    >
                                      <div className="font-medium text-white">{block.title}</div>
                                      <div className="text-white/80">
                                        {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div
                                className="flex h-full items-center justify-center text-xs text-muted-foreground"
                                onClick={() => {
                                  setSelectedDate(day)
                                  setSelectedView("day")
                                  setIsAddingBlock(true)
                                  setNewBlock((prev) => ({
                                    ...prev,
                                    date: day,
                                    startTime: "18:00",
                                    endTime: "19:00",
                                  }))
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Time Block Dialog */}
      {(isAddingBlock || editingBlock) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 animate-in fade-in-0 zoom-in-95">
            <h2 className="text-xl font-bold mb-4">{editingBlock ? "Edit Time Block" : "Add Time Block"}</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title
                </label>
                <Input
                  id="title"
                  value={editingBlock ? editingBlock.title : newBlock.title}
                  onChange={(e) => {
                    if (editingBlock) {
                      setEditingBlock({ ...editingBlock, title: e.target.value })
                    } else {
                      setNewBlock({ ...newBlock, title: e.target.value })
                    }
                  }}
                  placeholder="Meeting, Study session, etc."
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description (optional)
                </label>
                <Input
                  id="description"
                  value={editingBlock ? editingBlock.description : newBlock.description}
                  onChange={(e) => {
                    if (editingBlock) {
                      setEditingBlock({ ...editingBlock, description: e.target.value })
                    } else {
                      setNewBlock({ ...newBlock, description: e.target.value })
                    }
                  }}
                  placeholder="Additional details about this block"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium mb-1">
                    Date
                  </label>
                  <Input
                    id="date"
                    type="date"
                    value={editingBlock ? editingBlock.date : newBlock.date}
                    onChange={(e) => {
                      if (editingBlock) {
                        setEditingBlock({ ...editingBlock, date: e.target.value })
                      } else {
                        setNewBlock({ ...newBlock, date: e.target.value })
                      }
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                    value={editingBlock ? editingBlock.category : newBlock.category}
                    onChange={(e) => {
                      if (editingBlock) {
                        setEditingBlock({ ...editingBlock, category: e.target.value })
                      } else {
                        setNewBlock({ ...newBlock, category: e.target.value })
                      }
                    }}
                  >
                    {plannerData.settings.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium mb-1">
                    Start Time
                  </label>
                  <Input
                    id="startTime"
                    type="time"
                    value={editingBlock ? editingBlock.startTime : newBlock.startTime}
                    onChange={(e) => {
                      if (editingBlock) {
                        setEditingBlock({ ...editingBlock, startTime: e.target.value })
                      } else {
                        setNewBlock({ ...newBlock, startTime: e.target.value })
                      }
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium mb-1">
                    End Time
                  </label>
                  <Input
                    id="endTime"
                    type="time"
                    value={editingBlock ? editingBlock.endTime : newBlock.endTime}
                    onChange={(e) => {
                      if (editingBlock) {
                        setEditingBlock({ ...editingBlock, endTime: e.target.value })
                      } else {
                        setNewBlock({ ...newBlock, endTime: e.target.value })
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurring"
                  className="mr-2"
                  checked={editingBlock ? editingBlock.isRecurring : newBlock.isRecurring}
                  onChange={(e) => {
                    if (editingBlock) {
                      setEditingBlock({ ...editingBlock, isRecurring: e.target.checked })
                    } else {
                      setNewBlock({ ...newBlock, isRecurring: e.target.checked })
                    }
                  }}
                />
                <label htmlFor="isRecurring" className="text-sm font-medium">
                  Recurring Event
                </label>
              </div>

              {(editingBlock?.isRecurring || newBlock.isRecurring) && (
                <div>
                  <label htmlFor="recurringPattern" className="block text-sm font-medium mb-1">
                    Recurring Pattern
                  </label>
                  <select
                    id="recurringPattern"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                    value={
                      editingBlock ? editingBlock.recurringPattern || "daily" : newBlock.recurringPattern || "daily"
                    }
                    onChange={(e) => {
                      const pattern = e.target.value as "daily" | "weekly" | "monthly" | "weekdays" | "weekends"
                      if (editingBlock) {
                        setEditingBlock({ ...editingBlock, recurringPattern: pattern })
                      } else {
                        setNewBlock({ ...newBlock, recurringPattern: pattern })
                      }
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingBlock(false)
                  setEditingBlock(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={editingBlock ? updateTimeBlock : addTimeBlock}>{editingBlock ? "Update" : "Add"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-3xl p-6 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Planner Settings</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-2">Display Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dayStartHour" className="block text-sm font-medium mb-1">
                      Day Start Hour
                    </label>
                    <Input
                      id="dayStartHour"
                      type="number"
                      min={0}
                      max={23}
                      value={plannerData.settings.dayStartHour}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        if (!isNaN(value) && value >= 0 && value <= 23) {
                          updateSettings({
                            ...plannerData.settings,
                            dayStartHour: value,
                          })
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="dayEndHour" className="block text-sm font-medium mb-1">
                      Day End Hour
                    </label>
                    <Input
                      id="dayEndHour"
                      type="number"
                      min={0}
                      max={23}
                      value={plannerData.settings.dayEndHour}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        if (!isNaN(value) && value >= 0 && value <= 23) {
                          updateSettings({
                            ...plannerData.settings,
                            dayEndHour: value,
                          })
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="timeSlotHeight" className="block text-sm font-medium mb-1">
                      Time Slot Height (px)
                    </label>
                    <Input
                      id="timeSlotHeight"
                      type="number"
                      min={40}
                      max={200}
                      value={plannerData.settings.timeSlotHeight}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        if (!isNaN(value) && value >= 40 && value <= 200) {
                          updateSettings({
                            ...plannerData.settings,
                            timeSlotHeight: value,
                          })
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="defaultBlockDuration" className="block text-sm font-medium mb-1">
                      Default Block Duration (minutes)
                    </label>
                    <Input
                      id="defaultBlockDuration"
                      type="number"
                      min={5}
                      max={240}
                      step={5}
                      value={plannerData.settings.defaultBlockDuration}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        if (!isNaN(value) && value >= 5 && value <= 240) {
                          updateSettings({
                            ...plannerData.settings,
                            defaultBlockDuration: value,
                          })
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    id="showCompletedBlocks"
                    className="mr-2"
                    checked={plannerData.settings.showCompletedBlocks}
                    onChange={(e) => {
                      updateSettings({
                        ...plannerData.settings,
                        showCompletedBlocks: e.target.checked,
                      })
                    }}
                  />
                  <label htmlFor="showCompletedBlocks" className="text-sm font-medium">
                    Show Completed Blocks
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium mb-2">Categories</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                  {plannerData.settings.categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full ${category.color}`} />
                        <span>{category.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor="newCategoryName" className="block text-sm font-medium mb-1">
                      New Category Name
                    </label>
                    <Input
                      id="newCategoryName"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Work, Personal, etc."
                    />
                  </div>
                  <div>
                    <label htmlFor="newCategoryColor" className="block text-sm font-medium mb-1">
                      Color
                    </label>
                    <select
                      id="newCategoryColor"
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    >
                      <option value="bg-blue-500">Blue</option>
                      <option value="bg-green-500">Green</option>
                      <option value="bg-red-500">Red</option>
                      <option value="bg-yellow-500">Yellow</option>
                      <option value="bg-purple-500">Purple</option>
                      <option value="bg-pink-500">Pink</option>
                      <option value="bg-indigo-500">Indigo</option>
                      <option value="bg-orange-500">Orange</option>
                      <option value="bg-teal-500">Teal</option>
                      <option value="bg-gray-500">Gray</option>
                    </select>
                  </div>
                  <Button onClick={addCategory}>Add</Button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium mb-2">Templates</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto border rounded-md p-2">
                  {plannerData.settings.templates.map((template) => (
                    <div key={template.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedTemplate(template.id)
                              applyTemplate()
                              setIsSettingsOpen(false)
                            }}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              // Remove template
                              const updatedTemplates = plannerData.settings.templates.filter(
                                (t) => t.id !== template.id,
                              )
                              updateSettings({
                                ...plannerData.settings,
                                templates: updatedTemplates,
                              })
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">{template.blocks.length} blocks</div>
                      <div className="mt-2 space-y-1">
                        {template.blocks.slice(0, 3).map((block, index) => (
                          <div key={index} className="text-xs flex items-center gap-1">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                plannerData.settings.categories.find((c) => c.id === block.category)?.color ||
                                block.color
                              }`}
                            />
                            <span className="truncate">
                              {block.title} ({formatTime(block.startTime)} - {formatTime(block.endTime)})
                            </span>
                          </div>
                        ))}
                        {template.blocks.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{template.blocks.length - 3} more blocks...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Create a new template from the current day's blocks
                      const blocksToday = plannerData.blocks.filter((block) => block.date === selectedDate)
                      if (blocksToday.length === 0) {
                        toast({
                          title: "No blocks found",
                          description: "There are no time blocks on the selected date to save as a template.",
                          variant: "destructive",
                        })
                        return
                      }

                      // Prompt for template name
                      const templateName = window.prompt("Enter a name for this template:")
                      if (!templateName) return

                      // Create template
                      const newTemplate: Template = {
                        id: Date.now().toString(),
                        name: templateName,
                        blocks: blocksToday.map(({ id, date, completed, ...rest }) => rest),
                      }

                      // Add to settings
                      updateSettings({
                        ...plannerData.settings,
                        templates: [...plannerData.settings.templates, newTemplate],
                      })

                      toast({
                        title: "Template created",
                        description: `Saved ${blocksToday.length} blocks as template "${templateName}".`,
                      })
                    }}
                  >
                    Save Current Day as Template
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add this at the end, right before the closing div */}
      <PlannerDataIntegrityCheck />
    </div>
  )
}
