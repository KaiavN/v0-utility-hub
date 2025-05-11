"use client"

import { useState } from "react"
import type { Task, Project, Section } from "@/lib/gantt-types"
import { format } from "date-fns"
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

import { LinkedItemsBadge } from "@/components/linked-items/linked-items-badge"

interface ListViewProps {
  tasks: Task[]
  projects: Project[]
  sections: Section[]
  users?: any[]
  onSelectTask: (taskId: string | null) => void
  onUpdateTask: (task: Partial<Task>) => void
  onAddTask: () => void
  isMobile?: boolean
}

export function ListView({
  tasks,
  projects,
  sections,
  users = [],
  onSelectTask,
  onUpdateTask,
  onAddTask,
  isMobile = false,
}: ListViewProps) {
  const [sortField, setSortField] = useState<keyof Task>("start")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filter, setFilter] = useState("")
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [projectFilter, setProjectFilter] = useState<string[]>([])

  // Sort tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortField === "start" || sortField === "end") {
      const dateA = new Date(a[sortField]).getTime()
      const dateB = new Date(b[sortField]).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    } else if (sortField === "name") {
      return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else if (sortField === "progress" || sortField === "priority") {
      const valueA = a[sortField]
      const valueB = b[sortField]

      if (sortField === "priority") {
        const priorityOrder = { low: 0, medium: 1, high: 2 }
        return sortDirection === "asc"
          ? priorityOrder[valueA as "low" | "medium" | "high"] - priorityOrder[valueB as "low" | "medium" | "high"]
          : priorityOrder[valueB as "low" | "medium" | "high"] - priorityOrder[valueA as "low" | "medium" | "high"]
      }

      return sortDirection === "asc" ? Number(valueA) - Number(valueB) : Number(valueB) - Number(valueA)
    }

    return 0
  })

  // Filter tasks
  const filteredTasks = sortedTasks.filter((task) => {
    // Apply text filter
    const textMatch =
      !filter ||
      task.name.toLowerCase().includes(filter.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(filter.toLowerCase())) ||
      task.status.toLowerCase().includes(filter.toLowerCase()) ||
      task.priority.toLowerCase().includes(filter.toLowerCase())

    // Apply status filter
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(task.status)

    // Apply priority filter
    const priorityMatch = priorityFilter.length === 0 || priorityFilter.includes(task.priority)

    // Apply project filter
    const projectMatch = projectFilter.length === 0 || (task.projectId && projectFilter.includes(task.projectId))

    return textMatch && statusMatch && priorityMatch && projectMatch
  })

  // Toggle sort
  const toggleSort = (field: keyof Task) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
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

  // Get assignees for a task
  const getTaskAssignees = (task: Task) => {
    if (!task.assignees || task.assignees.length === 0) return []
    return users.filter((user) => task.assignees?.includes(user.id))
  }

  // Render sort indicator
  const renderSortIndicator = (field: keyof Task) => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
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

  // Render mobile list view
  const renderMobileListView = () => {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <Button onClick={onAddTask} size="sm">
              Add Task
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input
              placeholder="Search tasks..."
              className="w-full"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled className="font-semibold">
                  Filter by Status
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter.includes("todo")}
                  onCheckedChange={(checked) => {
                    setStatusFilter((prev) => (checked ? [...prev, "todo"] : prev.filter((s) => s !== "todo")))
                  }}
                >
                  To Do
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter.includes("in-progress")}
                  onCheckedChange={(checked) => {
                    setStatusFilter((prev) =>
                      checked ? [...prev, "in-progress"] : prev.filter((s) => s !== "in-progress"),
                    )
                  }}
                >
                  In Progress
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter.includes("review")}
                  onCheckedChange={(checked) => {
                    setStatusFilter((prev) => (checked ? [...prev, "review"] : prev.filter((s) => s !== "review")))
                  }}
                >
                  Review
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter.includes("done")}
                  onCheckedChange={(checked) => {
                    setStatusFilter((prev) => (checked ? [...prev, "done"] : prev.filter((s) => s !== "done")))
                  }}
                >
                  Done
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem disabled className="font-semibold">
                  Sort by
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort("name")}>
                  Name {sortField === "name" && (sortDirection === "asc" ? "(A-Z)" : "(Z-A)")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort("start")}>
                  Date {sortField === "start" && (sortDirection === "asc" ? "(Oldest)" : "(Newest)")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort("priority")}>
                  Priority {sortField === "priority" && (sortDirection === "asc" ? "(Low-High)" : "(High-Low)")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort("progress")}>
                  Progress {sortField === "progress" && (sortDirection === "asc" ? "(0-100%)" : "(100-0%)")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="divide-y">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <Collapsible
                    key={task.id}
                    open={expandedTasks[task.id]}
                    onOpenChange={() => toggleTaskExpansion(task.id)}
                    className="w-full"
                  >
                    <div className="hover:bg-muted/50 transition-colors">
                      <CollapsibleTrigger className="w-full text-left">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getTaskColor(task) }}
                            />
                            <div>
                              <div className="font-medium text-sm">{task.name}</div>
                              <div className="text-xs text-muted-foreground">{getTaskContext(task)}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "mr-2 text-xs",
                                task.status === "done" && "bg-green-500/10 text-green-700 border-green-300",
                                task.status === "in-progress" && "bg-blue-500/10 text-blue-700 border-blue-300",
                                task.status === "review" && "bg-yellow-500/10 text-yellow-700 border-yellow-300",
                                task.status === "todo" && "bg-gray-500/10 text-gray-700 border-gray-300",
                              )}
                            >
                              {task.status.replace("-", " ")}
                            </Badge>
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-transform",
                                expandedTasks[task.id] && "transform rotate-90",
                              )}
                            />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 pt-0 bg-muted/30 space-y-3">
                          <div className="w-full">
                            <div className="flex justify-between mb-1 text-xs">
                              <span>Progress: {task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1.5" />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Start:</span>
                              <div>{format(new Date(task.start), "MMM d, yyyy")}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Due:</span>
                              <div>{format(new Date(task.end), "MMM d, yyyy")}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Priority:</span>
                              <div className="capitalize">{task.priority}</div>
                            </div>
                          </div>

                          {task.description && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Description:</span>
                              <p className="mt-1">{task.description}</p>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onSelectTask(task.id)
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p>No tasks found</p>
                  <p className="text-sm mt-1">Add projects and tasks to get started</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={onAddTask}>
                    Add Task
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  // Render desktop list view
  const renderDesktopListView = () => {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Task List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8 w-[200px]"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled className="font-semibold">
                    Filter by Status
                  </DropdownMenuItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("todo")}
                    onCheckedChange={(checked) => {
                      setStatusFilter((prev) => (checked ? [...prev, "todo"] : prev.filter((s) => s !== "todo")))
                    }}
                  >
                    To Do
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("in-progress")}
                    onCheckedChange={(checked) => {
                      setStatusFilter((prev) =>
                        checked ? [...prev, "in-progress"] : prev.filter((s) => s !== "in-progress"),
                      )
                    }}
                  >
                    In Progress
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("review")}
                    onCheckedChange={(checked) => {
                      setStatusFilter((prev) => (checked ? [...prev, "review"] : prev.filter((s) => s !== "review")))
                    }}
                  >
                    Review
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter.includes("done")}
                    onCheckedChange={(checked) => {
                      setStatusFilter((prev) => (checked ? [...prev, "done"] : prev.filter((s) => s !== "done")))
                    }}
                  >
                    Done
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem disabled className="font-semibold">
                    Filter by Priority
                  </DropdownMenuItem>
                  <DropdownMenuCheckboxItem
                    checked={priorityFilter.includes("low")}
                    onCheckedChange={(checked) => {
                      setPriorityFilter((prev) => (checked ? [...prev, "low"] : prev.filter((p) => p !== "low")))
                    }}
                  >
                    Low
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={priorityFilter.includes("medium")}
                    onCheckedChange={(checked) => {
                      setPriorityFilter((prev) => (checked ? [...prev, "medium"] : prev.filter((p) => p !== "medium")))
                    }}
                  >
                    Medium
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={priorityFilter.includes("high")}
                    onCheckedChange={(checked) => {
                      setPriorityFilter((prev) => (checked ? [...prev, "high"] : prev.filter((p) => p !== "high")))
                    }}
                  >
                    High
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem disabled className="font-semibold">
                    Filter by Project
                  </DropdownMenuItem>
                  {projects.map((project) => (
                    <DropdownMenuCheckboxItem
                      key={project.id}
                      checked={projectFilter.includes(project.id)}
                      onCheckedChange={(checked) => {
                        setProjectFilter((prev) =>
                          checked ? [...prev, project.id] : prev.filter((p) => p !== project.id),
                        )
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: project.color }} />
                        {project.name}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={onAddTask} size="sm">
                Add Task
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground">
              <div className="col-span-4 flex items-center cursor-pointer" onClick={() => toggleSort("name")}>
                <span>Task</span>
                <ArrowUpDown className="ml-1 h-3 w-3" />
                {renderSortIndicator("name")}
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => toggleSort("status")}>
                <span>Status</span>
                <ArrowUpDown className="ml-1 h-3 w-3" />
                {renderSortIndicator("status")}
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => toggleSort("priority")}>
                <span>Priority</span>
                <ArrowUpDown className="ml-1 h-3 w-3" />
                {renderSortIndicator("priority")}
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => toggleSort("start")}>
                <span>Start Date</span>
                <ArrowUpDown className="ml-1 h-3 w-3" />
                {renderSortIndicator("start")}
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => toggleSort("progress")}>
                <span>Progress</span>
                <ArrowUpDown className="ml-1 h-3 w-3" />
                {renderSortIndicator("progress")}
              </div>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="divide-y">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const isExpanded = expandedTasks[task.id]
                  const assignees = getTaskAssignees(task)

                  return (
                    <div key={task.id} className="hover:bg-muted/50 transition-colors">
                      <div
                        className="grid grid-cols-12 gap-4 px-4 py-3 text-sm cursor-pointer"
                        onClick={() => toggleTaskExpansion(task.id)}
                      >
                        <div className="col-span-4 flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                            style={{ backgroundColor: getTaskColor(task) }}
                          />
                          <div>
                            <div className="font-medium">{task.name}</div>
                            <div className="text-xs text-muted-foreground">{getTaskContext(task)}</div>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                task.status === "done" && "bg-green-500/10 text-green-700 border-green-300",
                                task.status === "in-progress" && "bg-blue-500/10 text-blue-700 border-blue-300",
                                task.status === "review" && "bg-yellow-500/10 text-yellow-700 border-yellow-300",
                                task.status === "todo" && "bg-gray-500/10 text-gray-700 border-gray-300",
                              )}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(task.status)}
                                <span>{task.status.replace("-", " ")}</span>
                              </div>
                            </Badge>
                            <LinkedItemsBadge sourceId={task.id} sourceType="ganttTask" />
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              task.priority === "high" && "bg-red-500/10 text-red-700 border-red-300",
                              task.priority === "medium" && "bg-yellow-500/10 text-yellow-700 border-yellow-300",
                              task.priority === "low" && "bg-green-500/10 text-green-700 border-green-300",
                            )}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex items-center">
                          {format(new Date(task.start), "MMM d, yyyy")}
                        </div>
                        <div className="col-span-2 flex items-center">
                          <div className="w-full">
                            <div className="flex justify-between mb-1 text-xs">
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1.5" />
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 py-3 bg-muted/30 border-t">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Details</h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                              )}

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Start Date:</span>
                                  <div>{format(new Date(task.start), "MMM d, yyyy")}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">End Date:</span>
                                  <div>{format(new Date(task.end), "MMM d, yyyy")}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Status:</span>
                                  <div className="capitalize">{task.status.replace("-", " ")}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Priority:</span>
                                  <div className="capitalize">{task.priority}</div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-2">Assignees</h4>
                              {assignees.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {assignees.map((user) => (
                                    <div key={user.id} className="flex items-center gap-2 p-2 rounded-md bg-background">
                                      <Avatar className="h-6 w-6">
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
                                      <span className="text-sm">{user.name}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">No assignees</div>
                              )}

                              <div className="flex justify-end mt-4 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectTask(task.id)
                                  }}
                                >
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p>No tasks found</p>
                  <p className="text-sm mt-1">Add projects and tasks to get started</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={onAddTask}>
                    Add Task
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return isMobile ? renderMobileListView() : renderDesktopListView()
}
