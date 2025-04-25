"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Calendar, AlignLeft, Users, CheckSquare, Folder, Layers, Clock, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import type { Task, Project, Section, User } from "@/lib/gantt-types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"

interface TaskDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  projects: Project[]
  sections: Section[]
  users: User[]
  onUpdateTask: (task: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
}

export default function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  projects,
  sections,
  users,
  onUpdateTask,
  onDeleteTask,
}: TaskDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<Partial<Task>>(task)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [progressValue, setProgressValue] = useState(task.progress)

  useEffect(() => {
    // Reset edited task when a new task is selected or dialog opens
    if (open) {
      setEditedTask(task)
      setProgressValue(task.progress)
      setIsEditing(false)
    }
  }, [task, open])

  useEffect(() => {
    // Reset edited task when dialog closes
    if (!open) {
      setEditedTask(task)
      setProgressValue(task.progress)
      setIsEditing(false)
      setStartDateOpen(false)
      setEndDateOpen(false)
    }
  }, [open, task])

  const project = projects.find((p) => p.id === task.projectId)
  const section = sections.find((s) => s.id === task.sectionId)
  const assignedUsers = users.filter((user) => task.assignees?.includes(user.id))

  const handleInputChange = (field: keyof Task, value: any) => {
    setEditedTask((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0]
    setProgressValue(newProgress)

    // Update the task immediately without requiring edit mode
    if (!isEditing) {
      onUpdateTask({
        id: task.id,
        progress: newProgress,
      })
    } else {
      handleInputChange("progress", newProgress)
    }
  }

  const handleSave = () => {
    onUpdateTask({
      ...editedTask,
      id: task.id, // Ensure the ID is included
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedTask(task)
    setProgressValue(task.progress)
    setIsEditing(false)
  }

  // Memoized date selection handlers to prevent unnecessary re-renders
  const handleStartDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        handleInputChange("start", date)
        // Use setTimeout to ensure the state update happens before closing the popover
        setTimeout(() => setStartDateOpen(false), 0)
      }
    },
    [handleInputChange, setStartDateOpen],
  )

  const handleEndDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        handleInputChange("end", date)
        // Use setTimeout to ensure the state update happens before closing the popover
        setTimeout(() => setEndDateOpen(false), 0)
      }
    },
    [handleInputChange, setEndDateOpen],
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-500/10 text-gray-700 border-gray-300"
      case "in-progress":
        return "bg-blue-500/10 text-blue-700 border-blue-300"
      case "review":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-300"
      case "done":
        return "bg-green-500/10 text-green-700 border-green-300"
      default:
        return ""
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-500/10 text-green-700 border-green-300"
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-300"
      case "high":
        return "bg-red-500/10 text-red-700 border-red-300"
      default:
        return ""
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          setIsEditing(false)
          setStartDateOpen(false)
          setEndDateOpen(false)
        }
        onOpenChange(newOpen)
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{isEditing ? "Edit Task" : task.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {!isEditing && task.description && (
            <DialogDescription className="mt-2 line-clamp-2">{task.description}</DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="p-4 space-y-6">
            {/* Task Name */}
            <div>
              {isEditing ? (
                <Input
                  value={editedTask.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="font-semibold text-lg"
                />
              ) : (
                <h1 className="font-semibold text-lg">{task.name}</h1>
              )}
            </div>

            {/* Project & Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Folder className="h-4 w-4" />
                <span>Project</span>
              </div>
              {isEditing ? (
                <Select value={editedTask.projectId} onValueChange={(value) => handleInputChange("projectId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: project.color }} />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center">
                  {project && (
                    <>
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: project.color }} />
                      <span>{project.name}</span>
                    </>
                  )}
                </div>
              )}

              {(isEditing || section) && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                    <Layers className="h-4 w-4" />
                    <span>Section</span>
                  </div>
                  {isEditing ? (
                    <Select
                      value={editedTask.sectionId || ""}
                      onValueChange={(value) => handleInputChange("sectionId", value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-section">No section</SelectItem>
                        {sections
                          .filter((s) => s.projectId === editedTask.projectId)
                          .map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-sm mr-2" style={{ backgroundColor: section.color }} />
                                {section.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center">
                      {section && (
                        <>
                          <div className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: section.color }} />
                          <span>{section.name}</span>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator />

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span>Status</span>
                </div>
                {isEditing ? (
                  <Select value={editedTask.status} onValueChange={(value: any) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getStatusColor(task.status)}>{task.status.replace("-", " ")}</Badge>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Tag className="h-4 w-4" />
                  <span>Priority</span>
                </div>
                {isEditing ? (
                  <Select
                    value={editedTask.priority}
                    onValueChange={(value: any) => handleInputChange("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Start Date</span>
                </div>
                {isEditing ? (
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {editedTask.start ? format(new Date(editedTask.start), "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
                      <CalendarComponent
                        mode="single"
                        selected={editedTask.start ? new Date(editedTask.start) : undefined}
                        onSelect={handleStartDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="text-sm bg-muted/30 p-2 rounded-md">
                    {task.start ? format(new Date(task.start), "PPP") : "No start date"}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>End Date</span>
                </div>
                {isEditing ? (
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {editedTask.end ? format(new Date(editedTask.end), "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
                      <CalendarComponent
                        mode="single"
                        selected={editedTask.end ? new Date(editedTask.end) : undefined}
                        onSelect={handleEndDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <div className="text-sm bg-muted/30 p-2 rounded-md">
                    {task.end ? format(new Date(task.end), "PPP") : "No end date"}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckSquare className="h-4 w-4" />
                  <span>Progress</span>
                </div>
                <span className="text-sm font-medium">{progressValue}%</span>
              </div>
              <div className="space-y-4">
                <Slider
                  value={[progressValue]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleProgressChange}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <AlignLeft className="h-4 w-4" />
                <span>Description</span>
              </div>
              {isEditing ? (
                <Textarea
                  value={editedTask.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-[100px]"
                />
              ) : (
                <div className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                  {task.description || <span className="text-muted-foreground italic">No description</span>}
                </div>
              )}
            </div>

            <Separator />

            {/* Assignees */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Assignees</span>
              </div>
              {isEditing ? (
                <Select
                  value={editedTask.assignees?.join(",") || ""}
                  onValueChange={(value) => handleInputChange("assignees", value ? value.split(",") : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign users" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback style={{ backgroundColor: user.color }}>
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assignedUsers.length > 0 ? (
                    assignedUsers.map((user) => (
                      <div key={user.id} className="flex items-center bg-muted/30 px-2 py-1 rounded-md">
                        <Avatar className="h-6 w-6 mr-1">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} />
                          <AvatarFallback style={{ backgroundColor: user.color }}>
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No assignees</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          {isEditing ? (
            <div className="flex space-x-2 w-full">
              <Button onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2 w-full">
              <Button onClick={() => setIsEditing(true)} className="flex-1">
                Edit Task
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this task?")) {
                    onDeleteTask(task.id)
                    onOpenChange(false)
                  }
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
