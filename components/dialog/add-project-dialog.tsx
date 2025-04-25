"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Project } from "@/lib/gantt-types"
import { parseDate, formatDateForInput, validateDateFormat } from "@/lib/utils"

interface AddProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddProject: (project: Omit<Project, "id">) => void
}

const AddProjectDialog: React.FC<AddProjectDialogProps> = ({ open, onOpenChange, onAddProject }) => {
  const today = new Date()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#4f46e5")
  const [startDate, setStartDate] = useState<Date>(today)
  const [endDate, setEndDate] = useState<Date>(today)
  const [startDateInput, setStartDateInput] = useState(formatDateForInput(today))
  const [endDateInput, setEndDateInput] = useState(formatDateForInput(today))
  const [startDateError, setStartDateError] = useState<string | null>(null)
  const [endDateError, setEndDateError] = useState<string | null>(null)
  const [formSubmitted, setFormSubmitted] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const today = new Date()
      setName("")
      setDescription("")
      setColor("#4f46e5")
      setStartDate(today)
      setEndDate(today)
      setStartDateInput(formatDateForInput(today))
      setEndDateInput(formatDateForInput(today))
      setStartDateError(null)
      setEndDateError(null)
      setFormSubmitted(false)
    }
  }, [open])

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

    if (!name) {
      return // Basic validation
    }

    // Validate dates before submission
    if (!validateDates()) {
      return
    }

    // Additional validation: ensure end date is not before start date
    if (endDate < startDate) {
      setEndDateError("End date cannot be before start date")
      return
    }

    onAddProject({
      name,
      description,
      color,
      start: startDate,
      end: endDate,
    })

    onOpenChange(false)
  }

  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return

    setStartDate(date)

    // If end date is before start date, update end date
    if (endDate < date) {
      setEndDate(date)
      setEndDateInput(formatDateForInput(date))
    }

    // Clear error when a valid date is set
    setStartDateError(null)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    if (!date) return

    setEndDate(date)

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Project Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <div>
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
                        setStartDateInput(formatDateForInput(startDate))
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
                      <p className="text-xs text-muted-foreground">Format: DD/MM/YYYY</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <div>
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
                        setEndDateInput(formatDateForInput(endDate))
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
                      <p className="text-xs text-muted-foreground">Format: DD/MM/YYYY</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddProjectDialog
