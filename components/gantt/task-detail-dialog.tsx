"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock, CheckCircle2, AlertCircle, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Task, Project, Section } from "@/lib/gantt-types"

// Add imports for linked items components
import { LinkedItemsList } from "@/components/linked-items/linked-items-list"
import { LinkItemDialog } from "@/components/linked-items/link-item-dialog"

interface TaskDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  projects: Project[]
  sections: Section[]
  users: any[]
  onUpdateTask: (task: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  isMobile?: boolean
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
  isMobile = false,
}: TaskDetailDialogProps) {
  const [name, setName] = useState(task.name)
  const [description, setDescription] = useState(task.description || "")
  const [startDate, setStartDate] = useState<Date>(new Date(task.start))
  const [endDate, setEndDate] = useState<Date>(new Date(task.end))
  const [progress, setProgress] = useState(task.progress)
  const [status, setStatus] = useState(task.status)
  const [priority, setPriority] = useState(task.priority)
  const [projectId, setProjectId] = useState(task.projectId || "")
  const [sectionId, setSectionId] = useState(task.sectionId || "")
  const [assignees, setAssignees] = useState<string[]>(task.assignees || [])
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [setTask, _setTask] = useState<Task>(task)

  // Reset form when task changes
  useEffect(() => {
    setName(task.name)
    setDescription(task.description || "")
    setStartDate(new Date(task.start))
    setEndDate(new Date(task.end))
    setProgress(task.progress)
    setStatus(task.status)
    setPriority(task.priority)
    setProjectId(task.projectId || "")
    setSectionId(task.sectionId || "")
    setAssignees(task.assignees || [])
  }, [task])

  // Filter sections based on selected project
  const filteredSections = sections.filter((section) => section.projectId === projectId)

  // Handle save
  const handleSave = () => {
    onUpdateTask({
      id: task.id,
      name,
      description,
      start: startDate,
      end: endDate,
      progress,
      status,
      priority,
      projectId: projectId || undefined,
      sectionId: sectionId || undefined,
      assignees,
    })
    onOpenChange(false)
  }

  // Handle delete
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      onDeleteTask(task.id)
    }
  }

  // Toggle assignee
  const toggleAssignee = (userId: string) => {
    setAssignees((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  // Get status icon
  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case "todo":
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "review":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  // Render mobile view
  const renderMobileView = () => {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="dates">Dates</TabsTrigger>
          <TabsTrigger value="assignees">Assignees</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Task Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {["todo", "in-progress", "review", "done"].map((statusValue) => (
                <Button
                  key={statusValue}
                  type="button"
                  variant={status === statusValue ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setStatus(statusValue as Task["status"])}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(statusValue)}
                    <span className="capitalize">{statusValue.replace("-", " ")}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="grid grid-cols-3 gap-2">
              {["low", "medium", "high"].map((priorityValue) => (
                <Button
                  key={priorityValue}
                  type="button"
                  variant={priority === priorityValue ? "default" : "outline"}
                  onClick={() => setPriority(priorityValue as Task["priority"])}
                >
                  <span className="capitalize">{priorityValue}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Progress ({progress}%)</Label>
            <Slider value={[progress]} min={0} max={100} step={5} onValueChange={(value) => setProgress(value[0])} />
          </div>
        </TabsContent>

        <TabsContent value="dates" className="space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value)
                setSectionId("")
              }}
            >
              <option value="">No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {projectId && (
            <div className="space-y-2">
              <Label>Section</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                <option value="">No Section</option>
                {filteredSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(date)
                      setStartDateOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(date)
                      setEndDateOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </TabsContent>

        <TabsContent value="assignees" className="space-y-4">
          <div className="space-y-2">
            <Label>Assignees</Label>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                    assignees.includes(user.id) ? "bg-primary/10 border-primary" : "bg-background border",
                  )}
                  onClick={() => toggleAssignee(user.id)}
                >
                  <Avatar className="h-8 w-8">
                    {user.avatar && <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />}
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                  {assignees.includes(user.id) && <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />}
                </div>
              ))}
              {users.length === 0 && <p className="text-muted-foreground">No team members available</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    )
  }

  // Render desktop view
  const renderDesktopView = () => {
    return (
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Task Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {["todo", "in-progress", "review", "done"].map((statusValue) => (
                <Button
                  key={statusValue}
                  type="button"
                  variant={status === statusValue ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setStatus(statusValue as Task["status"])}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(statusValue)}
                    <span className="capitalize">{statusValue.replace("-", " ")}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="grid grid-cols-3 gap-2">
              {["low", "medium", "high"].map((priorityValue) => (
                <Button
                  key={priorityValue}
                  type="button"
                  variant={priority === priorityValue ? "default" : "outline"}
                  onClick={() => setPriority(priorityValue as Task["priority"])}
                >
                  <span className="capitalize">{priorityValue}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Progress ({progress}%)</Label>
            <Slider value={[progress]} min={0} max={100} step={5} onValueChange={(value) => setProgress(value[0])} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <select
              className="w-full p-2 border rounded-md"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value)
                setSectionId("")
              }}
            >
              <option value="">No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {projectId && (
            <div className="space-y-2">
              <Label>Section</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                <option value="">No Section</option>
                {filteredSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(date)
                      setStartDateOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(date)
                      setEndDateOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Assignees</Label>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                    assignees.includes(user.id) ? "bg-primary/10 border-primary" : "bg-background border",
                  )}
                  onClick={() => toggleAssignee(user.id)}
                >
                  <Avatar className="h-8 w-8">
                    {user.avatar && <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />}
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.name}</span>
                  {assignees.includes(user.id) && <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />}
                </div>
              ))}
              {users.length === 0 && <p className="text-muted-foreground">No team members available</p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
              Task Details
            </h3>
            <div className="mt-2">{isMobile ? renderMobileView() : renderDesktopView()}</div>
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Linked Items</h3>
                <LinkItemDialog
                  sourceId={task.id}
                  sourceType="ganttTask"
                  onLinkAdded={() => {
                    // Force refresh
                    _setTask({ ...task })
                  }}
                  trigger={
                    <Button variant="outline" size="sm">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Link Item
                    </Button>
                  }
                />
              </div>
              <LinkedItemsList
                sourceId={task.id}
                sourceType="ganttTask"
                showEmpty={true}
                maxItems={5}
                emptyMessage="No items linked to this task yet. Link clients, invoices, meetings, or other related items."
              />
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button variant="destructive" onClick={handleDelete} className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto">
              Delete
            </Button>
            <Button type="button" className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" className="w-full sm:w-auto" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
