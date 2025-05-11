"use client"

import { useState, useEffect } from "react"
import {
  Dumbbell,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Trophy,
  List,
  Timer,
  PlayCircle,
  PauseCircle,
  RotateCw,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ErrorBoundary } from "@/components/error-boundary"

interface Exercise {
  id: string
  name: string
  category: string
  instructions: string
}

interface WorkoutSet {
  id: string
  exerciseId: string
  weight: number
  reps: number
  completed: boolean
}

// Update the Workout interface to include recurring options
interface Workout {
  id: string
  name: string
  date: string
  notes?: string
  completed: boolean
  sets: WorkoutSet[]
  duration?: number
  isRecurring: boolean
  recurringType: "daily" | "weekly" | "custom" | "none"
  recurringDays?: number[] // 0-6 for days of week
  recurringInterval?: number // For custom recurrence
  lastCompleted?: string
}

interface WorkoutHistory {
  workouts: Workout[]
  exercises: Exercise[]
  stats: {
    totalWorkouts: number
    totalSets: number
    totalCompletedWorkouts: number
    streak: number
    lastWorkoutDate: string | null
  }
}

const defaultExercises: Exercise[] = [
  {
    id: "ex1",
    name: "Bench Press",
    category: "Chest",
    instructions: "Lie on a flat bench and press the weight upward until your arms are extended.",
  },
  {
    id: "ex2",
    name: "Squat",
    category: "Legs",
    instructions:
      "Stand with feet shoulder-width apart, bend knees to lower your body, then return to standing position.",
  },
  {
    id: "ex3",
    name: "Deadlift",
    category: "Back",
    instructions: "Stand with feet hip-width apart, bend at hips and knees to lower and grab the bar, then stand up.",
  },
  {
    id: "ex4",
    name: "Pull-up",
    category: "Back",
    instructions: "Hang from a bar with palms facing away, pull your body up until chin is over the bar.",
  },
  {
    id: "ex5",
    name: "Push-up",
    category: "Chest",
    instructions: "Start in plank position, lower your body until chest nearly touches the floor, then push back up.",
  },
  {
    id: "ex6",
    name: "Shoulder Press",
    category: "Shoulders",
    instructions: "Sit or stand with weights at shoulder height, press upward until arms are fully extended.",
  },
  {
    id: "ex7",
    name: "Bicep Curl",
    category: "Arms",
    instructions: "Hold weights with arms extended, bend at the elbow to curl weights toward shoulders.",
  },
  {
    id: "ex8",
    name: "Tricep Extension",
    category: "Arms",
    instructions: "Hold weight overhead, lower behind your head by bending elbows, then extend arms back up.",
  },
]

const exerciseCategories = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "Other"]

const initialWorkoutHistory: WorkoutHistory = {
  workouts: [],
  exercises: defaultExercises,
  stats: {
    totalWorkouts: 0,
    totalSets: 0,
    totalCompletedWorkouts: 0,
    streak: 0,
    lastWorkoutDate: null,
  },
}

