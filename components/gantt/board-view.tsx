"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Clock, CheckCircle2, AlertCircle, Calendar, Plus, CheckSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import type { Task, Project, Section } from "@/lib/gantt-types"
import type { User as GanttUser } from "@/lib/gantt-types"
import { LinkedItemsBadge } from "@/components/linked-items/linked-items-badge"

interface BoardViewProps {
  tasks: Task[]
  projects: Project[]
  sections: Section[]
  onSelectTask: (taskId: string) => void
  onUpdateTaskStatus: (taskId: string, status: "todo" | "in-progress" | "review" | "done") => void
  onAddTask: (status: string) => void
  users?: GanttUser[]
  isMobile?: boolean
}

export function BoardView({
  tasks,
  projects,
  sections,
  onSelectTask,
  onUpdateTaskStatus,
  onAddTask,
  users = [],
  isMobile = false,
}: BoardViewProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const dragCounter = useRef<Record<string, number>>({
    todo: 0,
    "in-progress": 0,
    review: 0,
    done: 0,
  })
  const [activeStatus, setActiveStatus] = useState<Task["status"]>("todo")

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    if (isMobile) return // Disable drag on mobile

    setDraggedTask(task)

    // Set drag image
    const dragImage = document.createElement("div")
    dragImage.className = "bg-background border rounded-md shadow-md p-2 text-sm font-medium"
    dragImage.textContent = task.name
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)

    // Clean up after drag
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, status: Task["status"]) => {
    e.preventDefault()
    dragCounter.current[status] = (dragCounter.current[status] || 0) + 1
    e.currentTarget.classList.add("bg-primary/5", "border-primary/30")
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, status: Task["status"]) => {
    dragCounter.current[status] = (dragCounter.current[status] || 0) - 1
    if (dragCounter.current[status] === 0) {
      e.currentTarget.classList.remove("bg-primary/5", "border-primary/30")
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: Task["status"]) => {
    e.preventDefault()
    e.currentTarget.classList.remove("bg-primary/5", "border-primary/30")
    dragCounter.current[status] = 0

    if (draggedTask && draggedTask.status !== status) {
      onUpdateTaskStatus(draggedTask.id, status)
    }
    setDraggedTask(null)
  }

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status)
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

  // Get assignees for a task
  const getTaskAssignees = (task: Task) => {
    if (!task.assignees || task.assignees.length === 0) return []
    return users.filter((user) => task.assignees?.includes(user.id))
  }

  // Format due date with color based on proximity
  const formatDueDate = (task: Task) => {
    if (!task.end) return null

    const dueDate = new Date(task.end)
    const today = new Date()
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let colorClass = "text-muted-foreground"
    if (diffDays < 0) {
      colorClass = "text-red-500"
    } else if (diffDays <= 2) {
      colorClass = "text-amber-500"
    } else if (diffDays <= 5) {
      colorClass = "text-blue-500"
    }

    return (
      <div className={`flex items-center text-xs ${colorClass}`}>
        <Calendar className="h-3 w-3 mr-1" />
        {format(dueDate, "MMM d")}
      </div>
    )
  }

  const renderColumn = (status: Task["status"]) => {
    const tasksForStatus = getTasksByStatus(status)
    const statusLabels = {
      todo: "To Do",
      "in-progress": "In Progress",
      review: "Review",
      done: "Done",
    }

    const statusIcons = {
      todo: <CheckSquare className="h-4 w-4 text-muted-foreground" />,
      "in-progress": <Clock className="h-4 w-4 text-blue-500" />,
      review: <AlertCircle className="h-4 w-4 text-amber-500" />,
      done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    }

    return (
      <div
        className="flex flex-col h-full transition-colors duration-200"
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, status)}
        onDragLeave={(e) => handleDragLeave(e, status)}
        onDrop={(e) => handleDrop(e, status)}
      >
        <Card className="flex-1 flex flex-col border-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                {statusIcons[status]}
                <span>{statusLabels[status]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{tasksForStatus.length}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddTask(status)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className={isMobile ? "h-[calc(100vh-300px)]" : "h-[calc(100vh-250px)]"}>
              <div className="p-3 space-y-3">
                {tasksForStatus.map((task) => {
                  const assignees = getTaskAssignees(task)
                  const taskColor = getTaskColor(task)

                  return (
                    <div
                      key={task.id}
                      className="rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors shadow-sm"
                      draggable={!isMobile}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onSelectTask(task.id)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: taskColor }}
                            />
                            <h3 className="font-medium">{task.name}</h3>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 flex-shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, "todo")}>
                                Move to To Do
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, "in-progress")}>
                                Move to In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, "review")}>
                                Move to Review
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, "done")}>
                                Move to Done
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="text-xs text-muted-foreground">{getTaskContext(task)}</div>

                        <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${task.progress}%`,
                              backgroundColor: taskColor,
                            }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {formatDueDate(task)}

                          {assignees.length > 0 && (
                            <div className="flex -space-x-2">
                              {assignees.slice(0, 3).map((user) => (
                                <TooltipProvider key={user.id}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-6 w-6 border-2 border-background">
                                        {user.avatar && (
                                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                        )}
                                        <AvatarFallback className="text-xs">
                                          {user.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>{user.name}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                              {assignees.length > 3 && (
                                <Avatar className="h-6 w-6 border-2 border-background">
                                  <AvatarFallback className="text-xs bg-muted">+{assignees.length - 3}</AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 mt-2">
                          {task.priority && (
                            <Badge variant="outline" className="text-xs">
                              {task.priority}
                            </Badge>
                          )}
                          <LinkedItemsBadge sourceId={task.id} sourceType="ganttTask" />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {tasksForStatus.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <p className="text-sm">No tasks</p>
                    <p className="text-xs mt-1">Drag tasks here or add new ones</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => onAddTask(status)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Task
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mobile view with tabs for each status
  const renderMobileView = () => {
    return (
      <div className="flex flex-col h-full">
        <Tabs
          value={activeStatus}
          onValueChange={(value) => setActiveStatus(value as Task["status"])}
          className="w-full mb-4"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="todo" className="text-xs">
              To Do
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="review" className="text-xs">
              Review
            </TabsTrigger>
            <TabsTrigger value="done" className="text-xs">
              Done
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1">{renderColumn(activeStatus)}</div>
      </div>
    )
  }

  // Desktop view with all columns
  const renderDesktopView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
        {renderColumn("todo")}
        {renderColumn("in-progress")}
        {renderColumn("review")}
        {renderColumn("done")}
      </div>
    )
  }

  return isMobile ? renderMobileView() : renderDesktopView()
}
