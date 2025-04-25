"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Section, Project } from "@/lib/gantt-types"

interface AddSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSection: (section: Omit<Section, "id" | "projectId">) => void
  projects?: Project[]
  defaultProjectId?: string
}

const AddSectionDialog: React.FC<AddSectionDialogProps> = ({
  open,
  onOpenChange,
  onAddSection,
  projects = [],
  defaultProjectId,
}) => {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#6366f1") // Default color

  useEffect(() => {
    if (open) {
      // Initialize form when dialog opens
      setName("")
      setColor("#6366f1")
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      return // Basic validation
    }

    onAddSection({
      name,
      color,
    })

    // Reset form
    setName("")
    setColor("#6366f1")

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Section</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            {defaultProjectId && projects && projects.length > 0 && (
              <div>
                <Label className="text-muted-foreground">Project</Label>
                <div className="mt-1 flex items-center">
                  {(() => {
                    const project = projects.find((p) => p.id === defaultProjectId)
                    if (project) {
                      return (
                        <>
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: project.color }} />
                          <span>{project.name}</span>
                        </>
                      )
                    }
                    return <span className="text-muted-foreground">No project selected</span>
                  })()}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">Section Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter section name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Section Color</Label>
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
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Section</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddSectionDialog
