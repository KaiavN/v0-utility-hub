"use client"

import { useState, useEffect, useRef } from "react"
import { AlarmClock, Plus, Trash2, Edit, RefreshCw, Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Update the interface to include recurring options
interface CountdownTimer {
  id: string
  title: string
  endDate: string
  description?: string
  color: string
  showSeconds: boolean
  playSound: boolean
  completed: boolean
  createdAt: string
  isRecurring: boolean
  recurringType: "daily" | "weekly" | "monthly" | "yearly" | "none"
  recurringInterval: number
  lastRecurred?: string
}

const colors = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-yellow-500", label: "Yellow" },
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-gray-500", label: "Gray" },
]

export default function CountdownPage() {
  const { toast } = useToast()
  const [timers, setTimers] = useState<CountdownTimer[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTimer, setEditingTimer] = useState<CountdownTimer | null>(null)
  // Update the initial state for new timers
  const [newTimer, setNewTimer] = useState<Omit<CountdownTimer, "id" | "createdAt" | "completed">>({
    title: "",
    endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: "",
    color: "bg-blue-500",
    showSeconds: true,
    playSound: true,
    isRecurring: false,
    recurringType: "none",
    recurringInterval: 1,
  })
  const [remainingTimes, setRemainingTimes] = useState<
    Record<string, { days: number; hours: number; minutes: number; seconds: number } | null>
  >({})
  const [activeTimer, setActiveTimer] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load timers from localStorage
  useEffect(() => {
    try {
      const savedTimers = getLocalStorage<CountdownTimer[]>("countdownTimers", [])
      // Ensure timers is always an array
      setTimers(Array.isArray(savedTimers) ? savedTimers : [])

      // Initialize audio element
      audioRef.current = new Audio("/alarm.mp3")
    } catch (error) {
      console.error("Error loading countdown timers:", error)
      // Fallback to empty array if there's an error
      setTimers([])
    }
  }, [])

  // Add a function to handle recurring timers
  const checkAndUpdateRecurringTimers = () => {
    if (!Array.isArray(timers)) {
      console.error("Cannot check recurring timers: timers is not an array")
      return
    }

    const now = new Date()
    let hasUpdates = false

    const updatedTimers = timers.map((timer) => {
      if (!timer.isRecurring || !timer.completed) return timer

      const lastRecurred = timer.lastRecurred ? new Date(timer.lastRecurred) : new Date(timer.endDate)
      const nextDate = new Date(lastRecurred)

      // Calculate next occurrence based on recurring type
      switch (timer.recurringType) {
        case "daily":
          nextDate.setDate(nextDate.getDate() + timer.recurringInterval)
          break
        case "weekly":
          nextDate.setDate(nextDate.getDate() + timer.recurringInterval * 7)
          break
        case "monthly":
          nextDate.setMonth(nextDate.getMonth() + timer.recurringInterval)
          break
        case "yearly":
          nextDate.setFullYear(nextDate.getFullYear() + timer.recurringInterval)
          break
        default:
          return timer
      }

      // If the next occurrence is in the future, don't update yet
      if (nextDate > now) return timer

      // Create a new occurrence
      hasUpdates = true
      return {
        ...timer,
        completed: false,
        endDate: nextDate.toISOString().split("T")[0],
        lastRecurred: now.toISOString(),
      }
    })

    if (hasUpdates) {
      saveTimers(updatedTimers)
    }
  }

  // Update remaining time for each timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()

      const updatedTimers = { ...remainingTimes }
      let shouldSave = false

      // Ensure timers is an array before iterating
      if (Array.isArray(timers)) {
        timers.forEach((timer) => {
          if (timer.completed) {
            updatedTimers[timer.id] = null
            return
          }

          const endDate = new Date(timer.endDate)
          const timeDiff = endDate.getTime() - now.getTime()

          if (timeDiff <= 0) {
            // Timer has ended
            if (!timer.completed) {
              if (timer.playSound && timer.id === activeTimer) {
                playAlarmSound()
              }

              // Mark timer as completed
              setTimers((prev) =>
                Array.isArray(prev) ? prev.map((t) => (t.id === timer.id ? { ...t, completed: true } : t)) : [],
              )
              shouldSave = true

              toast({
                title: "Event timer completed",
                description: `${timer.title} has ended!`,
              })
            }

            updatedTimers[timer.id] = null
          } else {
            // Calculate remaining time
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

            updatedTimers[timer.id] = { days, hours, minutes, seconds }
          }
        })
      }

      setRemainingTimes(updatedTimers)

      if (shouldSave) {
        saveTimers(timers)
        // Check for recurring timers that need to be updated
        checkAndUpdateRecurringTimers()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timers, activeTimer])

  const saveTimers = (updatedTimers: CountdownTimer[]) => {
    // Ensure we're saving a valid array
    if (!Array.isArray(updatedTimers)) {
      console.error("Attempted to save invalid timers data:", updatedTimers)
      return
    }

    setTimers(updatedTimers)
    setLocalStorage("countdownTimers", updatedTimers)
  }

  const addTimer = () => {
    if (!newTimer.title) {
      toast({
        title: "Title required",
        description: "Please provide a title for your countdown.",
        variant: "destructive",
      })
      return
    }

    const now = new Date()
    const endDate = new Date(newTimer.endDate)

    if (endDate <= now) {
      toast({
        title: "Invalid date",
        description: "The end date must be in the future.",
        variant: "destructive",
      })
      return
    }

    const timer: CountdownTimer = {
      ...newTimer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completed: false,
    }

    const updatedTimers = [...timers, timer]
    saveTimers(updatedTimers)

    // Reset form
    setNewTimer({
      title: "",
      endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      description: "",
      color: "bg-blue-500",
      showSeconds: true,
      playSound: true,
      isRecurring: false,
      recurringType: "none",
      recurringInterval: 1,
    })

    setIsAddDialogOpen(false)

    toast({
      title: "Countdown added",
      description: "Your countdown timer has been created.",
    })
  }

  const updateTimer = () => {
    if (!editingTimer) return

    if (!editingTimer.title) {
      toast({
        title: "Title required",
        description: "Please provide a title for your countdown.",
        variant: "destructive",
      })
      return
    }

    const now = new Date()
    const endDate = new Date(editingTimer.endDate)

    if (endDate <= now && !editingTimer.completed) {
      toast({
        title: "Invalid date",
        description: "The end date must be in the future.",
        variant: "destructive",
      })
      return
    }

    const updatedTimers = timers.map((timer) => (timer.id === editingTimer.id ? editingTimer : timer))
    saveTimers(updatedTimers)

    setEditingTimer(null)

    toast({
      title: "Countdown updated",
      description: "Your countdown timer has been updated.",
    })
  }

  const deleteTimer = (id: string) => {
    const updatedTimers = timers.filter((timer) => timer.id !== id)
    saveTimers(updatedTimers)

    toast({
      title: "Countdown deleted",
      description: "Your countdown timer has been deleted.",
    })
  }

  const resetTimer = (id: string) => {
    const timer = timers.find((t) => t.id === id)
    if (!timer) return

    const updatedTimers = timers.map((t) => (t.id === id ? { ...t, completed: false } : t))
    saveTimers(updatedTimers)

    toast({
      title: "Countdown reset",
      description: "Your countdown timer has been reset.",
    })
  }

  const playAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((error) => {
        console.error("Error playing sound:", error)
      })
    }
  }

  const formatTime = (timer: CountdownTimer) => {
    const remaining = remainingTimes[timer.id]

    if (!remaining) {
      return "Completed!"
    }

    const { days, hours, minutes, seconds } = remaining

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m${timer.showSeconds ? ` ${seconds}s` : ""}`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m${timer.showSeconds ? ` ${seconds}s` : ""}`
    } else {
      return `${minutes}m ${timer.showSeconds ? `${seconds}s` : ""}`
    }
  }

  const formatLongTime = (timer: CountdownTimer) => {
    const remaining = remainingTimes[timer.id]

    if (!remaining) {
      return "Countdown completed!"
    }

    const { days, hours, minutes, seconds } = remaining
    let timeString = ""

    if (days > 0) {
      timeString += `${days} day${days !== 1 ? "s" : ""}, `
    }

    if (hours > 0 || days > 0) {
      timeString += `${hours} hour${hours !== 1 ? "s" : ""}, `
    }

    if (minutes > 0 || hours > 0 || days > 0) {
      timeString += `${minutes} minute${minutes !== 1 ? "s" : ""}`
    }

    if (timer.showSeconds && seconds > 0) {
      if (minutes > 0 || hours > 0 || days > 0) {
        timeString += ` and ${seconds} second${seconds !== 1 ? "s" : ""}`
      } else {
        timeString += `${seconds} second${seconds !== 1 ? "s" : ""}`
      }
    }

    return timeString
  }

  const calculateProgress = (timer: CountdownTimer) => {
    if (timer.completed) return 100

    const now = new Date()
    const endDate = new Date(timer.endDate)
    const createdDate = new Date(timer.createdAt)

    const totalDuration = endDate.getTime() - createdDate.getTime()
    const elapsed = now.getTime() - createdDate.getTime()

    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  }

  // Sort timers: first by completed status, then by end date
  const sortedTimers = Array.isArray(timers)
    ? [...timers].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1
        }
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      })
    : []

  // Update the page title and description
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Timers</h1>
          <p className="text-muted-foreground">Track important dates, deadlines, and recurring events</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event Timer
          </Button>
        </div>
      </div>

      {timers.length === 0 ? (
        <Card className="flex h-60 flex-col items-center justify-center text-center">
          <AlarmClock className="mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">No Countdowns Yet</h2>
          <p className="mb-6 text-muted-foreground">
            Create your first countdown timer to start tracking important dates.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Countdown
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTimers.map((timer) => (
            <Card
              key={timer.id}
              className={`${timer.completed ? "border-dashed opacity-70" : "border-solid"} relative overflow-hidden transition-all hover:shadow-md`}
              onClick={() => setActiveTimer(timer.id)}
            >
              <div
                className={`absolute left-0 top-0 h-1 transition-all ${timer.color}`}
                style={{ width: `${calculateProgress(timer)}%` }}
              />
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="flex items-center">{timer.title}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingTimer(timer)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTimer(timer.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {timer.description && <CardDescription>{timer.description}</CardDescription>}
              </CardHeader>
              <CardContent className="py-2">
                <div className="mb-2 flex items-end gap-2">
                  <span className={`text-4xl font-bold tabular-nums ${timer.completed ? "text-muted-foreground" : ""}`}>
                    {formatTime(timer)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {timer.completed ? (
                    <span>Event date: {new Date(timer.endDate).toLocaleDateString()}</span>
                  ) : (
                    <>
                      <span>Until: </span>
                      <span className="font-medium">{new Date(timer.endDate).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                {timer.completed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      resetTimer(timer.id)
                    }}
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Reset
                  </Button>
                ) : (
                  <div className="text-sm text-muted-foreground">{formatLongTime(timer)}</div>
                )}
                <div className="flex items-center">
                  {timer.playSound ? (
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <BellOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Timer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Countdown Timer</DialogTitle>
            <DialogDescription>Create a new countdown to track important dates.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTimer.title}
                onChange={(e) => setNewTimer({ ...newTimer, title: e.target.value })}
                placeholder="e.g., Birthday, Anniversary, Deadline"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">End Date</Label>
              <Input
                id="date"
                type="date"
                value={newTimer.endDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setNewTimer({ ...newTimer, endDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newTimer.description}
                onChange={(e) => setNewTimer({ ...newTimer, description: e.target.value })}
                placeholder="Add more details about this countdown"
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <div
                    key={color.value}
                    className={`h-8 w-8 cursor-pointer rounded-full ${color.value} ${
                      newTimer.color === color.value ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    onClick={() => setNewTimer({ ...newTimer, color: color.value })}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showSeconds">Show Seconds</Label>
              <Switch
                id="showSeconds"
                checked={newTimer.showSeconds}
                onCheckedChange={(checked) => setNewTimer({ ...newTimer, showSeconds: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="playSound">Play Sound on Completion</Label>
              <Switch
                id="playSound"
                checked={newTimer.playSound}
                onCheckedChange={(checked) => setNewTimer({ ...newTimer, playSound: checked })}
              />
            </div>
            {/* Add recurring options to the add/edit dialog forms */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isRecurring">Recurring Event</Label>
              <Switch
                id="isRecurring"
                checked={newTimer.isRecurring}
                onCheckedChange={(checked) =>
                  setNewTimer({
                    ...newTimer,
                    isRecurring: checked,
                    recurringType: checked ? "daily" : "none",
                  })
                }
              />
            </div>

            {newTimer.isRecurring && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="recurringType">Recurrence Pattern</Label>
                  <Select
                    value={newTimer.recurringType}
                    onValueChange={(value) =>
                      setNewTimer({
                        ...newTimer,
                        recurringType: value as "daily" | "weekly" | "monthly" | "yearly" | "none",
                      })
                    }
                  >
                    <SelectTrigger id="recurringType">
                      <SelectValue placeholder="Select recurrence pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="recurringInterval">Repeat every</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="recurringInterval"
                      type="number"
                      min="1"
                      value={newTimer.recurringInterval}
                      onChange={(e) =>
                        setNewTimer({
                          ...newTimer,
                          recurringInterval: Number.parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-20"
                    />
                    <span>
                      {newTimer.recurringType === "daily"
                        ? "days"
                        : newTimer.recurringType === "weekly"
                          ? "weeks"
                          : newTimer.recurringType === "monthly"
                            ? "months"
                            : "years"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addTimer}>Add Countdown</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Timer Dialog */}
      <Dialog open={!!editingTimer} onOpenChange={(open) => !open && setEditingTimer(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Countdown Timer</DialogTitle>
            <DialogDescription>Update your countdown timer details.</DialogDescription>
          </DialogHeader>
          {editingTimer && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTimer.title}
                  onChange={(e) => setEditingTimer({ ...editingTimer, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">End Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editingTimer.endDate}
                  onChange={(e) => setEditingTimer({ ...editingTimer, endDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Input
                  id="edit-description"
                  value={editingTimer.description}
                  onChange={(e) => setEditingTimer({ ...editingTimer, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <div
                      key={color.value}
                      className={`h-8 w-8 cursor-pointer rounded-full ${color.value} ${
                        editingTimer.color === color.value ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      onClick={() => setEditingTimer({ ...editingTimer, color: color.value })}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-showSeconds">Show Seconds</Label>
                <Switch
                  id="edit-showSeconds"
                  checked={editingTimer.showSeconds}
                  onCheckedChange={(checked) => setEditingTimer({ ...editingTimer, showSeconds: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-playSound">Play Sound on Completion</Label>
                <Switch
                  id="edit-playSound"
                  checked={editingTimer.playSound}
                  onCheckedChange={(checked) => setEditingTimer({ ...editingTimer, playSound: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-completed">Mark as Completed</Label>
                <Switch
                  id="edit-completed"
                  checked={editingTimer.completed}
                  onCheckedChange={(checked) => setEditingTimer({ ...editingTimer, completed: checked })}
                />
              </div>
              {/* Add similar recurring options to the edit dialog as well */}
              <div className="flex items-center justify-between">
                <Label htmlFor="isRecurring">Recurring Event</Label>
                <Switch
                  id="isRecurring"
                  checked={editingTimer.isRecurring}
                  onCheckedChange={(checked) =>
                    setEditingTimer({
                      ...editingTimer,
                      isRecurring: checked,
                      recurringType: checked ? "daily" : "none",
                    })
                  }
                />
              </div>

              {editingTimer.isRecurring && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="recurringType">Recurrence Pattern</Label>
                    <Select
                      value={editingTimer.recurringType}
                      onValueChange={(value) =>
                        setEditingTimer({
                          ...editingTimer,
                          recurringType: value as "daily" | "weekly" | "monthly" | "yearly" | "none",
                        })
                      }
                    >
                      <SelectTrigger id="recurringType">
                        <SelectValue placeholder="Select recurrence pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recurringInterval">Repeat every</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="recurringInterval"
                        type="number"
                        min="1"
                        value={editingTimer.recurringInterval}
                        onChange={(e) =>
                          setEditingTimer({
                            ...editingTimer,
                            recurringInterval: Number.parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-20"
                      />
                      <span>
                        {editingTimer.recurringType === "daily"
                          ? "days"
                          : editingTimer.recurringType === "weekly"
                            ? "weeks"
                            : editingTimer.recurringType === "monthly"
                              ? "months"
                              : "years"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTimer(null)}>
              Cancel
            </Button>
            <Button onClick={updateTimer}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
