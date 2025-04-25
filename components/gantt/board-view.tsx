"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { Task, Project, Section, User } from "@/lib/gantt-types"

interface BoardViewProps {
  tasks: Task[]
  projects: Project[]
  sections: Section[]
  onSelectTask: (taskId: string) => void
  onUpdateTaskStatus: (taskId: string, status: "todo" | "in-progress" | "review" | "done") => void
  users?: User[]
}

export function BoardView({ tasks, projects, sections, onSelectTask, onUpdateTaskStatus, users = [] }: BoardViewProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const dragCounter = useRef<Record<string, number>>({
    todo: 0,
    "in-progress": 0,
    review: 0,
    done: 0,
  })

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
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

  const renderColumn = (status: Task["status"]) => {
    const tasksForStatus = getTasksByStatus(status)
    const statusLabels = {
      todo: "To Do",
      "in-progress": "In Progress",
      review: "Review",
      done: "Done",
    }

    const statusIcons = {
      todo: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
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
              <Badge variant="outline">{tasksForStatus.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="p-3 space-y-3">
                {tasksForStatus.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors shadow-sm"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onClick={() => onSelectTask(task.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getTaskColor(task) }}
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

                      <div className="w-full bg-muted h-1.5 rounded-full mt-2">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${task.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}

                {tasksForStatus.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <p className="text-sm">No tasks</p>
                    <p className="text-xs mt-1">Drag tasks here or add new ones</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
      {renderColumn("todo")}
      {renderColumn("in-progress")}
      {renderColumn("review")}
      {renderColumn("done")}
    </div>
  )
}
