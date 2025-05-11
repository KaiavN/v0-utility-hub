import type { ItemType } from "./linked-items-types"

// Get the URL for a specific item type and ID
export function getItemUrl(type: ItemType, id: string): string {
  switch (type) {
    case "task":
      return `/tasks?id=${id}`
    case "project":
      return `/projects?id=${id}`
    case "ganttTask":
      return `/gantt?taskId=${id}`
    case "ganttProject":
      return `/gantt?projectId=${id}`
    case "client":
      return `/clients?id=${id}`
    case "note":
      return `/knowledge-base?id=${id}` // Updated path
    case "meeting":
      return `/meetings?id=${id}`
    case "billing":
      return `/billing?id=${id}`
    case "contact":
      return `/contacts?id=${id}`
    case "document":
      return `/markdown?id=${id}`
    case "assignment":
      return `/assignments?id=${id}`
    case "event":
      return `/calendar?id=${id}`
    case "codeSnippet":
      return `/code-snippets?id=${id}`
    case "finance":
      return `/finance?transaction=${id}`
    default:
      return "#"
  }
}

// Get a human-readable name for an item type
export function getItemTypeName(type: ItemType): string {
  switch (type) {
    case "task":
      return "Task"
    case "project":
      return "Project"
    case "ganttTask":
      return "Gantt Task"
    case "ganttProject":
      return "Gantt Project"
    case "client":
      return "Client"
    case "note":
      return "Note"
    case "meeting":
      return "Meeting"
    case "billing":
      return "Invoice"
    case "contact":
      return "Contact"
    case "document":
      return "Document"
    case "assignment":
      return "Assignment"
    case "event":
      return "Event"
    case "codeSnippet":
      return "Code Snippet"
    case "finance":
      return "Finance"
    default:
      return "Item"
  }
}

// Get the icon for an item type
export function getItemTypeIcon(type: ItemType): string {
  switch (type) {
    case "task":
      return "CheckSquare"
    case "project":
      return "Briefcase"
    case "ganttTask":
      return "ListTodo"
    case "ganttProject":
      return "GanttChartSquare"
    case "client":
      return "UserCheck"
    case "note":
      return "FileText"
    case "meeting":
      return "Calendar"
    case "billing":
      return "DollarSign"
    case "contact":
      return "Users"
    case "document":
      return "FileText"
    case "assignment":
      return "ClipboardList"
    case "event":
      return "Calendar"
    case "codeSnippet":
      return "Code"
    default:
      return "File"
  }
}