export default function WorkoutPage() {
  const { toast } = useToast()
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory>(initialWorkoutHistory)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false)
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [workoutTimer, setWorkoutTimer] = useState(0)
  const [activeView, setActiveView] = useState<"calendar" | "history" | "stats">("calendar")
  const [isLoading, setIsLoading] = useState(true)

  // New workout form state
  // Add recurring options to the new workout form
  const [newWorkout, setNewWorkout] = useState<Omit<Workout, "id" | "completed" | "sets" | "duration">>({
    name: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    isRecurring: false,
    recurringType: "none",
    recurringDays: [],
    recurringInterval: 1,
  })

  // New exercise form state
  const [newExercise, setNewExercise] = useState<Omit<Exercise, "id">>({
    name: "",
    category: "Other",
    instructions: "",
  })

  // Load workout history from localStorage
  useEffect(() => {
    try {
      const savedWorkoutHistory = getLocalStorage<WorkoutHistory>("workoutHistory", initialWorkoutHistory)

      // Ensure the workoutHistory has all required properties
      const validatedHistory: WorkoutHistory = {
        workouts: Array.isArray(savedWorkoutHistory?.workouts) ? savedWorkoutHistory.workouts : [],
        exercises: Array.isArray(savedWorkoutHistory?.exercises) ? savedWorkoutHistory.exercises : defaultExercises,
        stats: {
          totalWorkouts: savedWorkoutHistory?.stats?.totalWorkouts || 0,
          totalSets: savedWorkoutHistory?.stats?.totalSets || 0,
          totalCompletedWorkouts: savedWorkoutHistory?.stats?.totalCompletedWorkouts || 0,
          streak: savedWorkoutHistory?.stats?.streak || 0,
          lastWorkoutDate: savedWorkoutHistory?.stats?.lastWorkoutDate || null,
        },
      }

      setWorkoutHistory(validatedHistory)

      // Find workout for selected date
      const workout = validatedHistory.workouts.find((w) => w.date === selectedDate)
      setSelectedWorkout(workout || null)
      setIsLoading(false)
    } catch (error) {
      console.error("Error loading workout history:", error)
      // If there's an error, use the initial state
      setWorkoutHistory(initialWorkoutHistory)
      setSelectedWorkout(null)
      setIsLoading(false)

      // Show error toast
      toast({
        title: "Error loading workout data",
        description: "There was a problem loading your workout history. Default data has been loaded.",
        variant: "destructive",
      })
    }
  }, [selectedDate, toast])

  // Timer effect for active workout
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isWorkoutActive && selectedWorkout) {
      interval = setInterval(() => {
        setWorkoutTimer((prev) => prev + 1)
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isWorkoutActive, selectedWorkout])

  // Add a function to check for and create recurring workouts
  const checkAndCreateRecurringWorkouts = () => {
    if (!workoutHistory || !Array.isArray(workoutHistory.workouts)) {
      console.error("Invalid workout history data:", workoutHistory)
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayStr = today.toISOString().split("T")[0]
    const dayOfWeek = today.getDay() // 0-6, Sunday-Saturday

    let hasCreatedWorkout = false

    workoutHistory.workouts.forEach((workout) => {
      if (!workout.isRecurring || !workout.lastCompleted) return

      const lastCompleted = new Date(workout.lastCompleted)
      lastCompleted.setHours(0, 0, 0, 0)

      // Skip if already created a workout for today
      if (lastCompleted.getTime() === today.getTime()) return

      let shouldCreateWorkout = false

      switch (workout.recurringType) {
        case "daily":
          // Create a workout every day
          shouldCreateWorkout = true
          break

        case "weekly":
          // Create a workout on specific days of the week
          if (workout.recurringDays?.includes(dayOfWeek)) {
            shouldCreateWorkout = true
          }
          break

        case "custom":
          // Create a workout every X days
          if (workout.recurringInterval) {
            const daysSinceLastWorkout = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24))
            if (daysSinceLastWorkout >= workout.recurringInterval) {
              shouldCreateWorkout = true
            }
          }
          break
      }

      if (shouldCreateWorkout) {
        // Create a new workout based on the recurring one
        const newWorkout: Workout = {
          ...workout,
          id: Date.now().toString(),
          date: todayStr,
          duration: 0,
          lastCompleted: todayStr,
          completed: false,
          sets: [],
        }

        const updatedWorkouts = [...workoutHistory.workouts, newWorkout]

        const updatedHistory = {
          ...workoutHistory,
          workouts: updatedWorkouts,
        }

        saveWorkoutHistory(updatedHistory)
        hasCreatedWorkout = true
      }
    })

    if (hasCreatedWorkout) {
      toast({
        title: "Recurring workouts created",
        description: "Your scheduled workouts for today are ready.",
      })
    }
  }

  const saveWorkoutHistory = (updatedHistory: WorkoutHistory) => {
    // Validate the history object before saving
    if (!updatedHistory || typeof updatedHistory !== "object") {
      console.error("Invalid workout history data:", updatedHistory)
      return
    }

    // Ensure all required properties exist
    const validatedHistory: WorkoutHistory = {
      workouts: Array.isArray(updatedHistory.workouts) ? updatedHistory.workouts : [],
      exercises: Array.isArray(updatedHistory.exercises) ? updatedHistory.exercises : defaultExercises,
      stats: {
        totalWorkouts: updatedHistory.stats?.totalWorkouts || 0,
        totalSets: updatedHistory.stats?.totalSets || 0,
        totalCompletedWorkouts: updatedHistory.stats?.totalCompletedWorkouts || 0,
        streak: updatedHistory.stats?.streak || 0,
        lastWorkoutDate: updatedHistory.stats?.lastWorkoutDate || null,
      },
    }

    setWorkoutHistory(validatedHistory)

    try {
      setLocalStorage("workoutHistory", validatedHistory)
    } catch (error) {
      console.error("Error saving workout history:", error)
      toast({
        title: "Error saving data",
        description: "There was a problem saving your workout data.",
        variant: "destructive",
      })
    }
  }

  const addWorkout = () => {
    if (!newWorkout.name) {
      toast({
        title: "Workout name required",
        description: "Please provide a name for your workout.",
        variant: "destructive",
      })
      return
    }

    const workout: Workout = {
      ...newWorkout,
      id: Date.now().toString(),
      completed: false,
      sets: [],
    }

    // Ensure workoutHistory is valid before updating
    if (!workoutHistory || !Array.isArray(workoutHistory.workouts)) {
      console.error("Invalid workout history data:", workoutHistory)
      toast({
        title: "Error adding workout",
        description: "There was a problem with your workout data.",
        variant: "destructive",
      })
      return
    }

    const updatedWorkouts = [...workoutHistory.workouts, workout]

    const updatedHistory = {
      ...workoutHistory,
      workouts: updatedWorkouts,
      stats: {
        ...workoutHistory.stats,
        totalWorkouts: workoutHistory.stats.totalWorkouts + 1,
      },
    }

    saveWorkoutHistory(updatedHistory)
    setSelectedWorkout(workout)
    setIsAddWorkoutOpen(false)

    // Reset form
    setNewWorkout({
      name: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      isRecurring: false,
      recurringType: "none",
      recurringDays: [],
      recurringInterval: 1,
    })

    toast({
      title: "Workout added",
      description: "Your workout has been added to your calendar.",
    })
  }

  const updateWorkout = () => {
    if (!editingWorkout) return

    // Ensure workoutHistory is valid before updating
    if (!workoutHistory || !Array.isArray(workoutHistory.workouts)) {
      console.error("Invalid workout history data:", workoutHistory)
      toast({
        title: "Error updating workout",
        description: "There was a problem with your workout data.",
        variant: "destructive",
      })
      return
    }

    const updatedWorkouts = workoutHistory.workouts.map((workout) =>
      workout.id === editingWorkout.id ? editingWorkout : workout,
    )

    const updatedHistory = {
      ...workoutHistory,
      workouts: updatedWorkouts,
    }

    saveWorkoutHistory(updatedHistory)
    setEditingWorkout(null)

    if (selectedWorkout?.id === editingWorkout.id) {
      setSelectedWorkout(editingWorkout)
    }

    toast({
      title: "Workout updated",
      description: "Your workout has been updated.",
    })
  }

  const deleteWorkout = (id: string) => {
    // Ensure workoutHistory is valid before updating
    if (!workoutHistory || !Array.isArray(workoutHistory.workouts)) {
      console.error("Invalid workout history data:", workoutHistory)
      toast({
        title: "Error deleting workout",
        description: "There was a problem with your workout data.",
        variant: "destructive",
      })
      return
    }

    const workoutToDelete = workoutHistory.workouts.find((w) => w.id === id)
    if (!workoutToDelete) return

    const updatedWorkouts = workoutHistory.workouts.filter((w) => w.id !== id)

    // Update stats
    const updatedStats = {
      ...workoutHistory.stats,
      totalWorkouts: workoutHistory.stats.totalWorkouts - 1,
      totalSets: workoutHistory.stats.totalSets - workoutToDelete.sets.length,
      totalCompletedWorkouts: workoutHistory.stats.totalCompletedWorkouts - (workoutToDelete.completed ? 1 : 0),
    }

    const updatedHistory = {
      ...workoutHistory,
      workouts: updatedWorkouts,
      stats: updatedStats,
    }

    saveWorkoutHistory(updatedHistory)

    if (selectedWorkout?.id === id) {
      setSelectedWorkout(null)
    }

    toast({
      title: "Workout deleted",
      description: "Your workout has been deleted.",
    })
  }

  const addExercise = () => {
    if (!newExercise.name) {
      toast({
        title: "Exercise name required",
        description: "Please provide a name for the exercise.",
        variant: "destructive",
      })
      return
    }

    // Ensure workoutHistory is valid before updating
    if (!workoutHistory || !Array.isArray(workoutHistory.exercises)) {
      console.error("Invalid workout history data:", workoutHistory)
      toast({
        title: "Error adding exercise",
        description: "There was a problem with your workout data.",
        variant: "destructive",
      })
      return
    }

    const exercise: Exercise = {
      ...newExercise,
      id: Date.now().toString(),
    }

    const updatedExercises = [...workoutHistory.exercises, exercise]

    const updatedHistory = {
      ...workoutHistory,
      exercises: updatedExercises,
    }

    saveWorkoutHistory(updatedHistory)
    setIsAddExerciseOpen(false)

    // Reset form
    setNewExercise({
      name: "",
      category: "Other",
      instructions: "",
    })

    toast({
      title: "Exercise added",
      description: "The exercise has been added to your library.",
    })
  }

  const addSet = (exerciseId: string) => {
    if (!selectedWorkout) return

    // Ensure workoutHistory is valid before updating
    if (!workoutHistory || !Array.isArray(workoutHistory.exercises)) {
      console.error("Invalid workout history data:", workoutHistory)
      toast({
        title: "Error adding set",
        description: "There was a problem with your workout data.",
        variant: "destructive",
      })
      return
    }

    const exercise = workoutHistory.exercises.find((e) => e.id === exerciseId)
    if (!exercise) return

    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      exerciseId,
      weight: 0,
      reps: 0,
      completed: false,
    }

    const updatedWorkout = {
      ...selectedWorkout,
      sets: [...selectedWorkout.sets, newSet],
    }

    const updatedWorkouts = workoutHistory.workouts.map((workout) =>
      workout.id === selectedWorkout.id ? updatedWorkout : workout,
    )

    const updatedHistory = {
      ...workoutHistory,
      workouts: updatedWorkouts,
      stats: {
        ...workoutHistory.stats,
        totalSets: workoutHistory.stats.totalSets + 1,
      },
    }

    saveWorkoutHistory(updatedHistory)
    setSelectedWorkout(updatedWorkout)

    toast({
      title: "Set added",
      description: `New set added for ${exercise.name}.`,
    })
  }

  const updateSet = (workoutId: string, setId: string, updatedData: Partial<WorkoutSet>) => {
    // Ensure workoutHistory is valid before updating
    if (!workoutHistory || !Array.isArray(workoutHistory.workouts)) {
      console.error("Invalid workout history data:", workoutHistory)
      return
    }

    const workout = workoutHistory.workouts.find((w) => w.id === workoutId)
    if (!workout) return

    const updatedSets = workout.sets.map((set) => (set.id === setId ? { ...set, ...updatedData } : set))

    const updatedWorkout = {
      ...workout,
      sets: updatedSets,
    }

    const updatedWorkouts = workoutHistory.workouts.map((w) => (w.id === workoutId ? updatedWorkout : w))

    const updatedHistory = {
      ...workoutHistory,
      workouts: updatedWorkouts,
    }

    saveWorkoutHistory(updatedHistory)

    if (selectedWorkout?.id === workoutId) {
      setSelectedWorkout(updatedWorkout)
    }
  }

  const deleteSet = (workoutId: string, setId: string) => {
    // Ensure workoutHistory is valid before updating
    if (!workoutHistory || !Array.isArray(workoutHistory.workouts)) {
      console.error("Invalid workout history data:", workoutHistory)
      toast({
        title: "Error deleting set",
        description: "There was a problem with your workout data.",
        variant: "destructive",
      })
      return
    }

    const workout = workoutHistory.workouts.find((w) => w.id === workoutId)
    if (!workout) return

    const updatedSets = workout.sets.filter((set) => set.id !== setId)

    const updatedWorkout = {
      ...workout,
      sets: updatedSets,
    }

    const updatedWorkouts = workoutHistory.workouts.map((w) => (w.id === workoutId ? updatedWorkout : w))

    const updatedHistory = {
      ...workoutHistory,
      workouts: updatedWorkouts,
      stats: {
        ...workoutHistory.stats,
        totalSets: workoutHistory.stats.totalSets - 1,
      },
    }

    saveWorkoutHistory(updatedHistory)

    if (selectedWorkout?.id === workoutId) {
      setSelectedWorkout(updatedWorkout)
    }

    toast({
      title: "Set deleted",
      description: "The set has been removed from your workout.",
    })
  }

  const completeWorkout = () => {
    if (!selectedWorkout) return

    // Ensure workoutHistory is valid before updating
    if (!workoutHistory || !workoutHistory.stats) {
      console.error("Invalid workout history data:", workoutHistory)
      toast({
        title: "Error completing workout",
        description: "There was a problem with your workout data.",
        variant: "destructive",
      })
      return
    }

    // Stop the timer if it's running
    setIsWorkoutActive(false)

    const updatedWorkout = {
      ...selectedWorkout,
      completed: true,
      duration: workoutTimer,
    }

    const updatedWorkouts = workoutHistory.workouts.map((workout) =>
      workout.id === selectedWorkout.id ? updatedWorkout : workout,
    )

    // Update streak
    let updatedStreak = workoutHistory.stats.streak
    const today = new Date().toISOString().split("T")[0]

    if (workoutHistory.stats.lastWorkoutDate) {
      const lastDate = new Date(workoutHistory.stats.lastWorkoutDate)
      const currentDate = new Date(today)
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 1) {
        updatedStreak += 1
      } else {
        updatedStreak = 1
      }
    } else {
      updatedStreak = 1
    }

    const updatedHistory = {
      ...workoutHistory,
      workouts: updatedWorkouts,
      stats: {
        ...workoutHistory.stats,
        totalCompletedWorkouts: workoutHistory.stats.totalCompletedWorkouts + 1,
        streak: updatedStreak,
        lastWorkoutDate: today,
      },
    }

    saveWorkoutHistory(updatedHistory)
    setSelectedWorkout(updatedWorkout)
    setWorkoutTimer(0)

    toast({
      title: "Workout completed!",
      description: "Great job! Your workout has been marked as complete.",
    })
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours > 0 ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toISOString().split("T")[0])
  }

  const getPrevDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split("T")[0])
  }

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  }

  // Group exercises by category
  const exercisesByCategory =
    workoutHistory?.exercises?.reduce(
      (acc, exercise) => {
        if (!acc[exercise.category]) {
          acc[exercise.category] = []
        }
        acc[exercise.category].push(exercise)
        return acc
      },
      {} as Record<string, Exercise[]>,
    ) || {}

  // Call this function when the component mounts
  useEffect(() => {
    // Check for recurring workouts that need to be created
    if (!isLoading) {
      checkAndCreateRecurringWorkouts()
    }

    // Set up a daily check at midnight
    const checkAtMidnight = () => {
      const now = new Date()
      const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // tomorrow
        0,
        0,
        0, // midnight
      )
      const msToMidnight = night.getTime() - now.getTime()

      return setTimeout(() => {
        checkAndCreateRecurringWorkouts()
        // Set up the next check
        const midnightInterval = setInterval(
          () => {
            checkAndCreateRecurringWorkouts()
          },
          24 * 60 * 60 * 1000,
        ) // Check every 24 hours

        return () => clearInterval(midnightInterval)
      }, msToMidnight)
    }

    const midnightTimeout = checkAtMidnight()
    return () => clearTimeout(midnightTimeout)
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
          <h2 className="text-2xl font-bold">Loading workout data...</h2>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workout Tracker</h1>
            <p className="text-muted-foreground">Track your fitness progress and workout routines</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={activeView} onValueChange={(value: "calendar" | "history" | "stats") => setActiveView(value)}>
              <TabsList>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={() => setIsAddWorkoutOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Workout
            </Button>
          </div>
        </div>

        {activeView === "calendar" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Calendar</CardTitle>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" onClick={getPrevDay}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={getNextDay}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{getFormattedDate(selectedDate)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Select a date to view or add workouts</span>
                    </div>

                    <div className="pt-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <h3 className="text-sm font-medium">Streak</h3>
                    <div className="flex items-center gap-2 rounded-md border p-3">
                      <Trophy className="h-8 w-8 text-yellow-500" />
                      <div>
                        <div className="text-xl font-bold">{workoutHistory?.stats?.streak || 0} days</div>
                        <div className="text-xs text-muted-foreground">Current streak</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <h3 className="text-sm font-medium">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md border p-2 text-center">
                        <div className="text-xl font-bold">{workoutHistory?.stats?.totalWorkouts || 0}</div>
                        <div className="text-xs text-muted-foreground">Total Workouts</div>
                      </div>
                      <div className="rounded-md border p-2 text-center">
                        <div className="text-xl font-bold">{workoutHistory?.stats?.totalCompletedWorkouts || 0}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button variant="outline" className="w-full" onClick={() => setIsAddExerciseOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Exercise
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-3">
              {!selectedWorkout ? (
                <Card className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <Dumbbell className="mb-4 h-16 w-16 text-muted-foreground" />
                  <h2 className="text-2xl font-bold">No Workout Planned</h2>
                  <p className="mb-6 text-muted-foreground">
                    No workout scheduled for this date. Add a workout to get started.
                  </p>
                  <Button onClick={() => setIsAddWorkoutOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Workout
                  </Button>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{selectedWorkout.name}</CardTitle>
                          {selectedWorkout.completed && (
                            <Badge variant="outline" className="bg-green-500 text-white">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{selectedWorkout.notes || "No workout notes"}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => setEditingWorkout(selectedWorkout)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteWorkout(selectedWorkout.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!selectedWorkout.completed && (
                      <div className="mb-4 flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-2">
                          <Timer className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="text-lg font-bold">{formatTime(workoutTimer)}</div>
                            <div className="text-xs text-muted-foreground">Workout Duration</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!isWorkoutActive ? (
                            <Button variant="outline" size="sm" onClick={() => setIsWorkoutActive(true)}>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Start
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsWorkoutActive(false)}>
                              <PauseCircle className="mr-2 h-4 w-4" />
                              Pause
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => setWorkoutTimer(0)}>
                            <RotateCw className="mr-2 h-4 w-4" />
                            Reset
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={completeWorkout}
                            disabled={selectedWorkout.completed}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Finish
                          </Button>
                        </div>
                      </div>
                    )}

                    {!selectedWorkout.sets || selectedWorkout.sets.length === 0 ? (
                      <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
                        <p className="text-muted-foreground">No exercises added to this workout yet</p>
                        <p className="text-sm text-muted-foreground">Add exercises and sets to track your progress</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(exercisesByCategory).map(([category, exercises]) => {
                          // Filter exercises used in this workout
                          const usedExercises = exercises.filter((exercise) =>
                            selectedWorkout.sets.some((set) => set.exerciseId === exercise.id),
                          )

                          if (usedExercises.length === 0) return null

                          return (
                            <div key={category}>
                              <h3 className="mb-2 font-semibold">{category}</h3>
                              <div className="space-y-3">
                                {usedExercises.map((exercise) => {
                                  const exerciseSets = selectedWorkout.sets.filter(
                                    (set) => set.exerciseId === exercise.id,
                                  )

                                  if (exerciseSets.length === 0) return null

                                  return (
                                    <div key={exercise.id} className="rounded-md border">
                                      <div className="border-b bg-muted/50 p-2">
                                        <div className="flex items-center justify-between">
                                          <div className="font-medium">{exercise.name}</div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addSet(exercise.id)}
                                            disabled={selectedWorkout.completed}
                                          >
                                            <Plus className="mr-1 h-3 w-3" />
                                            Add Set
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="p-2">
                                        <div className="grid grid-cols-12 gap-2 text-sm font-medium">
                                          <div className="col-span-1">#</div>
                                          <div className="col-span-3">Weight</div>
                                          <div className="col-span-3">Reps</div>
                                          <div className="col-span-5 text-right">Actions</div>
                                        </div>
                                        {exerciseSets.map((set, index) => (
                                          <div
                                            key={set.id}
                                            className={`mt-1 grid grid-cols-12 gap-2 rounded-sm p-1 text-sm ${
                                              set.completed ? "bg-muted/30" : ""
                                            }`}
                                          >
                                            <div className="col-span-1 flex items-center">{index + 1}</div>
                                            <div className="col-span-3">
                                              <Input
                                                type="number"
                                                min="0"
                                                value={set.weight}
                                                onChange={(e) =>
                                                  updateSet(selectedWorkout.id, set.id, {
                                                    weight: Number(e.target.value),
                                                  })
                                                }
                                                className="h-8"
                                                disabled={selectedWorkout.completed || set.completed}
                                              />
                                            </div>
                                            <div className="col-span-3">
                                              <Input
                                                type="number"
                                                min="0"
                                                value={set.reps}
                                                onChange={(e) =>
                                                  updateSet(selectedWorkout.id, set.id, {
                                                    reps: Number(e.target.value),
                                                  })
                                                }
                                                className="h-8"
                                                disabled={selectedWorkout.completed || set.completed}
                                              />
                                            </div>
                                            <div className="col-span-5 flex items-center justify-end gap-1">
                                              <Button
                                                variant={set.completed ? "outline" : "default"}
                                                size="sm"
                                                className="h-8"
                                                onClick={() =>
                                                  updateSet(selectedWorkout.id, set.id, { completed: !set.completed })
                                                }
                                                disabled={selectedWorkout.completed}
                                              >
                                                {set.completed ? "Undo" : "Complete"}
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => deleteSet(selectedWorkout.id, set.id)}
                                                disabled={selectedWorkout.completed}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t">
                    <div className="w-full">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-medium">Add Exercise</h3>
                        <Button variant="ghost" size="sm">
                          <List className="mr-2 h-3 w-3" />
                          View All
                        </Button>
                      </div>
                      <ScrollArea className="h-24">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                          {workoutHistory?.exercises?.map((exercise) => (
                            <Button
                              key={exercise.id}
                              variant="outline"
                              className="justify-start"
                              onClick={() => addSet(exercise.id)}
                              disabled={selectedWorkout.completed}
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              {exercise.name}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeView === "history" && (
          <Card>
            <CardHeader>
              <CardTitle>Workout History</CardTitle>
              <CardDescription>View your past workouts and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {!workoutHistory?.workouts || workoutHistory.workouts.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
                  <Dumbbell className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No workout history yet</p>
                  <p className="text-sm text-muted-foreground">Start tracking your workouts to build your history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...workoutHistory.workouts]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((workout) => (
                      <div key={workout.id} className="rounded-md border">
                        <div className="flex items-center justify-between border-b p-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{workout.name}</span>
                              {workout.completed && (
                                <Badge variant="outline" className="bg-green-500 text-white">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{getFormattedDate(workout.date)}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedWorkout(workout)
                                setSelectedDate(workout.date)
                                setActiveView("calendar")
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => deleteWorkout(workout.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="mb-2 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-md bg-muted p-2">
                              <div className="text-sm text-muted-foreground">Sets</div>
                              <div className="font-medium">{workout.sets?.length || 0}</div>
                            </div>
                            <div className="rounded-md bg-muted p-2">
                              <div className="text-sm text-muted-foreground">Exercises</div>
                              <div className="font-medium">
                                {workout.sets ? new Set(workout.sets.map((set) => set.exerciseId)).size : 0}
                              </div>
                            </div>
                            <div className="rounded-md bg-muted p-2">
                              <div className="text-sm text-muted-foreground">Duration</div>
                              <div className="font-medium">
                                {workout.duration ? formatTime(workout.duration) : "N/A"}
                              </div>
                            </div>
                          </div>

                          <div className="text-sm">
                            {workout.notes && (
                              <div className="mt-2 rounded-md bg-muted p-2">
                                <div className="font-medium">Notes:</div>
                                <div className="text-muted-foreground">{workout.notes}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeView === "stats" && (
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Track your overall progress and achievements</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Workouts</CardTitle>
                    <CardDescription>Number of workouts completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{workoutHistory?.stats?.totalWorkouts || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Sets</CardTitle>
                    <CardDescription>Number of sets performed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{workoutHistory?.stats?.totalSets || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Completed Workouts</CardTitle>
                    <CardDescription>Workouts marked as complete</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{workoutHistory?.stats?.totalCompletedWorkouts || 0}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Workout Streak</CardTitle>
                  <CardDescription>Your current workout streak</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <div>
                      <div className="text-3xl font-bold">{workoutHistory?.stats?.streak || 0} days</div>
                      <div className="text-sm text-muted-foreground">Keep up the good work!</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Last Workout</CardTitle>
                  <CardDescription>Date of your most recent workout</CardDescription>
                </CardHeader>
                <CardContent>
                  {workoutHistory?.stats?.lastWorkoutDate ? (
                    <>
                      <div className="text-xl font-bold">{getFormattedDate(workoutHistory.stats.lastWorkoutDate)}</div>
                      <div className="text-sm text-muted-foreground">Keep the momentum going!</div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">No workout recorded yet.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exercise Breakdown</CardTitle>
                  <CardDescription>Distribution of exercises by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.entries(exercisesByCategory).length === 0 ? (
                    <div className="text-muted-foreground">No exercises added yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(exercisesByCategory).map(([category, exercises]) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="font-medium">{category}</div>
                          <div className="text-sm text-muted-foreground">{exercises.length} exercises</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Add Workout Dialog */}
        <Dialog open={isAddWorkoutOpen} onOpenChange={setIsAddWorkoutOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Workout</DialogTitle>
              <DialogDescription>Create a new workout for your calendar</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="workout-name">Workout Name</Label>
                <Input
                  id="workout-name"
                  placeholder="e.g., Upper Body Strength"
                  value={newWorkout.name}
                  onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-date">Date</Label>
                <Input
                  id="workout-date"
                  type="date"
                  value={newWorkout.date}
                  onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workout-notes">Notes (Optional)</Label>
                <Textarea
                  id="workout-notes"
                  placeholder="Any notes about this workout..."
                  value={newWorkout.notes || ""}
                  onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                />
              </div>

              {/* Add recurring options to the workout form */}
              <div className="flex items-center justify-between">
                <Label htmlFor="isRecurring">Recurring Workout</Label>
                <Switch
                  id="isRecurring"
                  checked={newWorkout.isRecurring}
                  onCheckedChange={(checked) =>
                    setNewWorkout({
                      ...newWorkout,
                      isRecurring: checked,
                      recurringType: checked ? "weekly" : "none",
                    })
                  }
                />
              </div>

              {newWorkout.isRecurring && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="recurringType">Recurrence Pattern</Label>
                    <Select
                      value={newWorkout.recurringType}
                      onValueChange={(value) =>
                        setNewWorkout({
                          ...newWorkout,
                          recurringType: value as "daily" | "weekly" | "custom" | "none",
                        })
                      }
                    >
                      <SelectTrigger id="recurringType">
                        <SelectValue placeholder="Select recurrence pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newWorkout.recurringType === "weekly" && (
                    <div className="grid gap-2">
                      <Label>Days of Week</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                          <Button
                            key={day}
                            type="button"
                            variant={newWorkout.recurringDays?.includes(index) ? "default" : "outline"}
                            className="h-10 w-10 p-0"
                            onClick={() => {
                              const days = newWorkout.recurringDays || []
                              setNewWorkout({
                                ...newWorkout,
                                recurringDays: days.includes(index)
                                  ? days.filter((d) => d !== index)
                                  : [...days, index],
                              })
                            }}
                          >
                            {day.charAt(0)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {newWorkout.recurringType === "custom" && (
                    <div className="grid gap-2">
                      <Label htmlFor="recurringInterval">Repeat every</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="recurringInterval"
                          type="number"
                          min="1"
                          value={newWorkout.recurringInterval}
                          onChange={(e) =>
                            setNewWorkout({
                              ...newWorkout,
                              recurringInterval: Number.parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-20"
                        />
                        <span>days</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddWorkoutOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addWorkout}>Add Workout</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Workout Dialog */}
        <Dialog open={!!editingWorkout} onOpenChange={(open) => !open && setEditingWorkout(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Workout</DialogTitle>
              <DialogDescription>Update your workout details</DialogDescription>
            </DialogHeader>
            {editingWorkout && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-workout-name">Workout Name</Label>
                  <Input
                    id="edit-workout-name"
                    value={editingWorkout.name}
                    onChange={(e) => setEditingWorkout({ ...editingWorkout, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-workout-date">Date</Label>
                  <Input
                    id="edit-workout-date"
                    type="date"
                    value={editingWorkout.date}
                    onChange={(e) => setEditingWorkout({ ...editingWorkout, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-workout-notes">Notes (Optional)</Label>
                  <Textarea
                    id="edit-workout-notes"
                    placeholder="Any notes about this workout..."
                    value={editingWorkout.notes || ""}
                    onChange={(e) => setEditingWorkout({ ...editingWorkout, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingWorkout(null)}>
                Cancel
              </Button>
              <Button onClick={updateWorkout}>Update Workout</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Exercise Dialog */}
        <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Exercise</DialogTitle>
              <DialogDescription>Add a new exercise to your library</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="exercise-name">Exercise Name</Label>
                <Input
                  id="exercise-name"
                  placeholder="e.g., Dumbbell Curl"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exercise-category">Category</Label>
                <Select
                  value={newExercise.category}
                  onValueChange={(value) => setNewExercise({ ...newExercise, category: value })}
                >
                  <SelectTrigger id="exercise-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {exerciseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exercise-instructions">Instructions (Optional)</Label>
                <Textarea
                  id="exercise-instructions"
                  placeholder="How to perform this exercise..."
                  value={newExercise.instructions}
                  onChange={(e) => setNewExercise({ ...newExercise, instructions: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddExerciseOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addExercise}>Add Exercise</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  )
}
