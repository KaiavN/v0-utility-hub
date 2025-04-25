export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate: string
  course: string
  priority: "low" | "medium" | "high"
  status: "todo" | "in-progress" | "completed"
}
