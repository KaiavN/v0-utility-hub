"use client"

import React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { ChevronDown, ChevronRight, Plus, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Project, Section, Task } from "@/lib/gantt-types"

interface ProjectSidebarProps {
  projects: Project[]
  sections: Section[]
  tasks: Task[]
  selectedProject: string | null
  selectedSection: string | null
  selectedTask: string | null
  onSelectProject: (projectId: string) => void
  onSelectSection: (sectionId: string) => void
  onSelectTask: (taskId: string) => void
  onAddProject: () => void
  onAddSection: (projectId: string) => void
  onAddTask: (projectId?: string, sectionId?: string) => void
  onEditProject: (projectId: string) => void
  onEditSection: (sectionId: string) => void
  onDeleteProject: (projectId: string) => void
  onDeleteSection: (sectionId: string) => void
  state: any
  dispatch: any
  onTaskSelect: (taskId: string) => void
  selectedTaskId: string | null
  className?: string
}

export function ProjectSidebar({
  projects,
  sections,
  tasks,
  selectedProject,
  selectedSection,
  selectedTask,
  onSelectProject,
  onSelectSection,
  onSelectTask,
  onAddProject,
  onAddSection,
  onAddTask,
  onEditProject,
  onEditSection,
  onDeleteProject,
  onDeleteSection,
  state,
  dispatch,
  onTaskSelect,
  selectedTaskId,
  className,
  ...props
}: ProjectSidebarProps) {
  // Force re-render counter
  const [forceUpdate, setForceUpdate] = useState(0)
  const forceRender = () => setForceUpdate((prev) => prev + 1)

  // Add this useEffect to ensure the sidebar refreshes when tasks change
  useEffect(() => {
    console.log("Tasks updated in ProjectSidebar:", tasks?.length || 0)
    forceRender()

    // Force update expanded projects for tasks that don't have sections
    const projectsWithTasks = new Set(
      (tasks || [])
        .filter((task) => task && !task.sectionId)
        .map((task) => task.projectId)
        .filter(Boolean),
    )

    // Auto-expand projects with new tasks
    if ((projects?.length || 0) > 0 && (tasks?.length || 0) > 0) {
      setExpandedProjects((prev) => {
        const newExpanded = { ...prev }
        projectsWithTasks.forEach((projectId) => {
          if (projectId) newExpanded[projectId] = true
        })
        return newExpanded
      })
    }
  }, [tasks, projects])

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarRef] = useState(React.createRef<HTMLDivElement>())

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }))
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const getProjectTasks = useCallback(
    (projectId: string) => {
      return (tasks || []).filter((task) => task && task.projectId === projectId && !task.sectionId)
    },
    [tasks],
  )

  const getSectionTasks = useCallback(
    (sectionId: string) => {
      return (tasks || []).filter((task) => task && task.sectionId === sectionId)
    },
    [tasks],
  )

  const getTaskCount = useCallback(
    (projectId: string) => {
      return (tasks || []).filter((task) => task && task.projectId === projectId).length
    },
    [tasks],
  )

  // Enhance the filtering logic to search more deeply and highlight matches

  // Update the filteredProjects calculation to search more thoroughly
  const filteredProjects = searchQuery
    ? (projects || []).filter((project) => {
        if (!project) return false

        // Check if project name or description matches
        const projectMatches =
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))

        // Check if any section in this project matches
        const sectionMatches = (sections || []).some(
          (section) =>
            section &&
            section.projectId === project.id &&
            section.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )

        // Check if any task in this project matches (including section tasks)
        const taskMatches = (tasks || []).some(
          (task) =>
            task &&
            task.projectId === project.id &&
            (task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))),
        )

        return projectMatches || sectionMatches || taskMatches
      })
    : projects || []

  // Add a helper function to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()

    if (!lowerText.includes(lowerQuery)) return text

    const startIndex = lowerText.indexOf(lowerQuery)
    const endIndex = startIndex + lowerQuery.length

    return (
      <>
        {text.substring(0, startIndex)}
        <span className="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white">
          {text.substring(startIndex, endIndex)}
        </span>
        {text.substring(endIndex)}
      </>
    )
  }

  // Debug output
  console.log("Rendering ProjectSidebar with", tasks?.length || 0, "tasks")

  // Add this debugging log
  console.log("ProjectSidebar tasks:", tasks)

  // Modify the grouping logic to handle tasks without projectId
  const groupedTasks = useMemo(() => {
    if (!Array.isArray(tasks)) {
      console.error("Tasks is not an array:", tasks)
      return {}
    }

    const grouped = {}

    // First, group by project
    tasks.forEach((task) => {
      if (!task) return

      const projectId = task.projectId || "ungrouped"

      if (!grouped[projectId]) {
        grouped[projectId] = {}
      }

      // Then by section if available
      const sectionId = task.sectionId || "unsectioned"

      if (!grouped[projectId][sectionId]) {
        grouped[projectId][sectionId] = []
      }

      grouped[projectId][sectionId].push(task)
    })

    console.log("Grouped tasks in sidebar:", grouped)
    return grouped
  }, [tasks])

  // Render project tasks in the sidebar
  const renderProjectTasks = (projectId: string, isExpanded: boolean) => {
    if (!isExpanded) return null

    const projectTasks = getProjectTasks(projectId)
    if (projectTasks.length === 0) return null

    return (
      <div className="ml-4 pl-2 border-l">
        {projectTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50",
              selectedTaskId === task.id && "bg-muted",
            )}
            onClick={() => onTaskSelect(task.id)}
          >
            <div className="pl-4 flex items-center h-full">
              <span className="text-sm truncate">{task.name}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Render ungrouped tasks if any
  const renderUngroupedTasks = () => {
    const ungroupedTasks = (tasks || []).filter((task) => task && !task.projectId)

    if (ungroupedTasks.length === 0) return null

    return (
      <div className="mb-4">
        <div className="flex items-center p-2 rounded-md cursor-pointer group hover:bg-muted/50">
          <div className="flex items-center flex-1 overflow-hidden">
            <span className="font-medium truncate">Ungrouped Tasks</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {ungroupedTasks.length}
            </Badge>
          </div>
        </div>
        <div className="ml-4 pl-2 border-l">
          {ungroupedTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50",
                selectedTaskId === task.id && "bg-muted",
              )}
              onClick={() => onTaskSelect(task.id)}
            >
              <div className="flex items-center h-full">
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: "#6366f1" }} // Default color for ungrouped tasks
                />
                <span className="text-sm truncate">{task.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="border-0 rounded-none shadow-none h-full">
      <CardContent className="p-0 h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Projects</h2>
          <Button size="sm" onClick={onAddProject}>
            <Plus className="h-4 w-4 mr-1" />
            Add Project
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-2">
            {/* Render ungrouped tasks first */}
            {renderUngroupedTasks()}

            {(!projects || projects.length === 0) && (!tasks || tasks.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first project to get started</p>
                <Button onClick={onAddProject} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </div>
            ) : (
              // Existing project list rendering code
              <div className="space-y-4 p-4">
                {(projects || []).map((project) => {
                  if (!project) return null

                  const projectSections = (sections || []).filter(
                    (section) => section && section.projectId === project.id,
                  )
                  const isExpanded = expandedProjects[project.id]
                  const isSelected = selectedProject === project.id
                  const taskCount = getTaskCount(project.id)
                  const projectTasks = getProjectTasks(project.id)

                  return (
                    <div key={project.id} className="mb-1">
                      <div
                        className={cn(
                          "flex items-center p-2 rounded-md cursor-pointer group hover:bg-muted/50",
                          isSelected && "bg-muted",
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 mr-1"
                          onClick={() => toggleProject(project.id)}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <div
                          className="flex items-center flex-1 overflow-hidden"
                          onClick={() => onSelectProject(project.id)}
                        >
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: project.color }} />
                          <span className="font-medium truncate">{project.name}</span>
                          {taskCount > 0 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {taskCount}
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onAddTask(project.id)}>Add Task</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddSection(project.id)}>Add Section</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEditProject(project.id)}>Edit Project</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => onDeleteProject(project.id)}>
                              Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {isExpanded && (
                        <div className="ml-4 pl-2 border-l">
                          {/* Project Tasks */}
                          {projectTasks.length > 0 && (
                            <div className="mt-1">
                              {projectTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50",
                                    selectedTaskId === task.id && "bg-muted",
                                  )}
                                  onClick={() => onTaskSelect(task.id)}
                                >
                                  <div className="flex items-center h-full">
                                    <div
                                      className="w-2 h-2 rounded-full mr-2"
                                      style={{ backgroundColor: project.color }}
                                    />
                                    <span className="text-sm truncate">{task.name}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sections */}
                          {projectSections.map((section) => {
                            if (!section) return null

                            const sectionTasks = getSectionTasks(section.id)
                            const isSectionExpanded = expandedSections[section.id]
                            const isSectionSelected = selectedSection === section.id

                            return (
                              <div key={section.id} className="mb-1">
                                <div
                                  className={cn(
                                    "flex items-center p-2 rounded-md cursor-pointer group hover:bg-muted/50",
                                    isSectionSelected && "bg-muted",
                                  )}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 p-0 mr-1"
                                    onClick={() => toggleSection(section.id)}
                                  >
                                    {isSectionExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <div
                                    className="flex items-center flex-1 overflow-hidden"
                                    onClick={() => onSelectSection(section.id)}
                                  >
                                    <div
                                      className="w-3 h-3 rounded-sm mr-2"
                                      style={{ backgroundColor: section.color }}
                                    />
                                    <span className="truncate">{section.name}</span>
                                    {sectionTasks.length > 0 && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {sectionTasks.length}
                                      </Badge>
                                    )}
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => onAddTask(project.id, section.id)}>
                                        Add Task
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => onEditSection(section.id)}>
                                        Edit Section
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => onDeleteSection(section.id)}
                                      >
                                        Delete Section
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Section Tasks */}
                                {isSectionExpanded && sectionTasks.length > 0 && (
                                  <div className="ml-4">
                                    {sectionTasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className={cn(
                                          "flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50",
                                          selectedTaskId === task.id && "bg-muted",
                                        )}
                                        onClick={() => onTaskSelect(task.id)}
                                      >
                                        <div className="flex items-center h-full">
                                          <div
                                            className="w-2 h-2 rounded-full mr-2"
                                            style={{ backgroundColor: section.color }}
                                          />
                                          <span className="text-sm truncate">{task.name}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {/* Add Section Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-muted-foreground mt-1"
                            onClick={() => onAddSection(project.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Section
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
