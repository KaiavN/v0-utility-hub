"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Gantt } from "@/components/gantt/gantt"
import { Button } from "@/components/ui/button"
import { Plus, Settings, ImportIcon as FileImport, FileOutputIcon as FileExport } from "lucide-react"
import type { Task, Link, Project, Section } from "@/lib/gantt-types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AddProjectDialog from "@/components/dialog/add-project-dialog"
import { v4 as uuidv4 } from "uuid"
import { toast } from "@/hooks/use-toast"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { GanttSettingsDialog, type GanttSettings } from "@/components/gantt/settings-dialog"
// Import the validation function
import { validateGanttData } from "@/lib/data-validation"

const STORAGE_KEY = "ganttData"
const SETTINGS_KEY = "ganttSettings"

// Helper function to safely parse dates
function safelyParseDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString) return undefined

  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`)
      return undefined
    }
    return date
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error)
    return undefined
  }
}

export default function GanttChartPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const savedProjects = getLocalStorage<Project[]>(STORAGE_KEY)
      return savedProjects || []
    } catch (e) {
      return []
    }
  })
  const [sections, setSections] = useState<Section[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [ganttSettings, setGanttSettings] = useState<GanttSettings>(() => {
    try {
      const savedSettings = getLocalStorage(SETTINGS_KEY)
      return (
        savedSettings || {
          defaultView: "gantt",
          defaultZoomLevel: 50,
          showCompletedTasks: true,
          showDependencies: true,
          highlightCriticalPath: false,
          showTaskLabels: true,
          taskBarHeight: 32,
          columnWidth: 60,
          autoSchedule: false,
          snapToGrid: true,
          colorScheme: "default",
        }
      )
    } catch (error) {
      console.error("Error loading gantt settings:", error)
      return {
        defaultView: "gantt",
        defaultZoomLevel: 50,
        showCompletedTasks: true,
        showDependencies: true,
        highlightCriticalPath: false,
        showTaskLabels: true,
        taskBarHeight: 32,
        columnWidth: 60,
        autoSchedule: false,
        snapToGrid: true,
        colorScheme: "default",
      }
    }
  })
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = getLocalStorage(STORAGE_KEY)
      if (savedData) {
        // Validate and fix the Gantt data
        const validatedData = validateGanttData(savedData)

        // Parse dates from JSON with error handling
        const parsedProjects = validatedData.projects.map((project: any) => ({
          ...project,
          start: project.start instanceof Date ? project.start : safelyParseDate(project.start),
          end: project.end instanceof Date ? project.end : safelyParseDate(project.end),
        }))

        const parsedTasks = validatedData.tasks.map((task: any) => ({
          ...task,
          start: task.start instanceof Date ? task.start : safelyParseDate(task.start),
          end: task.end instanceof Date ? task.end : safelyParseDate(task.end),
        }))

        setProjects(parsedProjects || [])
        setSections(validatedData.sections || [])
        setTasks(parsedTasks || [])
        setLinks(validatedData.links || [])

        // Save the validated data back to localStorage
        setLocalStorage(STORAGE_KEY, {
          projects: parsedProjects,
          sections: validatedData.sections,
          tasks: parsedTasks,
          links: validatedData.links,
          lastUpdated: new Date().toISOString(),
        })
      } else {
        // Initialize with empty arrays if no saved data exists
        setProjects([])
        setSections([])
        setTasks([])
        setLinks([])
      }
      setDataLoaded(true)
    } catch (error) {
      console.error("Error loading gantt data:", error)
      // Fallback to empty arrays on error
      setProjects([])
      setSections([])
      setTasks([])
      setLinks([])
      setDataLoaded(true)

      // Show error toast
      toast({
        title: "Error loading data",
        description: "There was a problem loading your Gantt chart data. Starting with empty data.",
        variant: "destructive",
      })
    }
  }, [])

  // Filter projects when activeTab or projects change
  useEffect(() => {
    if (dataLoaded) {
      filterProjectsByTab(activeTab)
    }
  }, [activeTab, projects, dataLoaded])

  // Add an effect to scroll to today when the component mounts
  useEffect(() => {
    // Find the today element and scroll to it
    const todayElement = document.querySelector(".bg-red-100, .dark\\:bg-red-900\\/30")
    if (todayElement) {
      todayElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
    }
  }, [])

  // Save data to localStorage whenever it changes
  const saveData = useCallback(() => {
    if (dataLoaded) {
      setLocalStorage(STORAGE_KEY, {
        projects,
        sections,
        tasks,
        links,
        lastUpdated: new Date().toISOString(),
      })
    }
  }, [projects, sections, tasks, links, dataLoaded])

  // Save data when it changes
  useEffect(() => {
    saveData()
  }, [projects, sections, tasks, links, saveData])

  const handleUpdateData = useCallback(
    (data: {
      tasks: Task[]
      links: Link[]
      projects: Project[]
      sections: Section[]
    }) => {
      // Use functional updates to ensure we're always using the latest state
      setTasks((currentTasks) => {
        // Only update if there's an actual change to avoid infinite loops
        if (JSON.stringify(currentTasks) !== JSON.stringify(data.tasks)) {
          return data.tasks
        }
        return currentTasks
      })

      setLinks((currentLinks) => {
        if (JSON.stringify(currentLinks) !== JSON.stringify(data.links)) {
          return data.links
        }
        return currentLinks
      })

      setProjects((currentProjects) => {
        if (JSON.stringify(currentProjects) !== JSON.stringify(data.projects)) {
          return data.projects
        }
        return currentProjects
      })

      setSections((currentSections) => {
        if (JSON.stringify(currentSections) !== JSON.stringify(data.sections)) {
          return data.sections
        }
        return currentSections
      })

      // Save to localStorage
      setLocalStorage(STORAGE_KEY, {
        projects: data.projects,
        sections: data.sections,
        tasks: data.tasks,
        links: data.links,
        lastUpdated: new Date().toISOString(),
      })
    },
    [],
  )

  // Add a new useEffect to listen for gantt-data-updated events
  const filterProjectsByTab = useCallback(
    (tab: string) => {
      setActiveTab(tab)

      if (tab === "all") {
        setFilteredProjects(projects)
      } else {
        setFilteredProjects(projects.filter((project) => project.status === tab))
      }
    },
    [projects],
  )

  useEffect(() => {
    const handleGanttDataUpdated = (event: CustomEvent) => {
      console.log("Gantt page received data updated event:", event.detail)

      if (event.detail) {
        const {
          projects: updatedProjects,
          sections: updatedSections,
          tasks: updatedTasks,
          links: updatedLinks,
        } = event.detail

        // Parse dates for projects
        const parsedProjects =
          updatedProjects?.map((project: any) => ({
            ...project,
            start: project.start ? new Date(project.start) : undefined,
            end: project.end ? new Date(project.end) : undefined,
          })) || []

        // Parse dates for tasks
        const parsedTasks =
          updatedTasks?.map((task: any) => ({
            ...task,
            start: task.start ? new Date(task.start) : undefined,
            end: task.end ? new Date(task.end) : undefined,
          })) || []

        // Update state
        setProjects(parsedProjects)
        setSections(updatedSections || [])
        setTasks(parsedTasks)
        setLinks(updatedLinks || [])

        // Save to localStorage
        setLocalStorage(STORAGE_KEY, {
          projects: parsedProjects,
          sections: updatedSections || [],
          tasks: parsedTasks,
          links: updatedLinks || [],
          lastUpdated: new Date().toISOString(),
        })

        // Update filtered projects
        filterProjectsByTab(activeTab)
      }
    }

    // Add event listener
    window.addEventListener("gantt-data-updated", handleGanttDataUpdated as EventListener)

    // Clean up
    return () => {
      window.removeEventListener("gantt-data-updated", handleGanttDataUpdated as EventListener)
    }
  }, [activeTab, filterProjectsByTab])

  const handleCreateProject = (projectData: Omit<Project, "id">) => {
    const newProject: Project = {
      ...projectData,
      id: uuidv4(),
      status: "active", // Default status for new projects
    }

    const updatedProjects = [...projects, newProject]
    setProjects(updatedProjects)
    setAddProjectDialogOpen(false)

    toast({
      title: "Project created",
      description: `"${newProject.name}" has been created successfully.`,
    })
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (data.projects && data.sections && data.tasks && data.links) {
            // Parse dates from JSON with error handling
            const parsedProjects = data.projects.map((project: any) => ({
              ...project,
              start: safelyParseDate(project.start),
              end: safelyParseDate(project.end),
            }))

            const parsedTasks = data.tasks.map((task: any) => ({
              ...task,
              start: safelyParseDate(task.start),
              end: safelyParseDate(task.end),
            }))

            setProjects(parsedProjects)
            setSections(data.sections)
            setTasks(parsedTasks)
            setLinks(data.links)

            toast({
              title: "Import successful",
              description: `Imported ${data.projects.length} projects and ${data.tasks.length} tasks.`,
            })
          } else {
            toast({
              title: "Import failed",
              description: "The file format is invalid.",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error importing data:", error)
          toast({
            title: "Import failed",
            description: "Could not parse the file. Please check the format.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleExport = () => {
    const data = {
      projects,
      sections,
      tasks,
      links,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `gantt-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: `Exported ${projects.length} projects and ${tasks.length} tasks.`,
    })
  }

  const handleSettings = () => {
    setSettingsDialogOpen(true)
  }

  const handleSettingsChange = (newSettings: GanttSettings) => {
    setGanttSettings(newSettings)
    setLocalStorage(SETTINGS_KEY, newSettings)

    toast({
      title: "Settings Updated",
      description: "Your Gantt chart settings have been saved.",
    })
  }

  useEffect(() => {
    if (dataLoaded) {
      filterProjectsByTab(activeTab)
    }
  }, [activeTab, projects, dataLoaded, filterProjectsByTab])

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto py-4 px-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold leading-tight">Project Management</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your projects, tasks, and timelines</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleImport} className="gap-1">
                  <FileImport className="h-4 w-4" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
                  <FileExport className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSettings} className="gap-1">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
                <Button onClick={() => setAddProjectDialogOpen(true)} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  <span>New Project</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Tabs defaultValue={activeTab} onValueChange={filterProjectsByTab} className="w-full max-w-md">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="all">All Projects</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {dataLoaded && (
          <Gantt
            tasks={tasks}
            links={links}
            projects={filteredProjects}
            sections={sections}
            onUpdateData={handleUpdateData}
          />
        )}
      </div>

      <GanttSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        onSettingsChange={handleSettingsChange}
        initialSettings={ganttSettings}
      />

      <AddProjectDialog
        open={addProjectDialogOpen}
        onOpenChange={setAddProjectDialogOpen}
        onAddProject={handleCreateProject}
      />
    </div>
  )
}
