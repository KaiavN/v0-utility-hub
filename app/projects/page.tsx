"use client"

import { useState, useEffect } from "react"
import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { PlusCircle, Trash2, Edit, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Types
interface Project {
  id: string
  name: string
  description: string
  client: string
  startDate: string
  dueDate: string
  status: "planning" | "in-progress" | "on-hold" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  tasks: Task[]
  notes: string
  createdAt: string
  updatedAt: string
}

interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed"
  dueDate: string
  createdAt: string
}

export default function ProjectsPage() {
  // State
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const [newProject, setNewProject] = useState<Omit<Project, "id" | "tasks" | "createdAt" | "updatedAt">>({
    name: "",
    description: "",
    client: "",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "planning",
    priority: "medium",
    notes: "",
  })

  const [newTask, setNewTask] = useState<Omit<Task, "id" | "projectId" | "createdAt">>({
    title: "",
    description: "",
    status: "todo",
    dueDate: "",
  })

  // Load data from localStorage
  useEffect(() => {
    const savedProjects = getLocalStorage<Project[]>("projects", [])

    // Ensure all projects have a tasks array
    const validatedProjects = savedProjects.map((project) => ({
      ...project,
      tasks: Array.isArray(project.tasks) ? project.tasks : [],
    }))

    setProjects(validatedProjects)

    if (validatedProjects.length > 0 && !activeProject) {
      setActiveProject(validatedProjects[0])
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    if (projects.length > 0) {
      setLocalStorage("projects", projects)
    }
  }, [projects])

  // Create new project
  const createProject = () => {
    if (!newProject.name) return

    const now = new Date().toISOString()
    const project: Project = {
      ...newProject,
      id: crypto.randomUUID(),
      tasks: [],
      createdAt: now,
      updatedAt: now,
    }

    const updatedProjects = [...projects, project]
    setProjects(updatedProjects)
    setActiveProject(project)
    setIsNewProjectDialogOpen(false)
    resetNewProject()
  }

  // Update project
  const updateProject = () => {
    if (!activeProject || !activeProject.name) return

    const updatedProjects = projects.map((p) =>
      p.id === activeProject.id ? { ...activeProject, updatedAt: new Date().toISOString() } : p,
    )

    setProjects(updatedProjects)
    setIsEditMode(false)
  }

  // Delete project
  const deleteProject = (id: string) => {
    const updatedProjects = projects.filter((p) => p.id !== id)
    setProjects(updatedProjects)

    if (activeProject?.id === id) {
      setActiveProject(updatedProjects.length > 0 ? updatedProjects[0] : null)
    }
  }

  // Add task to project
  const addTask = () => {
    if (!activeProject || !newTask.title) return

    const task: Task = {
      ...newTask,
      id: crypto.randomUUID(),
      projectId: activeProject.id,
      createdAt: new Date().toISOString(),
    }

    // Ensure tasks array exists before adding to it
    const currentTasks = Array.isArray(activeProject.tasks) ? activeProject.tasks : []

    const updatedProject = {
      ...activeProject,
      tasks: [...currentTasks, task],
      updatedAt: new Date().toISOString(),
    }

    const updatedProjects = projects.map((p) => (p.id === activeProject.id ? updatedProject : p))

    setProjects(updatedProjects)
    setActiveProject(updatedProject)
    setIsNewTaskDialogOpen(false)
    resetNewTask()
  }

  // Update task status
  const updateTaskStatus = (taskId: string, status: "todo" | "in-progress" | "completed") => {
    if (!activeProject) return

    // Ensure tasks array exists
    const currentTasks = Array.isArray(activeProject.tasks) ? activeProject.tasks : []

    const updatedTasks = currentTasks.map((t) => (t.id === taskId ? { ...t, status } : t))

    const updatedProject = {
      ...activeProject,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    }

    const updatedProjects = projects.map((p) => (p.id === activeProject.id ? updatedProject : p))

    setProjects(updatedProjects)
    setActiveProject(updatedProject)
  }

  // Delete task
  const deleteTask = (taskId: string) => {
    if (!activeProject) return

    // Ensure tasks array exists
    const currentTasks = Array.isArray(activeProject.tasks) ? activeProject.tasks : []

    const updatedTasks = currentTasks.filter((t) => t.id !== taskId)

    const updatedProject = {
      ...activeProject,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    }

    const updatedProjects = projects.map((p) => (p.id === activeProject.id ? updatedProject : p))

    setProjects(updatedProjects)
    setActiveProject(updatedProject)
  }

  // Reset form states
  const resetNewProject = () => {
    setNewProject({
      name: "",
      description: "",
      client: "",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      status: "planning",
      priority: "medium",
      notes: "",
    })
  }

  const resetNewTask = () => {
    setNewTask({
      title: "",
      description: "",
      status: "todo",
      dueDate: "",
    })
  }

  // Helper functions
  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "on-hold":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: Project["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTaskStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Calculate completed tasks safely
  const getCompletedTasksCount = (project: Project) => {
    if (!project || !Array.isArray(project.tasks)) return 0
    return project.tasks.filter((t) => t.status === "completed").length
  }

  // Get total tasks count safely
  const getTotalTasksCount = (project: Project) => {
    if (!project || !Array.isArray(project.tasks)) return 0
    return project.tasks.length
  }

  // Calculate progress percentage safely
  const getProgressPercentage = (project: Project) => {
    const total = getTotalTasksCount(project)
    if (total === 0) return 0
    return (getCompletedTasksCount(project) / total) * 100
  }

  return (
    <RoleGuard allowedRoles={["professional"]}>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Project Tracker</h1>
            <p className="text-muted-foreground">Track professional projects and deadlines</p>
          </div>
          <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add the details for your new project.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Input
                    id="client"
                    value={newProject.client}
                    onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                    placeholder="Enter client name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newProject.dueDate}
                      onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newProject.status}
                      onValueChange={(value) => setNewProject({ ...newProject, status: value as Project["status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newProject.priority}
                      onValueChange={(value) =>
                        setNewProject({ ...newProject, priority: value as Project["priority"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Enter project description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newProject.notes}
                    onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                    placeholder="Enter additional notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewProjectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-3">
                <h3 className="text-lg font-medium">No projects yet</h3>
                <p className="text-muted-foreground">Create your first project to get started.</p>
                <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Your active projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-3 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                          activeProject?.id === project.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setActiveProject(project)}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{project.name}</h3>
                          <Badge className={getStatusColor(project.status)}>{project.status.replace("-", " ")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{project.client}</p>
                        {project.dueDate && (
                          <div className="flex items-center mt-2 text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Due: {formatDate(project.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              {activeProject ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{activeProject.name}</CardTitle>
                        <CardDescription>Client: {activeProject.client}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isEditMode ? (
                          <>
                            <Button variant="outline" onClick={() => setIsEditMode(false)}>
                              Cancel
                            </Button>
                            <Button onClick={updateProject}>Save</Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="icon" onClick={() => setIsEditMode(true)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => deleteProject(activeProject.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="overview">
                      <TabsList className="mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview">
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                              {isEditMode ? (
                                <Select
                                  value={activeProject.status}
                                  onValueChange={(value) =>
                                    setActiveProject({
                                      ...activeProject,
                                      status: value as Project["status"],
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="planning">Planning</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="on-hold">On Hold</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge className={getStatusColor(activeProject.status)}>
                                  {activeProject.status.replace("-", " ")}
                                </Badge>
                              )}
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Priority</h3>
                              {isEditMode ? (
                                <Select
                                  value={activeProject.priority}
                                  onValueChange={(value) =>
                                    setActiveProject({
                                      ...activeProject,
                                      priority: value as Project["priority"],
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge className={getPriorityColor(activeProject.priority)}>
                                  {activeProject.priority}
                                </Badge>
                              )}
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Start Date</h3>
                              {isEditMode ? (
                                <Input
                                  type="date"
                                  value={activeProject.startDate}
                                  onChange={(e) =>
                                    setActiveProject({
                                      ...activeProject,
                                      startDate: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <p>{formatDate(activeProject.startDate)}</p>
                              )}
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h3>
                              {isEditMode ? (
                                <Input
                                  type="date"
                                  value={activeProject.dueDate}
                                  onChange={(e) =>
                                    setActiveProject({
                                      ...activeProject,
                                      dueDate: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <div className="flex items-center">
                                  {activeProject.dueDate ? (
                                    <>
                                      <p>{formatDate(activeProject.dueDate)}</p>
                                      {activeProject.dueDate && new Date(activeProject.dueDate) > new Date() && (
                                        <Badge variant="outline" className="ml-2">
                                          {getDaysRemaining(activeProject.dueDate)} days left
                                        </Badge>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-muted-foreground">Not set</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                            {isEditMode ? (
                              <Textarea
                                value={activeProject.description}
                                onChange={(e) =>
                                  setActiveProject({
                                    ...activeProject,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Enter project description"
                              />
                            ) : (
                              <p className="whitespace-pre-line">
                                {activeProject.description || "No description provided."}
                              </p>
                            )}
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Progress</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Tasks Completed</span>
                                <span>
                                  {getCompletedTasksCount(activeProject)} / {getTotalTasksCount(activeProject)}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{
                                    width: `${getProgressPercentage(activeProject)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="tasks">
                        <div className="space-y-4">
                          <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
                            <DialogTrigger asChild>
                              <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Task
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Task</DialogTitle>
                                <DialogDescription>Add a new task to this project.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="title">Task Title</Label>
                                  <Input
                                    id="title"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    placeholder="Enter task title"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="task-description">Description</Label>
                                  <Textarea
                                    id="task-description"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    placeholder="Enter task description"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="task-dueDate">Due Date</Label>
                                  <Input
                                    id="task-dueDate"
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={addTask}>Add Task</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {!activeProject.tasks || activeProject.tasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No tasks yet. Add some tasks to track your progress.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {activeProject.tasks.map((task) => (
                                <Card key={task.id}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <div className="flex items-center">
                                          <h3 className="font-medium">{task.title}</h3>
                                          <Badge className={`ml-2 ${getTaskStatusColor(task.status)}`}>
                                            {task.status.replace("-", " ")}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{task.description}</p>
                                        {task.dueDate && (
                                          <div className="flex items-center text-sm">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            <span>Due: {formatDate(task.dueDate)}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Select
                                          value={task.status}
                                          onValueChange={(value) => updateTaskStatus(task.id, value as Task["status"])}
                                        >
                                          <SelectTrigger className="h-8 w-[110px]">
                                            <SelectValue placeholder="Status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="todo">To Do</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="notes">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Project Notes</h3>
                            {isEditMode ? (
                              <Textarea
                                value={activeProject.notes}
                                onChange={(e) =>
                                  setActiveProject({
                                    ...activeProject,
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="Enter project notes"
                                className="min-h-[200px]"
                              />
                            ) : (
                              <div className="p-4 border rounded-md min-h-[200px] whitespace-pre-line">
                                {activeProject.notes || "No notes added yet."}
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div>Created: {formatDate(activeProject.createdAt)}</div>
                      <div>Updated: {formatDate(activeProject.updatedAt)}</div>
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Select a project to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
