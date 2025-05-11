"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Task, Project, Section } from "@/lib/gantt-types"
import { LinkItemDialog } from "@/components/linked-items/link-item-dialog"
import { LinkedItemsList } from "@/components/linked-items/linked-items-list"

interface CalendarViewProps {
  tasks: Task[]
  projects: Project[]
  sections: Section[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
  onSelectTask: (taskId: string) => void
  onAddTask: (date: Date) => void
  isMobile?: boolean
}

export function CalendarView({
  tasks,
  projects,
  sections,
  selectedDate,
  onSelectDate,
  onSelectTask,
  onAddTask,
  isMobile = false,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate))
  const [selectedDay, setSelectedDay] = useState<Date | null>(selectedDate)
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([])

  // Update calendar when selected date changes
  useEffect(() => {
    setCurrentMonth(startOfMonth(selectedDate))
    setSelectedDay(selectedDate)
  }, [selectedDate])

  // Update selected day tasks when day or tasks change
  useEffect(() => {
    if (selectedDay) {
      const tasksForDay = tasks.filter((task) => {
        const taskStart = new Date(task.start)
        const taskEnd = new Date(task.end)
        return (
          isSameDay(selectedDay, taskStart) ||
          isSameDay(selectedDay, taskEnd) ||
          (selectedDay >= taskStart && selectedDay <= taskEnd)
        )
      })
      setSelectedDayTasks(tasksForDay)
    }
  }, [selectedDay, tasks])

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      newMonth.setMonth(newMonth.getMonth() - 1)
      return startOfMonth(newMonth)
    })
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      newMonth.setMonth(newMonth.getMonth() + 1)
      return startOfMonth(newMonth)
    })
  }

  // Navigate to today
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(startOfMonth(today))
    setSelectedDay(today)
    onSelectDate(today)
  }

  // Handle day selection
  const handleSelectDay = (day: Date) => {
    setSelectedDay(day)
    onSelectDate(day)
  }

  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      const taskStart = new Date(task.start)
      const taskEnd = new Date(task.end)
      return isSameDay(day, taskStart) || isSameDay(day, taskEnd) || (day >= taskStart && day <= taskEnd)
    })
  }

  // Get project color for a task
  const getTaskColor = (task: Task) => {
    if (task.sectionId) {
      const section = sections.find((s) => s.id === task.sectionId)
      return section?.color || "#6366f1"
    }
    if (task.projectId) {
      const project = projects.find((p) => p.id === task.projectId)
      return project?.color || "#6366f1"
    }
    return "#6366f1" // Default color
  }

  // Get days of current month
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // Get day names for header
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          {selectedDay && (
            <Button size="sm" onClick={() => onAddTask(selectedDay)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center font-medium text-sm py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day) => {
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isCurrentDay = isToday(day)
          const dayTasks = getTasksForDay(day)

          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-[80px] p-1 border rounded-md cursor-pointer transition-colors",
                isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted/50",
                !isCurrentMonth && "opacity-40",
                isCurrentDay && "bg-red-100 dark:bg-red-900/30",
              )}
              onClick={() => handleSelectDay(day)}
            >
              <div className="flex justify-between items-start">
                <span className={cn("text-sm font-medium", isCurrentDay && "text-red-600 dark:text-red-400")}>
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {dayTasks.length}
                  </Badge>
                )}
              </div>
              <div className="mt-1 space-y-1 overflow-hidden max-h-[60px]">
                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="text-xs p-1 rounded truncate"
                    style={{ backgroundColor: `${getTaskColor(task)}20` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectTask(task.id)
                    }}
                  >
                    {task.name}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-xs text-muted-foreground text-center">+{dayTasks.length - 2} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDay && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{format(selectedDay, "EEEE, MMMM d, yyyy")}</span>
              <Button size="sm" onClick={() => onAddTask(selectedDay)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No tasks scheduled for this day</p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {selectedDayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-2 border rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => onSelectTask(task.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: getTaskColor(task) }}
                          ></div>
                          <span className="font-medium">{task.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {task.status}
                          </Badge>
                          <LinkItemDialog
                            sourceId={task.id}
                            sourceType="ganttTask"
                            trigger={
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Plus className="h-3 w-3" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{task.description}</p>
                      )}
                      <div className="mt-2">
                        <LinkedItemsList sourceId={task.id} sourceType="ganttTask" showEmpty={false} maxItems={2} />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
