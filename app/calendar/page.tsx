"use client"

import { useState, useEffect, useMemo } from "react"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Flame,
  MoreHorizontal,
  Plus,
  Save,
  Settings,
  Trash,
  X,
  Check,
  ChevronDown,
  Calendar,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
      console.warn(`Invalid date string: ${dateString}`)
      return "Invalid date"
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error)
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

function parseDate(dateString: string): Date | undefined {
  // Try ISO format first (YYYY-MM-DD)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/
  if (isoRegex.test(dateString)) {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // Validate the DD/MM/YYYY format
  const validationError = validateDateFormat(dateString)
  if (validationError) {
    return undefined
  }

  // If we get here, we know the format is valid
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = dateString.match(regex)!

  const day = Number.parseInt(match[1], 10)
  const month = Number.parseInt(match[2], 10) - 1 // Months are 0-indexed in JS Date
  const year = Number.parseInt(match[3], 10)

  return new Date(year, month, day)
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

  // Move event subscriptions into useEffect hooks
  useEffect(() => {
    // Subscribe to data updates
    const unsubscribe1 = eventBus.subscribe("data:plannerData:updated", () => {
      console.log("Calendar data updated, refreshing from localStorage")
      const savedData = getLocalStorage<PlannerData>("plannerData", initialPlannerData)
      setPlannerData(savedData)
    })

    // Also subscribe to general data updates
    const unsubscribe2 = eventBus.subscribe("data:updated", (updateInfo) => {
      if (updateInfo?.collection === "plannerData" || updateInfo?.collection === "calendar") {
        console.log("Calendar data updated via general event, refreshing from localStorage")
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

  // Load data from local storage
  useEffect(() => {
    const savedData = getLocalStorage<PlannerData>("plannerData", initialPlannerData)
    setPlannerData(savedData)

    // Update streak if needed
    updateStreak(savedData)
  }, [])

  // Update streak when date changes
  useEffect(() => {
    updateStreak(plannerData)
  }, [selectedDate])

  // Save data to local storage
  const savePlannerData = (data: PlannerData) => {
    setPlannerData(data)
    setLocalStorage("plannerData", data)
  }

  // Update streak based on activity
  const updateStreak = (data: PlannerData) => {
    const today = new Date().toISOString().split("T")[0]
    const { lastActiveDate, streak } = data.stats

    let updatedStreak = streak
    let updatedLastActiveDate = lastActiveDate

    // If this is the first time using the app
    if (!lastActiveDate) {
      updatedStreak = 1
      updatedLastActiveDate = today
    }
    // If user was active yesterday, increment streak
    else if (getPreviousDay(today) === lastActiveDate) {
      updatedStreak = streak + 1
      updatedLastActiveDate = today
    }
    // If user was active today already, keep streak
    else if (today === lastActiveDate) {
      // No change needed
    }
    // If user missed a day or more, reset streak
    else {
      updatedStreak = 1
      updatedLastActiveDate = today
    }

    if (updatedStreak !== streak || updatedLastActiveDate !== lastActiveDate) {
      const updatedData = {
        ...data,
        stats: {
          ...data.stats,
          streak: updatedStreak,
          lastActiveDate: updatedLastActiveDate,
        },
      }
      savePlannerData(updatedData)
    }
  }

  // Time slots for the day view
  const timeSlots = useMemo(() => {
    return generateTimeSlots(plannerData.settings.dayStartHour, plannerData.settings.dayEndHour)
  }, [plannerData.settings.dayStartHour, plannerData.settings.dayEndHour])

  // Get blocks for the selected date
  const blocksForSelectedDate = useMemo(() => {
    const blocks = getTimeBlocksForDate(plannerData.blocks, selectedDate)
    return plannerData.settings.showCompletedBlocks ? blocks : blocks.filter((block) => !block.completed)
  }, [plannerData.blocks, selectedDate, plannerData.settings.showCompletedBlocks])

  // Get days for the week view
  const weekDays = useMemo(() => {
    return getDaysOfWeek(selectedDate)
  }, [selectedDate])

  // Add a new time block
  const addTimeBlock = () => {
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

    // Handle recurring blocks
    if (block.isRecurring && block.recurringPattern) {
      const blocksToAdd: TimeBlock[] = [block]

      // Add recurring blocks for the next 4 weeks
      const currentDate = new Date(block.date)
      const endDate = new Date(currentDate)
      endDate.setDate(endDate.getDate() + 28) // 4 weeks ahead

      const nextDate = new Date(currentDate)
      nextDate.setDate(nextDate.getDate() + 1) // Start from tomorrow

      while (nextDate <= endDate) {
        const dayOfWeek = nextDate.getDay() // 0 = Sunday, 6 = Saturday
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        let shouldAddBlock = false

        switch (block.recurringPattern) {
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
          blocksToAdd.push({
            ...block,
            id: Date.now().toString() + nextDate.getTime(),
            date: nextDate.toISOString().split("T")[0],
          })
        }

        nextDate.setDate(nextDate.getDate() + 1)
      }

      const updatedBlocks = [...plannerData.blocks, ...blocksToAdd]

      // Update total time blocked
      const blockDuration = calculateBlockDuration(block.startTime, block.endTime)
      const updatedTotalTimeBlocked = plannerData.stats.totalTimeBlocked + blockDuration * blocksToAdd.length

      const updatedData = {
        ...plannerData,
        blocks: updatedBlocks,
        stats: {
          ...plannerData.stats,
          totalTimeBlocked: updatedTotalTimeBlocked,
          lastActiveDate: new Date().toISOString().split("T")[0],
        },
      }

      savePlannerData(updatedData)

      toast({
        title: "Recurring blocks added",
        description: `Added ${blocksToAdd.length} recurring time blocks.`,
      })
    } else {
      // Add single block
      const updatedBlocks = [...plannerData.blocks, block]

      // Update total time blocked
      const blockDuration = calculateBlockDuration(block.startTime, block.endTime)
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

      savePlannerData(updatedData)

      toast({
        title: "Block added",
        description: "Your time block has been added to your schedule.",
      })
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
  }

  // Update an existing time block
  const updateTimeBlock = () => {
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
  }

  // Delete a time block
  const deleteTimeBlock = (blockId: string) => {
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
  }

  // Toggle block completion status
  const toggleBlockCompletion = (blockId: string) => {
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
  }

  // Add a new category
  const addCategory = () => {
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
  }

  // Delete a category
  const deleteCategory = (categoryId: string) => {
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
  }

  // Apply a template to the selected date
  const applyTemplate = () => {
    if (!selectedTemplate) return

    const template = plannerData.settings.templates.find((t) => t.id === selectedTemplate)
    if (!template) return

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
  }

  // Update settings
  const updateSettings = (settings: PlannerSettings) => {
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
  }

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

      {/* Add Time Block Dialog */}
      <Dialog open={isAddingBlock} onOpenChange={setIsAddingBlock}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Time Block</DialogTitle>
            <DialogDescription>Create a new time block for your schedule.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newBlock.title}
                onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                placeholder="e.g., Deep Work Session, Team Meeting"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newBlock.description}
                onChange={(e) => setNewBlock({ ...newBlock, description: e.target.value })}
                placeholder="Add details about this time block"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <div className="relative flex items-center">
                  <Input
                    id="startTime"
                    type="time"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                    className="pr-10"
                  />
                  <div className="absolute right-1 flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground"
                      onClick={() => {
                        // Increment time by 15 minutes
                        const [hours, minutes] = newBlock.startTime.split(":").map(Number)
                        let newMinutes = minutes + 15
                        let newHours = hours
                        if (newMinutes >= 60) {
                          newHours = (newHours + 1) % 24
                          newMinutes = newMinutes % 60
                        }
                        setNewBlock({
                          ...newBlock,
                          startTime: `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`,
                        })
                      }}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground"
                      onClick={() => {
                        // Decrement time by 15 minutes
                        const [hours, minutes] = newBlock.startTime.split(":").map(Number)
                        let newMinutes = minutes - 15
                        let newHours = hours
                        if (newMinutes < 0) {
                          newHours = (newHours - 1 + 24) % 24
                          newMinutes = newMinutes + 60
                        }
                        setNewBlock({
                          ...newBlock,
                          startTime: `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`,
                        })
                      }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <div className="relative flex items-center">
                  <Input
                    id="endTime"
                    type="time"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                    className="pr-10"
                  />
                  <div className="absolute right-1 flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground"
                      onClick={() => {
                        // Increment time by 15 minutes
                        const [hours, minutes] = newBlock.endTime.split(":").map(Number)
                        let newMinutes = minutes + 15
                        let newHours = hours
                        if (newMinutes >= 60) {
                          newHours = (newHours + 1) % 24
                          newMinutes = newMinutes % 60
                        }
                        setNewBlock({
                          ...newBlock,
                          endTime: `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`,
                        })
                      }}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground"
                      onClick={() => {
                        // Decrement time by 15 minutes
                        const [hours, minutes] = newBlock.endTime.split(":").map(Number)
                        let newMinutes = minutes - 15
                        let newHours = hours
                        if (newMinutes < 0) {
                          newHours = (newHours - 1 + 24) % 24
                          newMinutes = newMinutes + 60
                        }
                        setNewBlock({
                          ...newBlock,
                          endTime: `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`,
                        })
                      }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newBlock.date}
                  onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newBlock.category}
                  onValueChange={(value) => setNewBlock({ ...newBlock, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {plannerData.settings.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center">
                          <div className={`mr-2 h-2 w-2 rounded-full ${category.color}`} />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {[
                  "bg-blue-500",
                  "bg-green-500",
                  "bg-red-500",
                  "bg-purple-500",
                  "bg-yellow-500",
                  "bg-pink-500",
                  "bg-indigo-500",
                  "bg-gray-500",
                ].map((color) => (
                  <div
                    key={color}
                    role="radio"
                    aria-checked={newBlock.color === color}
                    tabIndex={0}
                    className={`h-8 w-8 cursor-pointer rounded-full ${color} ${
                      newBlock.color === color ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    onClick={() => setNewBlock({ ...newBlock, color })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setNewBlock({ ...newBlock, color })
                      }
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="recurring" className="flex-1">
                Recurring
              </Label>
              <div className="flex items-center gap-4">
                <input
                  id="recurring"
                  type="checkbox"
                  checked={newBlock.isRecurring}
                  onChange={(e) => setNewBlock({ ...newBlock, isRecurring: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
            </div>
            {newBlock.isRecurring && (
              <div className="grid gap-2">
                <Label htmlFor="recurringPattern">Recurring Pattern</Label>
                <Select
                  value={newBlock.recurringPattern || "daily"}
                  onValueChange={(value: "daily" | "weekly" | "monthly" | "weekdays" | "weekends") =>
                    setNewBlock({ ...newBlock, recurringPattern: value })
                  }
                >
                  <SelectTrigger id="recurringPattern">
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                    <SelectItem value="weekends">Weekends (Sat-Sun)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingBlock(false)}>
              Cancel
            </Button>
            <Button onClick={addTimeBlock}>Add Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Time Block Dialog */}
      <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Time Block</DialogTitle>
            <DialogDescription>Update the details of your time block.</DialogDescription>
          </DialogHeader>
          {editingBlock && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingBlock.title}
                  onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Textarea
                  id="edit-description"
                  value={editingBlock.description}
                  onChange={(e) => setEditingBlock({ ...editingBlock, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={editingBlock.startTime}
                    onChange={(e) => setEditingBlock({ ...editingBlock, startTime: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={editingBlock.endTime}
                    onChange={(e) => setEditingBlock({ ...editingBlock, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingBlock.date}
                    onChange={(e) => setEditingBlock({ ...editingBlock, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingBlock.category}
                    onChange={(value) => setEditingBlock({ ...editingBlock, category: value })}
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {plannerData.settings.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center">
                            <div className={`mr-2 h-2 w-2 rounded-full ${category.color}`} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "bg-blue-500",
                    "bg-green-500",
                    "bg-red-500",
                    "bg-purple-500",
                    "bg-yellow-500",
                    "bg-pink-500",
                    "bg-indigo-500",
                    "bg-gray-500",
                  ].map((color) => (
                    <div
                      key={color}
                      className={`h-8 w-8 cursor-pointer rounded-full ${color} ${
                        editingBlock.color === color ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      onClick={() => setEditingBlock({ ...editingBlock, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-completed" className="flex-1">
                  Completed
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    id="edit-completed"
                    type="checkbox"
                    checked={editingBlock.completed}
                    onChange={(e) => setEditingBlock({ ...editingBlock, completed: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBlock(null)}>
              Cancel
            </Button>
            <Button onClick={updateTimeBlock}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Planner Settings</DialogTitle>
            <DialogDescription>Customize your daily planner experience.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="dayStartHour">Day Start Hour</Label>
                <Select
                  value={plannerData.settings.dayStartHour.toString()}
                  onValueChange={(value) => {
                    const updatedSettings = {
                      ...plannerData.settings,
                      dayStartHour: Number.parseInt(value),
                    }
                    savePlannerData({
                      ...plannerData,
                      settings: updatedSettings,
                    })
                  }}
                >
                  <SelectTrigger id="dayStartHour">
                    <SelectValue placeholder="Select start hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i).map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : "12 PM"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dayEndHour">Day End Hour</Label>
                <Select
                  value={plannerData.settings.dayEndHour.toString()}
                  onValueChange={(value) => {
                    const updatedSettings = {
                      ...plannerData.settings,
                      dayEndHour: Number.parseInt(value),
                    }
                    savePlannerData({
                      ...plannerData,
                      settings: updatedSettings,
                    })
                  }}
                >
                  <SelectTrigger id="dayEndHour">
                    <SelectValue placeholder="Select end hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 12).map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour === 12 ? "12 PM" : hour < 24 ? `${hour - 12} PM` : "12 AM"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timeSlotHeight">Time Slot Height (pixels)</Label>
                <Input
                  id="timeSlotHeight"
                  type="number"
                  min="40"
                  max="120"
                  step="10"
                  value={plannerData.settings.timeSlotHeight}
                  onChange={(e) => {
                    const updatedSettings = {
                      ...plannerData.settings,
                      timeSlotHeight: Number.parseInt(e.target.value) || 80,
                    }
                    savePlannerData({
                      ...plannerData,
                      settings: updatedSettings,
                    })
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="defaultBlockDuration">Default Block Duration (minutes)</Label>
                <Select
                  value={plannerData.settings.defaultBlockDuration.toString()}
                  onValueChange={(value) => {
                    const updatedSettings = {
                      ...plannerData.settings,
                      defaultBlockDuration: Number.parseInt(value),
                    }
                    savePlannerData({
                      ...plannerData,
                      settings: updatedSettings,
                    })
                  }}
                >
                  <SelectTrigger id="defaultBlockDuration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 30, 45, 60, 90, 120].map((duration) => (
                      <SelectItem key={duration} value={duration.toString()}>
                        {duration} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="showCompletedBlocks" className="flex-1">
                  Show Completed Blocks
                </Label>
                <div className="flex items-center gap-4">
                  <input
                    id="showCompletedBlocks"
                    type="checkbox"
                    checked={plannerData.settings.showCompletedBlocks}
                    onChange={(e) => {
                      const updatedSettings = {
                        ...plannerData.settings,
                        showCompletedBlocks: e.target.checked,
                      }
                      savePlannerData({
                        ...plannerData,
                        settings: updatedSettings,
                      })
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="categories" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="p-4">
                    <h3 className="text-sm font-medium">Current Categories</h3>
                  </div>
                  <div className="p-4 pt-0">
                    {plannerData.settings.categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${category.color} flex-shrink-0`} />
                          <span className="text-sm truncate">{category.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteCategory(category.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <h3 className="mb-4 text-sm font-medium">Add New Category</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="categoryName">Category Name</Label>
                      <Input
                        id="categoryName"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="e.g., Meetings, Exercise"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "bg-blue-500",
                          "bg-green-500",
                          "bg-red-500",
                          "bg-purple-500",
                          "bg-yellow-500",
                          "bg-pink-500",
                          "bg-indigo-500",
                          "bg-gray-500",
                        ].map((color) => (
                          <div
                            key={color}
                            className={`h-8 w-8 cursor-pointer rounded-full ${color} ${
                              newCategory.color === color ? "ring-2 ring-primary ring-offset-2" : ""
                            }`}
                            onClick={() => setNewCategory({ ...newCategory, color })}
                          />
                        ))}
                      </div>
                    </div>
                    <Button onClick={addCategory}>Add Category</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="templates" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="p-4">
                    <h3 className="text-sm font-medium">Available Templates</h3>
                  </div>
                  <ScrollArea className="h-[200px] p-4 pt-0">
                    {plannerData.settings.templates.map((template) => (
                      <div key={template.id} className="mb-4 rounded-md border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-medium">{template.name}</h4>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                // Clone template to selected date
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
                                setIsSettingsOpen(false)

                                toast({
                                  title: "Template applied",
                                  description: `Added ${blocksToAdd.length} blocks to your schedule.`,
                                })
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                // Delete template
                                const updatedTemplates = plannerData.settings.templates.filter(
                                  (t) => t.id !== template.id,
                                )

                                const updatedData = {
                                  ...plannerData,
                                  settings: {
                                    ...plannerData.settings,
                                    templates: updatedTemplates,
                                  },
                                }

                                savePlannerData(updatedData)

                                toast({
                                  title: "Template deleted",
                                  description: "The template has been deleted.",
                                })
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {template.blocks.map((block, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className={`h-2 w-2 rounded-full ${block.color}`} />
                              <span>{block.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(block.startTime)} - {formatTime(block.endTime)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                <div className="rounded-md border p-4">
                  <h3 className="mb-4 text-sm font-medium">Save Current Day as Template</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="templateName">Template Name</Label>
                      <Input id="templateName" placeholder="e.g., Productive Workday, Weekend Routine" />
                    </div>
                    <Button
                      onClick={() => {
                        const templateName = (document.getElementById("templateName") as HTMLInputElement).value

                        if (!templateName) {
                          toast({
                            title: "Template name required",
                            description: "Please provide a name for your template.",
                            variant: "destructive",
                          })
                          return
                        }

                        const blocksForTemplate = plannerData.blocks
                          .filter((block) => block.date === selectedDate)
                          .map(({ id, date, completed, ...rest }) => rest)

                        if (blocksForTemplate.length === 0) {
                          toast({
                            title: "No blocks to save",
                            description: "There are no time blocks on the selected date to save as a template.",
                            variant: "destructive",
                          })
                          return
                        }

                        const newTemplate: Template = {
                          id: Date.now().toString(),
                          name: templateName,
                          blocks: blocksForTemplate,
                        }

                        const updatedData = {
                          ...plannerData,
                          settings: {
                            ...plannerData.settings,
                            templates: [...plannerData.settings.templates, newTemplate],
                          },
                        }

                        savePlannerData(updatedData)(
                          // Clear input
                          document.getElementById("templateName") as HTMLInputElement,
                        ).value = ""

                        toast({
                          title: "Template saved",
                          description: "Your current day has been saved as a template.",
                        })
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save as Template
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
