export interface Task {
  id: string
  name: string
  description?: string
  start: Date
  end: Date
  progress: number
  status: "todo" | "in-progress" | "review" | "done"
  priority: "low" | "medium" | "high"
  assignees?: string[]
  dependencies?: string[]
  color?: string
  projectId?: string
  sectionId?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  status: "active" | "completed" | "archived"
  start?: Date
  end?: Date
}

export interface Section {
  id: string
  name: string
  projectId: string
  color: string
}

export interface Link {
  id: string
  source: string
  target: string
  type: "finish_to_start" | "start_to_start" | "finish_to_finish" | "start_to_finish"
}

export interface User {
  id: string
  name: string
  avatar?: string
  role: string
  color: string
}

export type ViewType = "gantt" | "board" | "calendar" | "list"

export interface GanttState {
  tasks: Task[]
  projects: Project[]
  sections: Section[]
  links: Link[]
  users: User[]
  selectedTask: string | null
  selectedProject: string | null
  selectedSection: string | null
  selectedDate: Date
  zoomLevel: number
  currentView: ViewType
}

export interface GanttAction {
  type: string
  payload?: any
}
