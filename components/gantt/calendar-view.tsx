"use client"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, isSameDay, startOfMonth, endOfMonth, getDay, getDaysInMonth } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import * as React from "react"
import type { Task, Project, Section } from "@/lib/gantt-types"
import { cn } from "@/lib/utils"

interface CalendarViewProps {
  tasks: Task[]
  projects: Project[]
  sections: Section[]
  selectedDate: Date
  onSelectTask: (taskId: string) => void
  onSelectDate: (date: Date) => void
}

export function CalendarView({
  tasks,
  projects,
  sections,
  selectedDate,
  onSelectTask,
  onSelectDate,
}: CalendarViewProps) {
  const [open, setOpen] = React.useState(false)

  const handleDateSelect = (date: Date) => {
    onSelectDate(date)
    setOpen(false)
  }

  const handleTaskSelect = (taskId: string) => {
    onSelectTask(taskId)
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      const taskStart = new Date(task.start)
      const taskEnd = new Date(task.end)

      // A task is considered active on a date if the date falls between start and end dates (inclusive)
      return date >= taskStart && date <= taskEnd
    })
  }

  // Get project and section names for a task
  const getTaskContext = (task: Task) => {
    let context = ""

    if (task.projectId) {
      const project = projects.find((p) => p.id === task.projectId)
      if (project) context += project.name
    }

    if (task.sectionId) {
      const section = sections.find((s) => s.id === task.sectionId)
      if (section) context += ` / ${section.name}`
    }

    return context || "Unassigned"
  }

  // Get project or section color for a task
  const getTaskColor = (task: Task) => {
    if (task.color) return task.color

    if (task.sectionId) {
      const section = sections.find((s) => s.id === task.sectionId)
      if (section) return section.color
    }

    if (task.projectId) {
      const project = projects.find((p) => p.id === task.projectId)
      if (project) return project.color
    }

    return "#6366f1" // Default color
  }

  // Generate calendar grid data
  const generateCalendarGrid = () => {
    const currentMonth = selectedDate.getMonth()
    const currentYear = selectedDate.getFullYear()

    const firstDayOfMonth = startOfMonth(new Date(currentYear, currentMonth))
    const lastDayOfMonth = endOfMonth(new Date(currentYear, currentMonth))
    const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth))
    const startingDayOfWeek = getDay(firstDayOfMonth)

    // Create calendar grid with empty cells for days before the first of the month
    const calendarGrid = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarGrid.push(null)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarGrid.push(new Date(currentYear, currentMonth, day))
    }

    return calendarGrid
  }

  // Group tasks by date for the current month
  const getTasksByDate = () => {
    const currentMonth = selectedDate.getMonth()
    const currentYear = selectedDate.getFullYear()

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const tasksByDate: Record<string, Task[]> = {}

    // Initialize all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      tasksByDate[format(date, "yyyy-MM-dd")] = []
    }

    // Add tasks to their respective dates
    tasks.forEach((task) => {
      const taskStart = new Date(task.start)
      const taskEnd = new Date(task.end)

      // Only consider tasks that overlap with the current month
      if (
        (taskStart.getMonth() <= currentMonth && taskStart.getFullYear() <= currentYear) ||
        (taskEnd.getMonth() >= currentMonth && taskEnd.getFullYear() >= currentYear)
      ) {
        // For each day the task spans
        let currentDate = new Date(Math.max(taskStart.getTime(), new Date(currentYear, currentMonth, 1).getTime()))

        const endOfMonth = new Date(currentYear, currentMonth + 1, 0)
        const taskEndDate = new Date(Math.min(taskEnd.getTime(), endOfMonth.getTime()))

        while (currentDate <= taskEndDate) {
          const dateKey = format(currentDate, "yyyy-MM-dd")
          if (tasksByDate[dateKey]) {
            tasksByDate[dateKey].push(task)
          }

          currentDate = new Date(currentDate)
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    })

    return tasksByDate
  }

  const calendarGrid = generateCalendarGrid()
  const tasksByDate = getTasksByDate()
  const tasksForSelectedDate = getTasksForDate(selectedDate)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Calendar</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setMonth(newDate.getMonth() - 1)
                onSelectDate(newDate)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[150px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>{format(selectedDate, "MMMM yyyy")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && handleDateSelect(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setMonth(newDate.getMonth() + 1)
                onSelectDate(newDate)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1 font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square p-1 border rounded-md bg-muted/20"></div>
              }

              const dateStr = format(date, "yyyy-MM-dd")
              const dateTasks = tasksByDate[dateStr] || []
              const dayOfMonth = date.getDate()

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "aspect-square p-1 border rounded-md hover:bg-muted/50 cursor-pointer",
                    isSameDay(date, selectedDate) && "bg-primary/10 border-primary",
                    dateTasks.length > 0 && "border-primary/30",
                  )}
                  onClick={() => onSelectDate(date)}
                >
                  <div className="text-right mb-1">{dayOfMonth}</div>
                  {dateTasks.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dateTasks.slice(0, 3).map((task) => (
                        <div
                          key={`${dateStr}-${task.id}`}
                          className="w-full h-1.5 rounded-full"
                          style={{ backgroundColor: getTaskColor(task) }}
                        />
                      ))}
                      {dateTasks.length > 3 && (
                        <div className="text-xs text-center w-full text-muted-foreground">
                          +{dateTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tasks for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {tasksForSelectedDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No tasks scheduled for this day</p>
                <p className="text-xs mt-2">Add tasks to see them here</p>
              </div>
            ) : (
              <div className="divide-y">
                {tasksForSelectedDate.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleTaskSelect(task.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTaskColor(task) }} />
                      <h3 className="font-medium">{task.name}</h3>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{getTaskContext(task)}</div>
                    <div className="flex items-center justify-between text-xs">
                      <Badge
                        variant="outline"
                        className={cn(
                          task.status === "done" && "bg-green-500/10 text-green-700 border-green-300",
                          task.status === "in-progress" && "bg-blue-500/10 text-blue-700 border-blue-300",
                          task.status === "review" && "bg-yellow-500/10 text-yellow-700 border-yellow-300",
                          task.status === "todo" && "bg-gray-500/10 text-gray-700 border-gray-300",
                        )}
                      >
                        {task.status.replace("-", " ")}
                      </Badge>
                      <span>{task.progress}% complete</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
