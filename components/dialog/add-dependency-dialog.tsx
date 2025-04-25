"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Task {
  id: string
  name: string
}

interface Dependency {
  id: string
  fromTask: string
  toTask: string
  type: "finish-to-start" | "start-to-start" | "finish-to-finish" | "start-to-finish"
}

interface AddDependencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddDependency: (dependency: Omit<Dependency, "id">) => void
  tasks: Task[]
}

const AddDependencyDialog: React.FC<AddDependencyDialogProps> = ({ open, onOpenChange, onAddDependency, tasks }) => {
  const [fromTask, setFromTask] = useState("")
  const [toTask, setToTask] = useState("")
  const [type, setType] = useState<Dependency["type"]>("finish-to-start")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fromTask || !toTask) {
      return // Basic validation
    }

    onAddDependency({
      fromTask,
      toTask,
      type,
    })

    // Reset form
    setFromTask("")
    setToTask("")
    setType("finish-to-start")

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Dependency</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="fromTask">From Task</Label>
              <Select value={fromTask} onValueChange={setFromTask}>
                <SelectTrigger id="fromTask">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="toTask">To Task</Label>
              <Select value={toTask} onValueChange={setToTask}>
                <SelectTrigger id="toTask">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks
                    .filter((task) => task.id !== fromTask)
                    .map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Dependency Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as Dependency["type"])}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finish-to-start">Finish to Start</SelectItem>
                  <SelectItem value="start-to-start">Start to Start</SelectItem>
                  <SelectItem value="finish-to-finish">Finish to Finish</SelectItem>
                  <SelectItem value="start-to-finish">Start to Finish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Dependency</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddDependencyDialog
