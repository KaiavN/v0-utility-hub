"use client"

import { useReducer, useState, useEffect, useCallback, useRef } from "react"
import {
  List,
  BarChart2,
  KanbanSquare,
  CalendarIcon,
  Plus,
  Filter,
  Search,
  SlidersHorizontal,
  Menu,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ganttReducer } from "@/lib/gantt-reducer"
import { GanttView } from "@/components/gantt/gantt-view"
import { BoardView } from "@/components/gantt/board-view"
import { CalendarView } from "@/components/gantt/calendar-view"
import { ListView } from "@/components/gantt/list-view"
import { ProjectSidebar } from "@/components/gantt/project-sidebar"
import AddTaskDialog from "@/components/dialog/add-task-dialog"
import AddProjectDialog from "@/components/dialog/add-project-dialog"
import AddSectionDialog from "@/components/dialog/add-section-dialog"
import TeamMembersDialog from "@/components/gantt/team-members-dialog"
import TeamMembersList from "@/components/gantt/team-members-list"
import TaskDetailDialog from "./task-detail-dialog"
import type { Task, Link, ViewType, Project, Section } from "@/lib/gantt-types"
import { Slider } from "@/components/ui/slider"
import { v4 as uuidv4 } from "uuid"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { useWindowSize } from "@/hooks/use-window-size"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface GanttProps {
  tasks: Task[]
  links: Link[]
  projects: Project[]
  sections: Section[]
  onUpdateData?: (data: {
    tasks: Task[]
    links: Link[]
    projects: Project[]
    sections: Section[]
  }) => void
}

const TEAM_STORAGE_KEY = "gantt-team-members"

export function Gantt({
  tasks: initialTasks,
  links: initialLinks,
  projects: initialProjects,
  sections: initialSections,
  onUpdateData,
}: GanttProps) {
  // Get window size for responsive design
  const { width, isMobile, isTablet } = useWindowSize()

  // Force re-render counter
  const [forceUpdate, setForceUpdate] = useState(0)
  const forceRender = () => setForceUpdate((prev) => prev + 1)

  // Initialize state with reducer
  const [state, dispatch] = useReducer(ganttReducer, {
    tasks: initialTasks,
    links: initialLinks,
    projects: initialProjects,
    sections: initialSections,
    users: [],
    selectedTask: null,
    selectedProject: null,
    selectedSection: null,
    selectedDate: new Date(),
    zoomLevel: 50,
    currentView: isMobile ? "list" : ("gantt" as ViewType),
  })

  // Keep a reference to the latest state for callbacks
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Load data from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("ganttState")
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)

          // Process dates in tasks
          if (parsedState.tasks) {
            parsedState.tasks = parsedState.tasks.map((task: any) => ({
              ...task,
              start: task.start ? new Date(task.start) : undefined,
              end: task.end ? new Date(task.end) : undefined,
            }))
          }

          // Process dates in projects
          if (parsedState.projects) {
            parsedState.projects = parsedState.projects.map((project: any) => ({
              ...project,
              start: project.start ? new Date(project.start) : undefined,
              end: project.end ? new Date(project.end) : undefined,
            }))
          }

          dispatch({ type: "SET_STATE", payload: parsedState })
        } catch (error) {
          console.error("Failed to parse saved gantt state:", error)
        }
      }
    } catch (error) {
      console.error("Error loading gantt state:", error)
    }
  }, [dispatch])

  // Add a new useEffect to listen for gantt-data-updated events
  useEffect(() => {
    const handleGanttDataUpdated = (event: CustomEvent) => {
      console.log("Gantt data updated event received:", event.detail)

      // Update the state with the new data
      if (event.detail) {
        const { projects, sections, tasks, links } = event.detail

        if (projects) dispatch({ type: "SET_PROJECTS", payload: projects })
        if (sections) dispatch({ type: "SET_SECTIONS", payload: sections })
        if (tasks) dispatch({ type: "SET_TASKS", payload: tasks })
        if (links) dispatch({ type: "SET_LINKS", payload: links })

        // Force a re-render
        forceRender()
      }
    }

    // Add event listener
    window.addEventListener("gantt-data-updated", handleGanttDataUpdated as EventListener)

    // Clean up
    return () => {
      window.removeEventListener("gantt-data-updated", handleGanttDataUpdated as EventListener)
    }
  }, [dispatch])

  // Add a new useEffect to save state changes
  useEffect(() => {
    // Save state to localStorage whenever it changes
    localStorage.setItem("ganttState", JSON.stringify(state))

    // This will help ensure all components are in sync with the latest state
    const event = new CustomEvent("gantt-state-updated", { detail: state })
    window.dispatchEvent(event)
  }, [state])

  // Load team members from localStorage
  useEffect(() => {
    try {
      const savedTeamMembers = getLocalStorage(TEAM_STORAGE_KEY)
      if (savedTeamMembers && Array.isArray(savedTeamMembers) && savedTeamMembers.length > 0) {
        dispatch({ type: "SET_USERS", payload: savedTeamMembers })
      } else {
        // Default empty team members if none are saved
        dispatch({
          type: "SET_USERS",
          payload: [],
        })
      }
    } catch (error) {
      console.error("Error loading team members:", error)
      // Set empty team members on error
      dispatch({
        type: "SET_USERS",
        payload: [],
      })
    }
  }, [])

  // Dialog states
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false)
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false)
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false)
  const [teamMembersDialogOpen, setTeamMembersDialogOpen] = useState(false)
  const [taskDetailDialogOpen, setTaskDetailDialogOpen] = useState(false)
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null)
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Update sidebar visibility when screen size changes
  useEffect(() => {
    setSidebarVisible(!isMobile)
  }, [isMobile])

  // Update parent component with data changes
  const notifyDataChange = useCallback(() => {
    if (onUpdateData) {
      onUpdateData({
        tasks: state.tasks,
        links: state.links,
        projects: state.projects,
        sections: state.sections,
      })
    }

    // Force a re-render to ensure all components update
    forceRender()
  }, [state.tasks, state.links, state.projects, state.sections, onUpdateData])

  // Save team members when they change
  useEffect(() => {
    if (state.users.length > 0) {
      setLocalStorage(TEAM_STORAGE_KEY, state.users)
    }
  }, [state.users])

  // Notify parent of data changes
  useEffect(() => {
    notifyDataChange()
  }, [state.tasks, state.links, state.projects, state.sections, notifyDataChange])

  // Clean up dialog states when they close
  useEffect(() => {
    if (!addTaskDialogOpen) {
      setTargetProjectId(null)
      setTargetSectionId(null)
    }
  }, [addTaskDialogOpen])

  useEffect(() => {
    if (!addProjectDialogOpen) {
      // Any cleanup needed for project dialog
    }
  }, [addProjectDialogOpen])

  useEffect(() => {
    if (!addSectionDialogOpen) {
      setTargetProjectId(null)
    }
  }, [addSectionDialogOpen])

  // Handle view change
  const handleViewChange = (view: ViewType) => {
    dispatch({ type: "SET_VIEW", payload: view })
    toast({
      title: `${view.charAt(0).toUpperCase() + view.slice(1)} View`,
      description: `Switched to ${view} view`,
      duration: 1500,
    })
  }

  // Handle zoom change
  const handleZoomChange = (value: number[]) => {
    dispatch({ type: "SET_ZOOM", payload: value[0] })
  }

  // Handle task selection
  const handleSelectTask = (taskId: string | null) => {
    if (taskId) {
      const task = state.tasks.find((t) => t.id === taskId)
      if (task) {
        dispatch({ type: "SELECT_TASK", payload: taskId })
        setTaskDetailDialogOpen(true)
      }
    } else {
      // Deselecting a task
      dispatch({ type: "SELECT_TASK", payload: null })
      setTaskDetailDialogOpen(false)
    }
  }

  // Handle project selection
  const handleSelectProject = (projectId: string) => {
    dispatch({ type: "SELECT_PROJECT", payload: projectId })
    if (isMobile) {
      setMobileSidebarOpen(false)
    }
  }

  // Handle section selection
  const handleSelectSection = (sectionId: string) => {
    dispatch({ type: "SELECT_SECTION", payload: sectionId })
    if (isMobile) {
      setMobileSidebarOpen(false)
    }
  }

  // Handle task update
  const handleUpdateTask = (task: Partial<Task>) => {
    dispatch({ type: "UPDATE_TASK", payload: task })
    notifyDataChange()
  }

  // Handle project update
  const handleUpdateProject = (project: Partial<Project>) => {
    dispatch({ type: "UPDATE_PROJECT", payload: project })
    notifyDataChange()
  }

  // Handle section update
  const handleUpdateSection = (section: Partial<Section>) => {
    dispatch({ type: "UPDATE_SECTION", payload: section })
    notifyDataChange()
  }

  // Handle task status update
  const handleUpdateTaskStatus = (taskId: string, status: "todo" | "in-progress" | "review" | "done") => {
    dispatch({ type: "UPDATE_TASK_STATUS", payload: { taskId, status } })
    notifyDataChange()

    toast({
      title: "Task Updated",
      description: `Task status changed to ${status.replace("-", " ")}`,
      duration: 1500,
    })
  }

  // Handle task dates update
  const handleUpdateTaskDates = (taskId: string, start: Date, end: Date) => {
    dispatch({ type: "UPDATE_TASK_DATES", payload: { taskId, start, end } })
    notifyDataChange()
  }

  // Handle date selection
  const handleSelectDate = (date: Date) => {
    dispatch({ type: "SET_SELECTED_DATE", payload: date })
  }

  // Handle adding a new task
  const handleAddTask = (projectId?: string, sectionId?: string, status?: string) => {
    setTargetProjectId(projectId || null)
    setTargetSectionId(sectionId || null)
    setAddTaskDialogOpen(true)
  }

  // Handle adding a new project
  const handleAddProject = () => {
    setAddProjectDialogOpen(true)
  }

  // Handle adding a new section
  const handleAddSection = (projectId: string) => {
    setTargetProjectId(projectId)
    setAddSectionDialogOpen(true)
  }

  // Handle editing a project
  const handleEditProject = (projectId: string) => {
    const project = state.projects.find((p) => p.id === projectId)
    if (project) {
      // Implement edit functionality
      console.log("Edit project", project)
      toast({
        title: "Edit Project",
        description: `Editing project: ${project.name}`,
      })
    }
  }

  // Handle editing a section
  const handleEditSection = (sectionId: string) => {
    const section = state.sections.find((s) => s.id === sectionId)
    if (section) {
      // Implement edit functionality
      console.log("Edit section", section)
      toast({
        title: "Edit Section",
        description: `Editing section: ${section.name}`,
      })
    }
  }

  // Handle deleting a project
  const handleDeleteProject = (projectId: string) => {
    if (
      confirm("Are you sure you want to delete this project? All tasks and sections within it will also be deleted.")
    ) {
      dispatch({ type: "DELETE_PROJECT", payload: projectId })
      notifyDataChange()

      toast({
        title: "Project Deleted",
        description: "The project and all associated items have been deleted.",
      })
    }
  }

  // Handle deleting a section
  const handleDeleteSection = (sectionId: string) => {
    if (confirm("Are you sure you want to delete this section? All tasks within it will also be deleted.")) {
      dispatch({ type: "DELETE_SECTION", payload: sectionId })
      notifyDataChange()

      toast({
        title: "Section Deleted",
        description: "The section and all associated tasks have been deleted.",
      })
    }
  }

  // Handle deleting a task
  const handleDeleteTask = (taskId: string) => {
    dispatch({ type: "DELETE_TASK", payload: taskId })
    notifyDataChange()

    toast({
      title: "Task Deleted",
      description: "The task has been deleted.",
    })
  }

  // Handle task creation from dialog
  const handleCreateTask = (taskData: Omit<Task, "id">) => {
    try {
      if (!taskData.name.trim()) {
        toast({
          title: "Invalid task name",
          description: "Task name cannot be empty",
          variant: "destructive",
        })
        return
      }

      // Validate dates
      if (taskData.start > taskData.end) {
        toast({
          title: "Invalid date range",
          description: "End date must be after start date",
          variant: "destructive",
        })
        return
      }

      const newTask: Task = {
        ...taskData,
        id: uuidv4(),
        projectId: targetProjectId || undefined,
        sectionId: targetSectionId || undefined,
      }

      console.log("Creating new task:", newTask)
      dispatch({ type: "ADD_TASK", payload: newTask })
      console.log("Tasks after adding:", stateRef.current.tasks)

      // Force update to ensure components re-render
      setTimeout(() => {
        notifyDataChange()
        forceRender()
      }, 0)

      setAddTaskDialogOpen(false)
      toast({
        title: "Task Created",
        description: `"${newTask.name}" has been created.`,
      })
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle project creation from dialog
  const handleCreateProject = (projectData: Omit<Project, "id">) => {
    const newProject: Project = {
      ...projectData,
      id: uuidv4(),
      status: "active", // Default status for new projects
    }

    dispatch({ type: "ADD_PROJECT", payload: newProject })
    notifyDataChange()

    setAddProjectDialogOpen(false)
    toast({
      title: "Project Created",
      description: `"${newProject.name}" has been created.`,
    })
  }

  // Handle section creation from dialog
  const handleCreateSection = (sectionData: Omit<Section, "id" | "projectId">) => {
    if (!targetProjectId) return

    const newSection: Section = {
      ...sectionData,
      id: uuidv4(),
      projectId: targetProjectId,
    }

    dispatch({ type: "ADD_SECTION", payload: newSection })
    notifyDataChange()

    setAddSectionDialogOpen(false)
    toast({
      title: "Section Created",
      description: `"${newSection.name}" has been created.`,
    })
  }

  // Handle team members update
  const handleUpdateTeamMembers = (users: any[]) => {
    try {
      // Update users in state
      dispatch({ type: "SET_USERS", payload: users })
      setLocalStorage(TEAM_STORAGE_KEY, users)

      toast({
        title: "Team Updated",
        description: `Team members have been updated.`,
      })

      // Force a re-render to ensure UI is updated properly
      setTimeout(() => {
        forceRender()
      }, 0)
    } catch (error) {
      console.error("Error updating team members:", error)
      toast({
        title: "Error",
        description: "Failed to update team members. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get the selected task
  const selectedTask = state.selectedTask ? state.tasks.find((task) => task.id === state.selectedTask) : null

  // Filter tasks based on search query and selected user
  const getFilteredTasks = useCallback(() => {
    let filtered = [...state.tasks]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)),
      )
    }

    // Filter by selected user
    if (selectedUser) {
      filtered = filtered.filter((task) => task.assignees && task.assignees.includes(selectedUser))
    }

    return filtered
  }, [state.tasks, searchQuery, selectedUser])

  // Get filtered tasks for rendering
  const filteredTasks = getFilteredTasks()

  // Render the current view
  const renderCurrentView = () => {
    // Force re-render by using the forceUpdate counter
    const key = `view-${state.currentView}-${forceUpdate}`

    switch (state.currentView) {
      case "gantt":
        return (
          <GanttView
            key={key}
            tasks={filteredTasks}
            links={state.links}
            projects={state.projects}
            sections={state.sections}
            zoomLevel={state.zoomLevel}
            selectedTask={state.selectedTask}
            onSelectTask={handleSelectTask}
            onUpdateTask={handleUpdateTask}
            onUpdateTaskDates={handleUpdateTaskDates}
            isMobile={isMobile}
          />
        )
      case "board":
        return (
          <BoardView
            key={key}
            tasks={filteredTasks}
            projects={state.projects}
            sections={state.sections}
            onSelectTask={handleSelectTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onAddTask={(status) => handleAddTask(undefined, undefined, status)}
            users={state.users}
            isMobile={isMobile}
          />
        )
      case "calendar":
        return (
          <CalendarView
            key={key}
            tasks={filteredTasks}
            projects={state.projects}
            sections={state.sections}
            onSelectTask={handleSelectTask}
            selectedDate={state.selectedDate}
            onSelectDate={handleSelectDate}
            onAddTask={(date) => {
              handleSelectDate(date)
              handleAddTask()
            }}
            isMobile={isMobile}
          />
        )
      case "list":
        return (
          <ListView
            key={key}
            tasks={filteredTasks}
            projects={state.projects}
            sections={state.sections}
            users={state.users}
            onSelectTask={handleSelectTask}
            onUpdateTask={handleUpdateTask}
            onAddTask={() => handleAddTask()}
            isMobile={isMobile}
          />
        )
      default:
        return null
    }
  }

  // Add a useEffect to handle dialog state cleanup
  useEffect(() => {
    if (!teamMembersDialogOpen) {
      // Any cleanup needed when team members dialog closes
      setSelectedUser(null)
    }
  }, [teamMembersDialogOpen])

  // Render mobile sidebar
  const renderMobileSidebar = () => {
    return (
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[85vw] max-w-[300px]">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">Projects</h2>
              <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <ProjectSidebar
                key={`sidebar-mobile-${forceUpdate}`}
                projects={state.projects}
                sections={state.sections}
                tasks={state.tasks}
                selectedProject={state.selectedProject}
                selectedSection={state.selectedSection}
                selectedTask={state.selectedTask}
                onSelectProject={handleSelectProject}
                onSelectSection={handleSelectSection}
                onSelectTask={handleSelectTask}
                onAddProject={handleAddProject}
                onAddSection={handleAddSection}
                onAddTask={handleAddTask}
                onEditProject={handleEditProject}
                onEditSection={handleEditSection}
                onDeleteProject={handleDeleteProject}
                onDeleteSection={handleDeleteSection}
                state={state}
                dispatch={dispatch}
                onTaskSelect={handleSelectTask}
                selectedTaskId={state.selectedTask}
                isMobile={true}
              />
            </div>
            <div className="mt-auto border-t">
              <TeamMembersList
                users={state.users}
                onManageTeam={() => {
                  setTeamMembersDialogOpen(true)
                  setMobileSidebarOpen(false)
                }}
                onSelectUser={(userId) => {
                  setSelectedUser(userId)
                  setMobileSidebarOpen(false)
                }}
                selectedUserId={selectedUser}
                className="border-0 rounded-none"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Render mobile filter panel
  const renderMobileFilter = () => {
    return (
      <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Filter className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[85vw] max-w-[300px]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setMobileFilterOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Search</h3>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {selectedUser && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Assigned To</h3>
                  <Badge variant="secondary" className="gap-1">
                    {state.users.find((u) => u.id === selectedUser)?.name}
                    <button className="ml-1 rounded-full hover:bg-muted" onClick={() => setSelectedUser(null)}>
                      ×
                    </button>
                  </Badge>
                </div>
              )}

              {state.currentView === "gantt" && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Zoom Level</h3>
                  <Slider value={[state.zoomLevel]} min={10} max={100} step={10} onValueChange={handleZoomChange} />
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedUser(null)
                  setMobileFilterOpen(false)
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Project Sidebar - Desktop */}
      {sidebarVisible && !isMobile && (
        <div className="hidden md:flex flex-col h-full border-r" style={{ width: "300px" }}>
          <div className="flex-1 overflow-auto">
            <ProjectSidebar
              key={`sidebar-${forceUpdate}`}
              projects={state.projects}
              sections={state.sections}
              tasks={state.tasks}
              selectedProject={state.selectedProject}
              selectedSection={state.selectedSection}
              selectedTask={state.selectedTask}
              onSelectProject={handleSelectProject}
              onSelectSection={handleSelectSection}
              onSelectTask={handleSelectTask}
              onAddProject={handleAddProject}
              onAddSection={handleAddSection}
              onAddTask={handleAddTask}
              onEditProject={handleEditProject}
              onEditSection={handleEditSection}
              onDeleteProject={handleDeleteProject}
              onDeleteSection={handleDeleteSection}
              state={state}
              dispatch={dispatch}
              onTaskSelect={handleSelectTask}
              selectedTaskId={state.selectedTask}
            />
          </div>

          <div className="mt-auto border-t">
            <TeamMembersList
              users={state.users}
              onManageTeam={() => setTeamMembersDialogOpen(true)}
              onSelectUser={setSelectedUser}
              selectedUserId={selectedUser}
              className="border-0 rounded-none"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Card className="flex-1 border-0 rounded-none shadow-none">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-2 md:p-4 border-b flex flex-col gap-2 md:gap-4">
              <div className="flex items-center justify-between">
                {/* Mobile sidebar toggle */}
                {isMobile && renderMobileSidebar()}

                {/* View tabs */}
                <Tabs
                  defaultValue={state.currentView}
                  onValueChange={(value) => handleViewChange(value as ViewType)}
                  className="flex-1 flex justify-center md:justify-start"
                >
                  <TabsList className="grid grid-cols-4 w-full max-w-[300px]">
                    <TabsTrigger value="gantt" className="flex items-center gap-1.5">
                      <BarChart2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Gantt</span>
                    </TabsTrigger>
                    <TabsTrigger value="board" className="flex items-center gap-1.5">
                      <KanbanSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">Board</span>
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Calendar</span>
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-1.5">
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">List</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                  {/* Desktop sidebar toggle */}
                  {!isMobile && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSidebarVisible(!sidebarVisible)}
                            className="h-8 w-8 hidden md:flex"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Add task button */}
                  <Button onClick={() => handleAddTask()} size="sm" className="h-8">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Add Task</span>
                  </Button>

                  {/* Desktop settings button */}
                  {!isMobile && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="p-2">
                          <p className="text-sm font-medium mb-2">View Options</p>
                          {state.currentView === "gantt" && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">Zoom Level</p>
                              <Slider
                                value={[state.zoomLevel]}
                                min={10}
                                max={100}
                                step={10}
                                onValueChange={handleZoomChange}
                              />
                            </div>
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Search and filter bar */}
              <div className="flex items-center gap-2">
                {/* Search input - desktop */}
                <div className="relative flex-1 max-w-md hidden md:block">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Mobile search input - simplified */}
                <div className="flex-1 md:hidden">
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Selected user badge */}
                {selectedUser && (
                  <Badge variant="secondary" className="gap-1 hidden md:flex">
                    {state.users.find((u) => u.id === selectedUser)?.name}
                    <button className="ml-1 rounded-full hover:bg-muted" onClick={() => setSelectedUser(null)}>
                      ×
                    </button>
                  </Badge>
                )}

                {/* Mobile filter button */}
                {isMobile && renderMobileFilter()}

                {/* Desktop filter button */}
                {!isMobile && (
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Main view content */}
            <div className="flex-1 overflow-auto p-2 md:p-4">{renderCurrentView()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetailDialog
          open={taskDetailDialogOpen}
          onOpenChange={(open) => {
            setTaskDetailDialogOpen(open)
            if (!open) {
              // Important: Clear selected task when dialog closes
              dispatch({ type: "SELECT_TASK", payload: null })
            }
          }}
          task={selectedTask}
          projects={state.projects}
          sections={state.sections}
          users={state.users}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={(taskId) => {
            handleDeleteTask(taskId)
            setTaskDetailDialogOpen(false) // Close dialog after deletion
          }}
          isMobile={isMobile}
        />
      )}

      {/* Dialogs */}
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
        onAddTask={handleCreateTask}
        projects={state.projects}
        sections={state.sections}
        defaultProjectId={targetProjectId || undefined}
        defaultSectionId={targetSectionId || undefined}
        isMobile={isMobile}
      />

      <AddProjectDialog
        open={addProjectDialogOpen}
        onOpenChange={setAddProjectDialogOpen}
        onAddProject={handleCreateProject}
        isMobile={isMobile}
      />

      <AddSectionDialog
        open={addSectionDialogOpen}
        onOpenChange={setAddSectionDialogOpen}
        onAddSection={handleCreateSection}
        projects={state.projects}
        defaultProjectId={targetProjectId || undefined}
        isMobile={isMobile}
      />

      <TeamMembersDialog
        open={teamMembersDialogOpen}
        onOpenChange={(open) => {
          setTeamMembersDialogOpen(open)
          if (!open) {
            // Force a re-render after dialog closes to ensure UI responsiveness
            setTimeout(() => {
              forceRender()
            }, 100)
          }
        }}
        users={state.users}
        onSave={handleUpdateTeamMembers}
        tasks={state.tasks}
        projects={state.projects}
        isMobile={isMobile}
      />
    </div>
  )
}
