"use client"

import type React from "react"

import { useRef, useState, useEffect, useMemo } from "react"
import {
  format,
  addDays,
  differenceInDays,
  eachDayOfInterval,
  isWeekend,
  isSameMonth,
  isToday,
  subDays,
} from "date-fns"
import type { Task, Link, Project, Section } from "@/lib/gantt-types"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface GanttViewProps {
  tasks: Task[]
  links: Link[]
  projects: Project[]
  sections: Section[]
  zoomLevel: number
  selectedTask: string | null
  onSelectTask: (taskId: string | null) => void
  onUpdateTask: (task: Partial<Task>) => void
  onUpdateTaskDates: (taskId: string, start: Date, end: Date) => void
}

export function GanttView({
  tasks,
  links,
  projects,
  sections,
  zoomLevel,
  selectedTask,
  onSelectTask,
  onUpdateTask,
  onUpdateTaskDates,
}: GanttViewProps) {
  // Force re-render when tasks change
  const [renderKey, setRenderKey] = useState(0)

  // Add a useEffect that helps detect changes in the tasks prop
  useEffect(() => {
    console.log("Tasks updated in GanttView:", tasks?.length || 0)
    setRenderKey((prev) => prev + 1)
  }, [tasks])

  const [currentDate, setCurrentDate] = useState(new Date())
  const [draggingTask, setDraggingTask] = useState<string | null>(null)
  const [draggingType, setDraggingType] = useState<"move" | "resize-left" | "resize-right" | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null)
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const ganttRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Calculate the date range to display - exactly 30 days before and after today
  const today = new Date()
  const startDate = subDays(today, 30)
  const endDate = addDays(today, 30)

  // Generate all days in the range
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Calculate the width of each day based on zoom level
  // Adjust to make the chart fit better in the viewport
  const dayWidth = Math.max(24, Math.round(35 * (zoomLevel / 100)))

  // Calculate the total width of the timeline
  const timelineWidth = days.length * dayWidth

  // Scroll to today when component mounts
  useEffect(() => {
    if (timelineRef.current) {
      const todayIndex = days.findIndex((day) => isToday(day))
      if (todayIndex !== -1) {
        const todayPosition = todayIndex * dayWidth
        const containerWidth = timelineRef.current.clientWidth

        // Center today in the viewport
        timelineRef.current.scrollLeft = todayPosition - containerWidth / 2 + dayWidth / 2
      }
    }
  }, [days, dayWidth])

  // Navigate through time
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())

    // Scroll to today
    if (timelineRef.current) {
      const todayIndex = days.findIndex((day) => isToday(day))
      if (todayIndex !== -1) {
        const todayPosition = todayIndex * dayWidth
        const containerWidth = timelineRef.current.clientWidth

        // Center today in the viewport with smooth scrolling
        timelineRef.current.scrollTo({
          left: todayPosition - containerWidth / 2 + dayWidth / 2,
          behavior: "smooth",
        })
      }
    }
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

  // Group tasks by project and section - use useMemo to optimize
  const groupedTasks = useMemo(() => {
    // Ensure tasks is an array
    if (!Array.isArray(tasks)) {
      console.error("Tasks is not an array:", tasks)
      return {}
    }

    console.log("Recalculating groupedTasks with", tasks.length, "tasks")

    // Debug the first task if available
    if (tasks.length > 0) {
      console.log("First task:", tasks[0])
    }

    // Create a simple grouped structure
    const grouped = {}

    // Group tasks by project
    tasks.forEach((task) => {
      if (!task) return // Skip if task is undefined

      const projectId = task.projectId || "ungrouped"

      if (!grouped[projectId]) {
        grouped[projectId] = {
          tasks: [],
          sections: {},
        }
      }

      // If task has a section, group it under that section
      if (task.sectionId) {
        if (!grouped[projectId].sections[task.sectionId]) {
          grouped[projectId].sections[task.sectionId] = {
            tasks: [],
          }
        }
        grouped[projectId].sections[task.sectionId].tasks.push(task)
      } else {
        // Otherwise, add it to the project's direct tasks
        grouped[projectId].tasks.push(task)
      }
    })

    // Add project and section objects
    Object.keys(grouped).forEach((projectId) => {
      if (projectId !== "ungrouped") {
        const project = projects.find((p) => p.id === projectId)
        if (project) {
          grouped[projectId].project = project
        }
      }

      // Add section objects
      Object.keys(grouped[projectId].sections).forEach((sectionId) => {
        const section = sections.find((s) => s.id === sectionId)
        if (section) {
          grouped[projectId].sections[sectionId].section = section
        }
      })
    })

    console.log("Grouped tasks:", grouped)
    return grouped
  }, [tasks, projects, sections, renderKey])

  // Handle task bar dragging
  const handleTaskMouseDown = (e: React.MouseEvent, taskId: string, type: "move" | "resize-left" | "resize-right") => {
    e.preventDefault()
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    setDraggingTask(taskId)
    setDraggingType(type)
    setDragStartX(e.clientX)
    setDragStartDate(new Date(task.start))
    setDragEndDate(new Date(task.end))

    // Add event listeners for mouse move and mouse up
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingTask || !dragStartDate || !dragEndDate || !ganttRef.current) return

    const task = tasks.find((t) => t.id === draggingTask)
    if (!task) return

    // Calculate the difference in pixels
    const diffX = e.clientX - dragStartX

    // Convert pixels to days
    const diffDays = Math.round(diffX / dayWidth)

    // Calculate new dates based on dragging type
    let newStart = new Date(dragStartDate)
    let newEnd = new Date(dragEndDate)

    if (draggingType === "move") {
      newStart = addDays(dragStartDate, diffDays)
      newEnd = addDays(dragEndDate, diffDays)
    } else if (draggingType === "resize-left") {
      newStart = addDays(dragStartDate, diffDays)
      // Ensure start date is not after end date
      if (newStart > newEnd) {
        newStart = new Date(newEnd)
      }
    } else if (draggingType === "resize-right") {
      newEnd = addDays(dragEndDate, diffDays)
      // Ensure end date is not before start date
      if (newEnd < newStart) {
        newEnd = new Date(newStart)
      }
    }

    // Update the task dates in the UI (actual update happens on mouse up)
    const taskElement = document.getElementById(`task-${draggingTask}`)
    if (taskElement) {
      const startDiff = differenceInDays(newStart, startDate)
      const duration = differenceInDays(newEnd, newStart) + 1

      taskElement.style.left = `${startDiff * dayWidth}px`
      taskElement.style.width = `${duration * dayWidth}px`
    }
  }

  const handleMouseUp = () => {
    if (draggingTask && dragStartDate && dragEndDate) {
      const task = tasks.find((t) => t.id === draggingTask)
      if (task) {
        // Calculate the difference in pixels
        const taskElement = document.getElementById(`task-${draggingTask}`)
        if (taskElement) {
          const left = Number.parseInt(taskElement.style.left, 10) || 0
          const width = Number.parseInt(taskElement.style.width, 10) || 0

          // Convert pixels to days
          const startDiff = Math.round(left / dayWidth)
          const duration = Math.round(width / dayWidth)

          // Calculate new dates
          const newStart = addDays(startDate, startDiff)
          const newEnd = addDays(newStart, duration - 1)

          // Update the task
          onUpdateTaskDates(draggingTask, newStart, newEnd)
        }
      }
    }

    // Clean up
    setDraggingTask(null)
    setDraggingType(null)
    setDragStartX(0)
    setDragStartDate(null)
    setDragEndDate(null)

    // Remove event listeners
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  // Render dependency lines
  const renderDependencyLines = () => {
    if (!links || !Array.isArray(links)) return null

    return links.map((link) => {
      if (!link) return null

      const sourceTask = tasks.find((t) => t.id === link.source)
      const targetTask = tasks.find((t) => t.id === link.target)

      if (!sourceTask || !targetTask) return null

      // Calculate positions
      const sourceStartDiff = differenceInDays(new Date(sourceTask.start), startDate)
      const sourceEndDiff = differenceInDays(new Date(sourceTask.end), startDate)
      const targetStartDiff = differenceInDays(new Date(targetTask.start), startDate)

      // Find the vertical positions of tasks
      let sourceY = 0
      let targetY = 0
      let rowIndex = 0

      // Iterate through grouped tasks to find vertical positions
      Object.values(groupedTasks).forEach((projectGroup) => {
        if (!projectGroup || !projectGroup.tasks) return

        // Check project tasks
        projectGroup.tasks.forEach((task) => {
          if (task.id === sourceTask.id) sourceY = rowIndex * 40 + 20
          if (task.id === targetTask.id) targetY = rowIndex * 40 + 20
          rowIndex++
        })

        // Check section tasks
        if (projectGroup.sections) {
          Object.values(projectGroup.sections).forEach((sectionGroup) => {
            if (!sectionGroup || !sectionGroup.tasks) return

            sectionGroup.tasks.forEach((task) => {
              if (task.id === sourceTask.id) sourceY = rowIndex * 40 + 20
              if (task.id === targetTask.id) targetY = rowIndex * 40 + 20
              rowIndex++
            })
          })
        }
      })

      // Calculate start and end points based on link type
      let startX, startY, endX, endY

      if (link.type === "finish_to_start") {
        startX = (sourceEndDiff + 1) * dayWidth
        startY = sourceY
        endX = targetStartDiff * dayWidth
        endY = targetY
      } else if (link.type === "start_to_start") {
        startX = sourceStartDiff * dayWidth
        startY = sourceY
        endX = targetStartDiff * dayWidth
        endY = targetY
      } else if (link.type === "finish_to_finish") {
        startX = (sourceEndDiff + 1) * dayWidth
        startY = sourceY
        endX = (targetStartDiff + differenceInDays(new Date(targetTask.end), new Date(targetTask.start)) + 1) * dayWidth
        endY = targetY
      } else {
        // start_to_finish
        startX = sourceStartDiff * dayWidth
        startY = sourceY
        endX = (targetStartDiff + differenceInDays(new Date(targetTask.end), new Date(targetTask.start)) + 1) * dayWidth
        endY = targetY
      }

      // Create path for the arrow
      const midX = startX + (endX - startX) / 2

      const path = `
         M ${startX},${startY}
         L ${midX},${startY}
         L ${midX},${endY}
         L ${endX},${endY}
       `

      return (
        <g key={link.id} className="dependency-line">
          <path
            d={path}
            fill="none"
            stroke="rgba(100, 100, 100, 0.5)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
          />
        </g>
      )
    })
  }

  // Calculate total rows needed for rendering
  const getTotalRows = () => {
    if (!groupedTasks || typeof groupedTasks !== "object") {
      return 1 // Default to at least one row
    }

    let rowCount = 0

    // Count project headers and tasks
    Object.values(groupedTasks).forEach((projectGroup: any) => {
      if (!projectGroup) return

      // Project header
      if (projectGroup.project) rowCount++

      // Direct project tasks
      if (Array.isArray(projectGroup.tasks)) {
        rowCount += projectGroup.tasks.length
      }

      // Section headers and tasks
      if (projectGroup.sections) {
        Object.values(projectGroup.sections).forEach((sectionGroup: any) => {
          if (!sectionGroup) return

          if (sectionGroup.section) rowCount++

          if (Array.isArray(sectionGroup.tasks)) {
            rowCount += sectionGroup.tasks.length
          }
        })
      }
    })

    return Math.max(rowCount, 1) // Ensure at least one row
  }

  const cn = (...classes: string[]) => classes.filter(Boolean).join(" ")

  // Debug output
  console.log("Rendering GanttView with", tasks?.length || 0, "tasks")
  console.log("GroupedTasks:", Object.keys(groupedTasks || {}).length, "projects")

  return (
    <div className="gantt-view border rounded-md overflow-hidden bg-card">
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="font-medium">Timeline View</div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(currentDate, "MMMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  if (date) {
                    setCurrentDate(date)
                    setCalendarOpen(false)
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={goToToday} className="h-8">
            Today
          </Button>

          <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline container - now takes full width */}
      <div
        className="timeline-container w-full overflow-auto"
        ref={timelineRef}
        style={{ maxHeight: "calc(100vh - 220px)" }}
      >
        {/* Timeline header */}
        <div className="timeline-header h-12 border-b bg-muted/30 flex sticky top-0 z-10">
          {days.map((day, index) => (
            <div
              key={index}
              className={cn(
                "day-header flex-shrink-0 border-r text-center py-2",
                isWeekend(day) ? "bg-muted/50" : "",
                isToday(day) ? "bg-primary/10" : "",
                !isSameMonth(day, currentDate) ? "text-muted-foreground" : "",
              )}
              style={{ width: `${dayWidth}px` }}
            >
              <div className={cn("text-sm font-medium", isToday(day) ? "text-primary" : "")}>{format(day, "d")}</div>
              <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
            </div>
          ))}
        </div>

        {/* Timeline grid */}
        <div
          className="timeline-grid relative"
          ref={ganttRef}
          style={{
            width: `${timelineWidth}px`,
            height: `${getTotalRows() * 40 + 20}px`,
            minHeight: "400px",
          }}
          onClick={() => onSelectTask(null)}
        >
          {/* Grid lines */}
          {days.map((day, index) => (
            <div
              key={index}
              className={cn(
                "absolute top-0 bottom-0 border-r",
                isWeekend(day) ? "bg-muted/20" : "",
                isToday(day) ? "bg-primary/5 border-primary/20" : "",
              )}
              style={{ left: `${index * dayWidth}px`, width: `${dayWidth}px` }}
            ></div>
          ))}

          {/* Today line */}
          {days.findIndex((day) => isToday(day)) !== -1 && (
            <div
              className="absolute top-0 bottom-0 w-0 z-20"
              style={{
                left: `${days.findIndex((day) => isToday(day)) * dayWidth + dayWidth / 2}px`,
                borderLeft: "2px dashed red",
              }}
            >
              <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                Today
              </div>
            </div>
          )}

          {/* No tasks message */}
          {(!tasks || tasks.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-4">
                <p className="text-muted-foreground">No tasks to display</p>
                <p className="text-sm text-muted-foreground mt-1">Create a task to get started</p>
              </div>
            </div>
          )}

          {/* Project and Section Rows */}
          {groupedTasks &&
            typeof groupedTasks === "object" &&
            Object.entries(groupedTasks).map(([projectId, projectGroupRaw]) => {
              const projectGroup = projectGroupRaw as any
              if (!projectGroup) return null

              let rowIndex = 0
              const elements = []

              // Project Header Row
              if (projectGroup.project) {
                elements.push(
                  <div
                    key={`project-${projectId}`}
                    className="absolute left-0 right-0 h-10 border-b bg-muted/10"
                    style={{ top: `${rowIndex * 40}px` }}
                  >
                    <div className="pl-4 flex items-center h-full">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: projectGroup.project.color }}
                      />
                      <span className="font-semibold">{projectGroup.project.name}</span>
                    </div>
                  </div>,
                )
                rowIndex++
              }

              // Project Tasks
              if (Array.isArray(projectGroup.tasks)) {
                projectGroup.tasks.forEach((task) => {
                  if (!task) return

                  const startDiff = differenceInDays(new Date(task.start), startDate)
                  const duration = differenceInDays(new Date(task.end), new Date(task.start)) + 1
                  const left = startDiff * dayWidth
                  const width = duration * dayWidth
                  const taskColor = getTaskColor(task)

                  elements.push(
                    <div
                      key={`task-row-${task.id}`}
                      className="absolute left-0 right-0 h-10 border-b"
                      style={{ top: `${rowIndex * 40}px` }}
                    >
                      <div className="pl-4 flex items-center h-full">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: taskColor }} />
                        <span className="text-sm truncate">{task.name}</span>
                      </div>
                    </div>,
                  )

                  elements.push(
                    <TooltipProvider key={`task-tooltip-${task.id}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            id={`task-${task.id}`}
                            key={`task-bar-${task.id}`}
                            className={cn(
                              "absolute h-6 rounded-sm cursor-pointer shadow-sm",
                              selectedTask === task.id ? "ring-2 ring-primary" : "",
                            )}
                            style={{
                              left: `${left}px`,
                              top: `${rowIndex * 40 + 7}px`,
                              width: `${width}px`,
                              backgroundColor: taskColor,
                              opacity: 0.9,
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectTask(task.id)
                            }}
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-l-sm hover:bg-black/10"
                              onMouseDown={(e) => handleTaskMouseDown(e, task.id, "resize-left")}
                            ></div>

                            <div
                              className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white truncate px-3"
                              onMouseDown={(e) => handleTaskMouseDown(e, task.id, "move")}
                            >
                              {task.name} ({task.progress}%)
                            </div>

                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-sm hover:bg-black/10"
                              onMouseDown={(e) => handleTaskMouseDown(e, task.id, "resize-right")}
                            ></div>

                            {/* Progress bar */}
                            <div
                              className="absolute top-0 left-0 bottom-0 bg-white bg-opacity-30 rounded-l-sm"
                              style={{ width: `${task.progress}%`, maxWidth: "100%" }}
                            ></div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">{task.name}</p>
                            <p className="text-xs">
                              {format(new Date(task.start), "MMM d")} - {format(new Date(task.end), "MMM d, yyyy")}
                            </p>
                            <p className="text-xs">Progress: {task.progress}%</p>
                            {task.description && <p className="text-xs max-w-xs">{task.description}</p>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>,
                  )

                  rowIndex++
                })
              }

              // Sections and their tasks
              if (projectGroup.sections) {
                Object.entries(projectGroup.sections).forEach(([sectionId, sectionGroupRaw]) => {
                  const sectionGroup = sectionGroupRaw as any
                  if (!sectionGroup) return

                  // Section Header Row
                  if (sectionGroup.section) {
                    elements.push(
                      <div
                        key={`section-${sectionId}`}
                        className="absolute left-0 right-0 h-10 border-b bg-muted/5"
                        style={{ top: `${rowIndex * 40}px` }}
                      >
                        <div className="pl-8 flex items-center h-full">
                          <div
                            className="w-3 h-3 rounded-sm mr-2"
                            style={{ backgroundColor: sectionGroup.section.color }}
                          />
                          <span className="font-medium">{sectionGroup.section.name}</span>
                        </div>
                      </div>,
                    )
                    rowIndex++
                  }

                  // Section Tasks
                  if (Array.isArray(sectionGroup.tasks)) {
                    sectionGroup.tasks.forEach((task) => {
                      if (!task) return

                      const startDiff = differenceInDays(new Date(task.start), startDate)
                      const duration = differenceInDays(new Date(task.end), new Date(task.start)) + 1
                      const left = startDiff * dayWidth
                      const width = duration * dayWidth
                      const taskColor = getTaskColor(task)

                      elements.push(
                        <div
                          key={`task-row-${task.id}`}
                          className="absolute left-0 right-0 h-10 border-b"
                          style={{ top: `${rowIndex * 40}px` }}
                        >
                          <div className="pl-12 flex items-center h-full">
                            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: taskColor }} />
                            <span className="text-sm truncate">{task.name}</span>
                          </div>
                        </div>,
                      )

                      elements.push(
                        <TooltipProvider key={`task-tooltip-${task.id}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                id={`task-${task.id}`}
                                key={`task-bar-${task.id}`}
                                className={cn(
                                  "absolute h-6 rounded-sm cursor-pointer shadow-sm",
                                  selectedTask === task.id ? "ring-2 ring-primary" : "",
                                )}
                                style={{
                                  left: `${left}px`,
                                  top: `${rowIndex * 40 + 7}px`,
                                  width: `${width}px`,
                                  backgroundColor: taskColor,
                                  opacity: 0.9,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectTask(task.id)
                                }}
                              >
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-l-sm hover:bg-black/10"
                                  onMouseDown={(e) => handleTaskMouseDown(e, task.id, "resize-left")}
                                ></div>

                                <div
                                  className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white truncate px-3"
                                  onMouseDown={(e) => handleTaskMouseDown(e, task.id, "move")}
                                >
                                  {task.name} ({task.progress}%)
                                </div>

                                <div
                                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r-sm hover:bg-black/10"
                                  onMouseDown={(e) => handleTaskMouseDown(e, task.id, "resize-right")}
                                ></div>

                                {/* Progress bar */}
                                <div
                                  className="absolute top-0 left-0 bottom-0 bg-white bg-opacity-30 rounded-l-sm"
                                  style={{ width: `${task.progress}%`, maxWidth: "100%" }}
                                ></div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium">{task.name}</p>
                                <p className="text-xs">
                                  {format(new Date(task.start), "MMM d")} - {format(new Date(task.end), "MMM d, yyyy")}
                                </p>
                                <p className="text-xs">Progress: {task.progress}%</p>
                                {task.description && <p className="text-xs max-w-xs">{task.description}</p>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>,
                      )

                      rowIndex++
                    })
                  }
                })
              }

              return elements
            })}

          {/* Ungrouped tasks section */}
          {groupedTasks && groupedTasks["ungrouped"] && (
            <div className="absolute left-0 right-0 h-10 border-b bg-muted/10" style={{ top: "0px" }}>
              <div className="pl-4 flex items-center h-full">
                <span className="font-semibold">Ungrouped Tasks</span>
              </div>
            </div>
          )}

          {/* SVG for dependency lines */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="rgba(100, 100, 100, 0.5)" />
              </marker>
            </defs>
            {renderDependencyLines()}
          </svg>
        </div>
      </div>
    </div>
  )
}
