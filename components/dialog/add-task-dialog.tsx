"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { addDays } from "date-fns"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Task, Project, Section } from "@/lib/gantt-types"
import { parseDate, formatDateForInput, validateDateFormat } from "@/lib/utils"

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTask: (task: Omit<Task, "id">) => void
  projects: Project[]
  sections: Section[]
  defaultProjectId?: string
  defaultSectionId?: string
}

export default function AddTaskDialog({
  open,
  onOpenChange,
  onAddTask,
  projects,
  sections,
  defaultProjectId,
  defaultSectionId,
}: AddTaskDialogProps) {
  const today = new Date()
  const [task, setTask] = useState<Omit<Task, "id">>({
    name: "",
    description: "",
    status: "todo",
    priority: "medium",
    start: today,
    end: addDays(today, 7),
    progress: 0,
    assignees: [],
    projectId: defaultProjectId,
    sectionId: defaultSectionId,
  })
  const [filteredSections, setFilteredSections] = useState<Section[]>([])
  const [startDateInput, setStartDateInput] = useState(formatDateForInput(today))
  const [endDateInput, setEndDateInput] = useState(formatDateForInput(addDays(today, 7)))
  const [startDateError, setStartDateError] = useState<string | null>(null)
  const [endDateError, setEndDateError] = useState<string | null>(null)
  const [formSubmitted, setFormSubmitted] = useState(false)

  // Reset form when dialog opens or defaults change
  useEffect(() => {
    if (open) {
      const today = new Date()
      setTask({
        name: "",
        description: "",
        status: "todo",
        priority: "medium",
        start: today,
        end: addDays(today, 7),
        progress: 0,
        assignees: [],
        projectId: defaultProjectId,
        sectionId: defaultSectionId,
      })
      setStartDateInput(formatDateForInput(today))
      setEndDateInput(formatDateForInput(addDays(today, 7)))
      setStartDateError(null)
      setEndDateError(null)
      setFormSubmitted(false)
    }
  }, [open, defaultProjectId, defaultSectionId])

  // Filter sections based on selected project
  useEffect(() => {
    if (task.projectId) {
      setFilteredSections(sections.filter((section) => section.projectId === task.projectId))
    } else {
      setFilteredSections([])
    }
  }, [task.projectId, sections])

  const validateDates = (): boolean => {
    const startError = validateDateFormat(startDateInput)
    const endError = validateDateFormat(endDateInput)

    setStartDateError(startError)
    setEndDateError(endError)

    return !startError && !endError
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)

    if (!task.name) return

    // Validate dates before submission
    if (!validateDates()) {
      return
    }

    // Additional validation: ensure end date is not before start date
    if (task.end < task.start) {
      setEndDateError("End date cannot be before start date")
      return
    }

    const taskData = task

    // Find where the task is being created and ensure it has the required fields
    // Add console logging to see what's being created:

    console.log("Creating new task:", taskData)

    // Make sure the task has at least these fields:
    const newTask = {
      id: uuidv4(),
      name: taskData.name,
      description: taskData.description || "",
      start: taskData.start || new Date(),
      end: taskData.end || new Date(Date.now() + 86400000), // Default to 1 day duration
      progress: 0,
      status: "todo",
      priority: taskData.priority || "medium",
      projectId: taskData.projectId || null, // Make sure this is being set
      sectionId: taskData.sectionId || null,
      // other fields...
    }

    console.log("Final task being added:", newTask)

    onAddTask(newTask)
    onOpenChange(false)
  }

  const handleChange = (field: keyof Omit<Task, "id">, value: any) => {
    setTask((prev) => ({ ...prev, [field]: value }))
  }

  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return

    // If the new start date is after the current end date, also update the end date
    const newEndDate = date > task.end ? addDays(date, 1) : task.end

    setTask((prev) => ({
      ...prev,
      start: date,
      end: newEndDate,
    }))

    // Clear error when a valid date is set
    setStartDateError(null)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    if (!date) return

    setTask((prev) => ({
      ...prev,
      end: date,
    }))

    // Clear error when a valid date is set
    setEndDateError(null)
  }

  const validateStartDate = () => {
    const error = validateDateFormat(startDateInput)
    setStartDateError(error)

    if (!error) {
      const date = parseDate(startDateInput)
      if (date) {
        handleStartDateChange(date)
      }
    }

    return !error
  }

  const validateEndDate = () => {
    const error = validateDateFormat(endDateInput)
    setEndDateError(error)

    if (!error) {
      const date = parseDate(endDateInput)
      if (date) {
        handleEndDateChange(date)
      }
    }

    return !error
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>Create a new task to keep track of your projects.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={task.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={task.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                Project
              </Label>
              <Select
                value={task.projectId || "none"}
                onValueChange={(value) => {
                  handleChange("projectId", value === "none" ? undefined : value)
                  handleChange("sectionId", undefined) // Clear section when project changes
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Projects</SelectLabel>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="none">None</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {task.projectId && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="section" className="text-right">
                  Section
                </Label>
                <Select
                  value={task.sectionId || "none"}
                  onValueChange={(value) => handleChange("sectionId", value === "none" ? undefined : value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Sections</SelectLabel>
                      {filteredSections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="none">None</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select value={task.priority} onValueChange={(value) => handleChange("priority", value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Priority</SelectLabel>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Date Range</Label>
              <div className="col-span-3 flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                <div className="w-full sm:w-[180px]">
                  <Input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={startDateInput}
                    onChange={(e) => {
                      setStartDateInput(e.target.value)
                      if (formSubmitted) {
                        validateStartDate()
                      }
                    }}
                    onBlur={() => {
                      if (validateStartDate()) {
                        setStartDateInput(formatDateForInput(task.start))
                      }
                    }}
                    className={`w-full ${startDateError ? "border-red-500" : ""}`}
                    aria-invalid={!!startDateError}
                    aria-describedby={startDateError ? "start-date-error" : undefined}
                  />
                  <div className="mt-1 min-h-[20px]">
                    {startDateError ? (
                      <p id="start-date-error" className="text-xs text-red-500">
                        {startDateError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Start date (DD/MM/YYYY)</p>
                    )}
                  </div>
                </div>
                <div className="w-full sm:w-[180px]">
                  <Input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={endDateInput}
                    onChange={(e) => {
                      setEndDateInput(e.target.value)
                      if (formSubmitted) {
                        validateEndDate()
                      }
                    }}
                    onBlur={() => {
                      if (validateEndDate()) {
                        setEndDateInput(formatDateForInput(task.end))
                      }
                    }}
                    className={`w-full ${endDateError ? "border-red-500" : ""}`}
                    aria-invalid={!!endDateError}
                    aria-describedby={endDateError ? "end-date-error" : undefined}
                  />
                  <div className="mt-1 min-h-[20px]">
                    {endDateError ? (
                      <p id="end-date-error" className="text-xs text-red-500">
                        {endDateError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">End date (DD/MM/YYYY)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="progress" className="text-right">
                Progress
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={task.progress}
                  onChange={(e) => handleChange("progress", Number(e.target.value))}
                  className="w-20"
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
