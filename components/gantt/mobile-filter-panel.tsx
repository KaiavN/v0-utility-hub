"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Filter, Check } from "lucide-react"

interface MobileFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplyFilters: (filters: any) => void
}

export function MobileFilterPanel({ open, onOpenChange, onApplyFilters }: MobileFilterPanelProps) {
  const [status, setStatus] = useState<string>("all")
  const [priority, setPriority] = useState<string>("all")
  const [showCompleted, setShowCompleted] = useState<boolean>(true)

  const handleApply = () => {
    onApplyFilters({
      status,
      priority,
      showCompleted,
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    setStatus("all")
    setPriority("all")
    setShowCompleted(true)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] sm:h-[60vh]">
        <SheetHeader className="flex flex-row items-center justify-between mb-4">
          <SheetTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </SheetTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(80vh-10rem)] sm:max-h-[calc(60vh-10rem)] pr-1">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-completed" className="cursor-pointer">
              Show completed tasks
            </Label>
            <Switch id="show-completed" checked={showCompleted} onCheckedChange={setShowCompleted} />
          </div>
        </div>

        <SheetFooter className="flex flex-row gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Reset
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            <Check className="h-4 w-4 mr-1" />
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
