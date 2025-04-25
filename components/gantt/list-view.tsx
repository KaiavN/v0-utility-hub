"use client"

import { useState } from "react"
import type { Task, Project, Section } from "@/lib/gantt-types"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Search, Filter, ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ListViewProps {
  tasks: Task[]
  projects: Project[]
  sections: Section[]
  onSelectTask: (taskId: string | null) => void
  onUpdateTask: (task: Partial<Task>) => void
}

export function ListView({ tasks, projects, sections, onSelectTask, onUpdateTask }: ListViewProps) {
  const [sortField, setSortField] = useState<keyof Task>("start")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filter, setFilter] = useState("")
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

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
    if (!filter) return true

    const lowerFilter = filter.toLowerCase()

    // Check task fields
    if (
      task.name.toLowerCase().includes(lowerFilter) ||
      (task.description && task.description.toLowerCase().includes(lowerFilter)) ||
      task.status.toLowerCase().includes(lowerFilter) ||
      task.priority.toLowerCase().includes(lowerFilter)
    ) {
      return true
    }

    // Check project name
    if (task.projectId) {
      const project = projects.find((p) => p.id === task.projectId)
      if (project && project.name.toLowerCase().includes(lowerFilter)) {
        return true
      }
    }

    // Check section name
    if (task.sectionId) {
      const section = sections.find((s) => s.id === task.sectionId)
      if (section && section.name.toLowerCase().includes(lowerFilter)) {
        return true
      }
    }

    return false
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

  // Render sort indicator
  const renderSortIndicator = (field: keyof Task) => {
    if (sortField !== field) return null

    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

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
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
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
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onSelectTask(task.id)}
                >
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm">
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
                      <Badge
                        variant="outline"
                        className={cn(
                          task.status === "done" && "bg-green-500/10 text-green-700 border-green-300",
                          task.status === "in-progress" && "bg-blue-500/10 text-blue-700 border-blue-300",
                          task.status === "review" && "bg-yellow-500/10 text-yellow-700 border-yellow-300",
                          task.status === "todo" && "bg-gray-500/10 text-gray-700 border-gray-300",
                        )}
                      >
                        {task.status.replace("-", " ")}
                      </Badge>
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
                    <div className="col-span-2 flex items-center">{format(task.start, "MMM d, yyyy")}</div>
                    <div className="col-span-2 flex items-center">
                      <div className="w-full">
                        <div className="flex justify-between mb-1 text-xs">
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No tasks found</p>
                <p className="text-sm mt-1">Add projects and tasks to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
