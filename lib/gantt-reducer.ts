import type { Task, Link, Project, Section, ViewType } from "./gantt-types"

type GanttState = {
  tasks: Task[]
  links: Link[]
  projects: Project[]
  sections: Section[]
  users: any[]
  selectedTask: string | null
  selectedProject: string | null
  selectedSection: string | null
  selectedDate: Date
  zoomLevel: number
  currentView: ViewType
}

type GanttAction =
  | { type: "SET_STATE"; payload: Partial<GanttState> }
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "SET_LINKS"; payload: Link[] }
  | { type: "SET_PROJECTS"; payload: Project[] }
  | { type: "SET_SECTIONS"; payload: Section[] }
  | { type: "SET_USERS"; payload: any[] }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Partial<Task> }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "ADD_PROJECT"; payload: Project }
  | { type: "UPDATE_PROJECT"; payload: Partial<Project> }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "ADD_SECTION"; payload: Section }
  | { type: "UPDATE_SECTION"; payload: Partial<Section> }
  | { type: "DELETE_SECTION"; payload: string }
  | { type: "ADD_LINK"; payload: Link }
  | { type: "DELETE_LINK"; payload: string }
  | { type: "SELECT_TASK"; payload: string | null }
  | { type: "SELECT_PROJECT"; payload: string | null }
  | { type: "SELECT_SECTION"; payload: string | null }
  | { type: "SET_SELECTED_DATE"; payload: Date }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "SET_VIEW"; payload: ViewType }
  | { type: "UPDATE_TASK_STATUS"; payload: { taskId: string; status: "todo" | "in-progress" | "review" | "done" } }
  | { type: "UPDATE_TASK_DATES"; payload: { taskId: string; start: Date; end: Date } }

export const ganttReducer = (state: GanttState, action: GanttAction): GanttState => {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload }
    case "SET_TASKS": {
      // Ensure dates are properly parsed
      const tasks = action.payload.map((task) => ({
        ...task,
        start: task.start instanceof Date ? task.start : new Date(task.start),
        end: task.end instanceof Date ? task.end : new Date(task.end),
      }))
      return { ...state, tasks }
    }
    case "SET_LINKS":
      return { ...state, links: action.payload }
    case "SET_PROJECTS": {
      // Ensure dates are properly parsed
      const projects = action.payload.map((project) => ({
        ...project,
        start: project.start instanceof Date ? project.start : new Date(project.start),
        end: project.end instanceof Date ? project.end : new Date(project.end),
      }))
      return { ...state, projects }
    }
    case "SET_SECTIONS":
      return { ...state, sections: action.payload }
    case "SET_USERS":
      return { ...state, users: action.payload }
    case "ADD_TASK": {
      // Ensure we're creating a new array to trigger re-renders
      // Also ensure dates are properly parsed
      const newTask = {
        ...action.payload,
        start: action.payload.start instanceof Date ? action.payload.start : new Date(action.payload.start),
        end: action.payload.end instanceof Date ? action.payload.end : new Date(action.payload.end),
      }
      const newTasks = [...state.tasks, newTask]
      console.log("Adding task:", newTask.name, "New task count:", newTasks.length)
      return { ...state, tasks: newTasks }
    }
    case "UPDATE_TASK": {
      const updatedTasks = state.tasks.map((task) =>
        task.id === action.payload.id
          ? {
              ...task,
              ...action.payload,
              // Ensure dates are properly parsed if they exist in the payload
              ...(action.payload.start && {
                start: action.payload.start instanceof Date ? action.payload.start : new Date(action.payload.start),
              }),
              ...(action.payload.end && {
                end: action.payload.end instanceof Date ? action.payload.end : new Date(action.payload.end),
              }),
            }
          : task,
      )
      return { ...state, tasks: updatedTasks }
    }
    case "DELETE_TASK": {
      const filteredTasks = state.tasks.filter((task) => task.id !== action.payload)
      // Also delete any links that reference this task
      const filteredLinks = state.links.filter(
        (link) => link.source !== action.payload && link.target !== action.payload,
      )
      return { ...state, tasks: filteredTasks, links: filteredLinks }
    }
    case "ADD_PROJECT": {
      // Ensure dates are properly parsed
      const newProject = {
        ...action.payload,
        start: action.payload.start instanceof Date ? action.payload.start : new Date(action.payload.start),
        end: action.payload.end instanceof Date ? action.payload.end : new Date(action.payload.end),
      }
      return { ...state, projects: [...state.projects, newProject] }
    }
    case "UPDATE_PROJECT": {
      const updatedProjects = state.projects.map((project) =>
        project.id === action.payload.id
          ? {
              ...project,
              ...action.payload,
              // Ensure dates are properly parsed if they exist in the payload
              ...(action.payload.start && {
                start: action.payload.start instanceof Date ? action.payload.start : new Date(action.payload.start),
              }),
              ...(action.payload.end && {
                end: action.payload.end instanceof Date ? action.payload.end : new Date(action.payload.end),
              }),
            }
          : project,
      )
      return { ...state, projects: updatedProjects }
    }
    case "DELETE_PROJECT": {
      const filteredProjects = state.projects.filter((project) => project.id !== action.payload)
      // Also delete any sections and tasks that belong to this project
      const filteredSections = state.sections.filter((section) => section.projectId !== action.payload)
      const filteredTasks = state.tasks.filter((task) => task.projectId !== action.payload)
      return {
        ...state,
        projects: filteredProjects,
        sections: filteredSections,
        tasks: filteredTasks,
      }
    }
    case "ADD_SECTION":
      return { ...state, sections: [...state.sections, action.payload] }
    case "UPDATE_SECTION": {
      const updatedSections = state.sections.map((section) =>
        section.id === action.payload.id ? { ...section, ...action.payload } : section,
      )
      return { ...state, sections: updatedSections }
    }
    case "DELETE_SECTION": {
      const filteredSections = state.sections.filter((section) => section.id !== action.payload)
      // Also delete any tasks that belong to this section
      const filteredTasks = state.tasks.filter((task) => task.sectionId !== action.payload)
      return { ...state, sections: filteredSections, tasks: filteredTasks }
    }
    case "ADD_LINK":
      return { ...state, links: [...state.links, action.payload] }
    case "DELETE_LINK": {
      const filteredLinks = state.links.filter((link) => link.id !== action.payload)
      return { ...state, links: filteredLinks }
    }
    case "SELECT_TASK":
      return { ...state, selectedTask: action.payload }
    case "SELECT_PROJECT":
      return { ...state, selectedProject: action.payload }
    case "SELECT_SECTION":
      return { ...state, selectedSection: action.payload }
    case "SET_SELECTED_DATE":
      return { ...state, selectedDate: action.payload }
    case "SET_ZOOM":
      return { ...state, zoomLevel: action.payload }
    case "SET_VIEW":
      return { ...state, currentView: action.payload }
    case "UPDATE_TASK_STATUS": {
      const { taskId, status } = action.payload
      const updatedTasks = state.tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
      return { ...state, tasks: updatedTasks }
    }
    case "UPDATE_TASK_DATES": {
      const { taskId, start, end } = action.payload
      const updatedTasks = state.tasks.map((task) => (task.id === taskId ? { ...task, start, end } : task))
      return { ...state, tasks: updatedTasks }
    }
    default:
      return state
  }
}
