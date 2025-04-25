"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { format, addDays, differenceInDays, isSameDay, subDays } from "date-fns"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface GanttChartProps {
  tasks: {
    id: string
    name: string
    startDate: Date
    endDate: Date
    progress: number
    color?: string
    projectId?: string
  }[]
  zoomLevel: number
  projects?: { id: string; name: string; color: string }[]
  onTaskClick?: (taskId: string) => void
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks, zoomLevel, projects = [], onTaskClick }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleDates, setVisibleDates] = useState<Date[]>([])

  // Find date range for all tasks
  const allDates = tasks.flatMap((task) => [new Date(task.startDate), new Date(task.endDate)])

  // Default to today if no tasks
  const today = new Date()

  // Calculate min and max dates with constraints (30 days before and after today)
  const minDate =
    allDates.length > 0
      ? new Date(Math.max(Math.min(...allDates.map((d) => d.getTime())), subDays(today, 30).getTime()))
      : subDays(today, 30)

  const maxDate =
    allDates.length > 0
      ? new Date(Math.min(Math.max(...allDates.map((d) => d.getTime())), addDays(today, 30).getTime()))
      : addDays(today, 30)

  // Calculate number of days to display
  const totalDays = differenceInDays(maxDate, minDate) + 7 // Add buffer

  // Calculate dimensions based on zoom level
  const dayWidth = 30 + zoomLevel / 2 // Scale day width based on zoom level
  const chartWidth = totalDays * dayWidth
  const rowHeight = 60

  // Generate dates for the header
  useEffect(() => {
    const dates = Array.from({ length: totalDays }, (_, i) => addDays(minDate, i))
    setVisibleDates(dates)
  }, [minDate, totalDays])

  // Get project color for a task
  const getTaskColor = (task: GanttChartProps["tasks"][0]) => {
    if (task.color) return task.color
    if (task.projectId) {
      const project = projects.find((p) => p.id === task.projectId)
      if (project) return project.color
    }
    return "#6366f1" // Default color
  }

  useEffect(() => {
    // If we have tasks, scroll to show current day
    if (containerRef.current) {
      const today = new Date()
      const daysSinceStart = differenceInDays(today, minDate)
      if (daysSinceStart > 0 && daysSinceStart < totalDays) {
        containerRef.current.scrollLeft = daysSinceStart * dayWidth - 200 // Position today in view
      }
    }
  }, [tasks, minDate, dayWidth, totalDays])

  return (
    <Card className="border rounded-lg overflow-hidden">
      <ScrollArea ref={containerRef} className="h-[calc(100vh-260px)]">
        <div style={{ width: `${chartWidth}px`, minWidth: "100%" }}>
          {/* Header with dates */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="flex h-10">
              <div className="flex-shrink-0 w-48 border-r bg-muted/30 px-4 flex items-center font-medium">Task</div>
              {visibleDates.map((date, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-shrink-0 border-r px-2 flex flex-col justify-center items-center text-xs",
                    isSameDay(date, today) ? "bg-primary/10" : i % 2 === 0 ? "bg-muted/20" : "",
                  )}
                  style={{ width: `${dayWidth}px` }}
                >
                  <div className="font-medium">{format(date, "MMM")}</div>
                  <div>{format(date, "d")}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div>
            {tasks.map((task, index) => {
              const taskStart = new Date(task.startDate)
              const taskEnd = new Date(task.endDate)
              const taskColor = getTaskColor(task)

              // Calculate task position
              const startOffset = Math.max(0, differenceInDays(taskStart, minDate))
              const taskDuration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1)

              return (
                <div key={task.id} className={cn("flex h-14 border-b", index % 2 === 0 ? "bg-muted/5" : "")}>
                  {/* Task name column */}
                  <div className="flex-shrink-0 w-48 border-r px-4 flex items-center truncate">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: taskColor }}></div>
                    <span className="truncate font-medium">{task.name}</span>
                  </div>

                  {/* Timeline area */}
                  <div className="relative flex-grow h-full">
                    {/* Task bar */}
                    <div
                      className="absolute top-3 h-8 rounded-md cursor-pointer shadow-sm transition-all hover:brightness-95 flex items-center px-2"
                      style={{
                        left: `${startOffset * dayWidth}px`,
                        width: `${taskDuration * dayWidth}px`,
                        backgroundColor: taskColor,
                        opacity: 0.85,
                      }}
                      onClick={() => onTaskClick && onTaskClick(task.id)}
                    >
                      <div className="text-white text-xs truncate">{task.name}</div>

                      {/* Progress indicator */}
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-md"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}

            {tasks.length === 0 && (
              <div className="flex flex-col justify-center items-center h-32 text-muted-foreground">
                <p>No tasks to display</p>
                <p className="text-sm mt-1">Add projects and tasks to get started</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </Card>
  )
}

export default GanttChart
