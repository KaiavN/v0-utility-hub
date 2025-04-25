import { performDataEdit } from "./data-editor"
import { getDataSchema } from "./data-schemas"
import type { DataSchema } from "./data-schemas"
import { eventBus } from "./event-bus"

// Define the data edit operation type
export interface DataEditOperation {
  type: "add" | "update" | "delete"
  collection: string
  id?: string
  query?: Record<string, any>
  data?: Record<string, any>
}

// Process a data edit operation
export async function processDataEditOperation(operation: DataEditOperation) {
  try {
    // Validate the operation
    const validationResult = validateDataEditOperation(operation)
    if (!validationResult.valid) {
      return {
        success: false,
        message: `Invalid data edit operation: ${validationResult.message}`,
      }
    }

    // Special handling for contacts to ensure firstName is set
    if (operation.collection === "contacts" && operation.type === "add" && operation.data) {
      // Extract name from fullName if available
      if (operation.data.fullName) {
        const nameParts = operation.data.fullName.split(" ")
        if (nameParts.length >= 2) {
          operation.data.firstName = nameParts[0]
          operation.data.lastName = nameParts.slice(1).join(" ")
        } else {
          operation.data.firstName = operation.data.fullName
          operation.data.lastName = ""
        }
        delete operation.data.fullName
      } else if (!operation.data.firstName) {
        // Set default value if no firstName is available
        operation.data.firstName = "New"
      }

      // Ensure lastName is never undefined
      if (operation.data.lastName === undefined) {
        operation.data.lastName = ""
      }
    }

    // Special handling for dates to ensure proper format
    if (operation.data) {
      operation.data = formatDates(operation.data, operation.collection)
    }

    // Process the operation
    const result = await performDataEdit(operation)

    // Emit an event for the operation
    eventBus.publish(`data:${operation.collection}:operation`, {
      type: operation.type,
      result,
    })

    return result
  } catch (error) {
    console.error("Error processing data edit operation:", error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Improve the formatDates function to better handle Gantt data
function formatDates(data: Record<string, any>, collection: string): Record<string, any> {
  const result = { ...data }
  const schema = getDataSchema()[collection]

  if (!schema || !schema.format) return result

  // Special handling for ganttData
  if (collection === "ganttData") {
    // Process projects
    if (result.projects && Array.isArray(result.projects)) {
      result.projects = result.projects.map((project: any) => {
        const updatedProject = { ...project }

        // Format start date
        if (updatedProject.start) {
          try {
            const date = new Date(updatedProject.start)
            if (!isNaN(date.getTime())) {
              updatedProject.start = date.toISOString()
            }
          } catch (e) {
            console.warn(`Could not format start date for project:`, e)
          }
        }

        // Format end date
        if (updatedProject.end) {
          try {
            const date = new Date(updatedProject.end)
            if (!isNaN(date.getTime())) {
              updatedProject.end = date.toISOString()
            }
          } catch (e) {
            console.warn(`Could not format end date for project:`, e)
          }
        }

        return updatedProject
      })
    }

    // Process tasks
    if (result.tasks && Array.isArray(result.tasks)) {
      result.tasks = result.tasks.map((task: any) => {
        const updatedTask = { ...task }

        // Format start date
        if (updatedTask.start) {
          try {
            const date = new Date(updatedTask.start)
            if (!isNaN(date.getTime())) {
              updatedTask.start = date.toISOString()
            }
          } catch (e) {
            console.warn(`Could not format start date for task:`, e)
          }
        }

        // Format end date
        if (updatedTask.end) {
          try {
            const date = new Date(updatedTask.end)
            if (!isNaN(date.getTime())) {
              updatedTask.end = date.toISOString()
            }
          } catch (e) {
            console.warn(`Could not format end date for task:`, e)
          }
        }

        return updatedTask
      })
    }

    return result
  }

  // Check each field in the schema format
  Object.entries(schema.format).forEach(([field, format]) => {
    if (field in result && result[field]) {
      // Handle date fields
      if (format.includes("YYYY-MM-DD")) {
        try {
          // If it's already a valid date format, leave it
          if (/^\d{4}-\d{2}-\d{2}$/.test(result[field])) {
            return
          }

          // Try to convert to YYYY-MM-DD format
          const date = new Date(result[field])
          if (!isNaN(date.getTime())) {
            result[field] = date.toISOString().split("T")[0]
          } else {
            // Try to parse common date formats
            const dateStr = String(result[field])

            // Try MM/DD/YYYY
            const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
            const mmddyyyyMatch = dateStr.match(mmddyyyy)
            if (mmddyyyyMatch) {
              const month = Number.parseInt(mmddyyyyMatch[1], 10)
              const day = Number.parseInt(mmddyyyyMatch[2], 10)
              const year = Number.parseInt(mmddyyyyMatch[3], 10)
              const newDate = new Date(year, month - 1, day)
              if (!isNaN(newDate.getTime())) {
                result[field] = newDate.toISOString().split("T")[0]
                return
              }
            }

            // Try DD/MM/YYYY
            const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
            const ddmmyyyyMatch = dateStr.match(ddmmyyyy)
            if (ddmmyyyyMatch) {
              const day = Number.parseInt(ddmmyyyyMatch[1], 10)
              const month = Number.parseInt(ddmmyyyyMatch[2], 10)
              const year = Number.parseInt(ddmmyyyyMatch[3], 10)
              const newDate = new Date(year, month - 1, day)
              if (!isNaN(newDate.getTime())) {
                result[field] = newDate.toISOString().split("T")[0]
                return
              }
            }

            // Try natural language dates
            const naturalDate = new Date(dateStr)
            if (!isNaN(naturalDate.getTime())) {
              result[field] = naturalDate.toISOString().split("T")[0]
            }
          }
        } catch (e) {
          console.warn(`Could not format date field ${field}:`, e)
        }
      }

      // Handle ISO date strings
      if (format.includes("ISO date string")) {
        try {
          // If it's already a valid ISO string, leave it
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result[field])) {
            return
          }

          // Try to convert to ISO format
          const date = new Date(result[field])
          if (!isNaN(date.getTime())) {
            result[field] = date.toISOString()
          }
        } catch (e) {
          console.warn(`Could not format ISO date field ${field}:`, e)
        }
      }
    }
  })

  return result
}

// Add a special function to generate better Gantt data examples in the system prompt
export function generateGanttDataExample(): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const todayStr = today.toISOString()
  const tomorrowStr = tomorrow.toISOString()
  const nextWeekStr = nextWeek.toISOString()

  return `{
  "type": "add",
  "collection": "ganttData",
  "data": {
    "projects": [
      {
        "id": "project-1",
        "name": "Website Redesign",
        "description": "Complete overhaul of the company website",
        "color": "#4f46e5",
        "status": "active",
        "start": "${todayStr}",
        "end": "${nextWeekStr}"
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Planning",
        "projectId": "project-1",
        "color": "#8b5cf6"
      }
    ],
    "tasks": [
      {
        "id": "task-1",
        "name": "Research & Planning",
        "description": "Initial research and planning phase",
        "start": "${todayStr}",
        "end": "${tomorrowStr}",
        "progress": 0,
        "status": "todo",
        "priority": "high",
        "projectId": "project-1",
        "sectionId": "section-1"
      }
    ],
    "links": []
  }
}`
}

// Add a function to process multiple operations
export async function processMultipleDataEditOperations(
  operations: DataEditOperation[],
): Promise<{ success: boolean; message: string; data?: any }[]> {
  const results: { success: boolean; message: string; data?: any }[] = []

  // Process operations sequentially to maintain data integrity
  for (const operation of operations) {
    try {
      const result = await processDataEditOperation(operation)
      results.push(result)
    } catch (error) {
      console.error("Error processing operation:", error)
      results.push({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  return results
}

// Validate a data edit operation against schemas
function validateDataEditOperation(operation: DataEditOperation): { valid: boolean; message?: string } {
  const { type, collection, id, query, data } = operation

  // Check if operation type is valid
  if (!["add", "update", "delete"].includes(type)) {
    return { valid: false, message: `Invalid operation type: ${type}` }
  }

  // Check if collection exists
  const schemas = getDataSchema()
  if (!schemas[collection]) {
    return { valid: false, message: `Unknown collection: ${collection}` }
  }

  // For delete operations, either id or query must be provided
  if (type === "delete" && !id && !query) {
    return { valid: false, message: "Delete operation requires either id or query" }
  }

  // For add operations, data must be provided
  if (type === "add" && !data) {
    return { valid: false, message: "Add operation requires data" }
  }

  // For update operations, both (id or query) and data must be provided
  if (type === "update") {
    if (!data) {
      return { valid: false, message: "Update operation requires data" }
    }

    if (!id && !query) {
      return { valid: false, message: "Update operation requires either id or query to identify the item to update" }
    }
  }

  // If data is provided, validate it against the schema
  if (data && (type === "add" || type === "update")) {
    const schema = schemas[collection]
    const dataValidation = validateDataAgainstSchema(data, schema, type === "update")
    if (!dataValidation.valid) {
      return { valid: false, message: dataValidation.message }
    }
  }

  return { valid: true }
}

// Update the validateDataAgainstSchema function to better handle Gantt data
function validateDataAgainstSchema(
  data: Record<string, any>,
  schema: DataSchema,
  isUpdate: boolean,
): { valid: boolean; message?: string } {
  // Special handling for ganttData collection
  if (schema.collection === "ganttData") {
    // For ganttData, we'll do a more relaxed validation since it's a complex structure
    if (!data.projects && !data.tasks && !data.sections && !data.links) {
      return {
        valid: false,
        message: "ganttData must contain at least one of: projects, tasks, sections, or links",
      }
    }

    // Validate projects if present
    if (data.projects && Array.isArray(data.projects)) {
      for (let i = 0; i < data.projects.length; i++) {
        const project = data.projects[i]
        if (!project.name) {
          return { valid: false, message: `Project at index ${i} is missing a name` }
        }
      }
    }

    // Validate tasks if present
    if (data.tasks && Array.isArray(data.tasks)) {
      for (let i = 0; i < data.tasks.length; i++) {
        const task = data.tasks[i]
        if (!task.name) {
          return { valid: false, message: `Task at index ${i} is missing a name` }
        }
      }
    }

    // Validate sections if present
    if (data.sections && Array.isArray(data.sections)) {
      for (let i = 0; i < data.sections.length; i++) {
        const section = data.sections[i]
        if (!section.name) {
          return { valid: false, message: `Section at index ${i} is missing a name` }
        }
        if (!section.projectId) {
          return { valid: false, message: `Section at index ${i} is missing a projectId` }
        }
      }
    }

    // Validate links if present
    if (data.links && Array.isArray(data.links)) {
      for (let i = 0; i < data.links.length; i++) {
        const link = data.links[i]
        if (!link.source) {
          return { valid: false, message: `Link at index ${i} is missing a source` }
        }
        if (!link.target) {
          return { valid: false, message: `Link at index ${i} is missing a target` }
        }
      }
    }

    return { valid: true }
  }

  // For updates, we don't need to check required fields
  if (!isUpdate) {
    // Check required fields
    for (const field of schema.required) {
      if (data[field] === undefined) {
        return { valid: false, message: `Missing required field: ${field}` }
      }
    }
  }

  // Check field formats if specified
  if (schema.format) {
    for (const [field, format] of Object.entries(schema.format)) {
      if (data[field] !== undefined) {
        // Validate date formats
        if (format.includes("YYYY-MM-DD") && field in data) {
          // Allow Date objects or strings that can be converted to dates
          if (typeof data[field] === "object" && data[field] instanceof Date) {
            // It's a Date object, which is valid
            continue
          }

          if (typeof data[field] === "string") {
            // Check if it's already in YYYY-MM-DD format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/
            if (dateRegex.test(data[field])) {
              continue
            }

            // Try to parse as a date
            try {
              const date = new Date(data[field])
              if (!isNaN(date.getTime())) {
                // It's a valid date string, we'll format it later
                continue
              }
            } catch (e) {
              // Fall through to error
            }
          }

          return { valid: false, message: `Invalid date format for ${field}: expected YYYY-MM-DD` }
        }

        // Validate ISO date strings
        if (format.includes("ISO date string") && field in data) {
          try {
            const date = new Date(data[field])
            if (isNaN(date.getTime())) {
              return { valid: false, message: `Invalid ISO date string for ${field}` }
            }
          } catch (error) {
            return { valid: false, message: `Invalid ISO date string for ${field}` }
          }
        }

        // Validate numbers (except for priority field which is handled separately)
        if (format.includes("number") && field in data && field !== "priority" && typeof data[field] !== "number") {
          // Try to convert string to number if possible
          if (typeof data[field] === "string" && !isNaN(Number(data[field]))) {
            data[field] = Number(data[field])
          } else {
            return { valid: false, message: `Invalid type for ${field}: expected number` }
          }
        }

        // Special handling for priority field
        if (field === "priority") {
          // Accept both string and number formats
          if (typeof data[field] === "string") {
            // For string format, check if it's a valid value
            if (
              format.includes("(low/medium/high)") &&
              !["low", "medium", "high"].includes(data[field].toLowerCase())
            ) {
              return { valid: false, message: `Invalid value for ${field}: must be 'low', 'medium', or 'high'` }
            }

            if (
              format.includes("(low/medium/high/urgent)") &&
              !["low", "medium", "high", "urgent"].includes(data[field].toLowerCase())
            ) {
              return {
                valid: false,
                message: `Invalid value for ${field}: must be 'low', 'medium', 'high', or 'urgent'`,
              }
            }
          } else if (typeof data[field] === "number") {
            // For number format, check if it's in the valid range
            if (format.includes("(1-3)") && (data[field] < 1 || data[field] > 3)) {
              return { valid: false, message: `Invalid value for ${field}: must be between 1 and 3` }
            }
          } else if (data[field] !== undefined) {
            // If it's neither a valid string nor a number, it's invalid
            return { valid: false, message: `Invalid type for ${field}: expected string or number` }
          }
        }

        // Validate booleans
        if (format.includes("boolean") && field in data && typeof data[field] !== "boolean") {
          // Try to convert string to boolean if possible
          if (data[field] === "true" || data[field] === "false") {
            data[field] = data[field] === "true"
          } else if (data[field] === 1 || data[field] === 0) {
            data[field] = Boolean(data[field])
          } else {
            return { valid: false, message: `Invalid type for ${field}: expected boolean` }
          }
        }

        // Validate arrays
        if (format.includes("[]") && field in data && !Array.isArray(data[field])) {
          // Try to convert string to array if it looks like JSON
          if (typeof data[field] === "string" && data[field].startsWith("[") && data[field].endsWith("]")) {
            try {
              data[field] = JSON.parse(data[field])
            } catch (e) {
              return { valid: false, message: `Invalid type for ${field}: expected array` }
            }
          } else {
            return { valid: false, message: `Invalid type for ${field}: expected array` }
          }
        }
      }
    }
  }

  // Special handling for projects collection
  if (schema.collection === "projects") {
    // Ensure name or title is present
    if (data.name === undefined && data.title === undefined) {
      if (isUpdate) {
        // For updates, it's okay if neither is present
      } else {
        return { valid: false, message: "Projects require either a name or title field" }
      }
    }

    // If title is present but name is not, copy title to name
    if (data.title !== undefined && data.name === undefined) {
      data.name = data.title
    }

    // If name is present but title is not, copy name to title
    if (data.name !== undefined && data.title === undefined) {
      data.title = data.name
    }
  }

  // Special handling for ganttData collection
  if (schema.collection === "ganttData" && data.projects) {
    // Ensure each project has required fields
    if (Array.isArray(data.projects)) {
      for (let i = 0; i < data.projects.length; i++) {
        const project = data.projects[i]
        if (!project.id) {
          project.id = `project-${Date.now()}-${i}`
        }
        if (!project.name) {
          return { valid: false, message: `Project at index ${i} is missing a name` }
        }
        if (!project.status) {
          project.status = "active"
        }
      }
    }
  }

  return { valid: true }
}

// Update the generateDataEditSummary function to be more user-friendly
export function generateDataEditSummary(operation: DataEditOperation | DataEditOperation[]): string {
  if (Array.isArray(operation)) {
    const collections = [...new Set(operation.map((op) => op.collection))]
    const types = [...new Set(operation.map((op) => op.type))]

    // Create a more user-friendly summary for multiple operations
    const typeVerbs = {
      add: "add",
      update: "update",
      delete: "delete",
    }

    const typeVerbsPresent = types.map((t) => typeVerbs[t as keyof typeof typeVerbs]).join("/")
    const collectionNames = collections
      .map((c) =>
        c
          .replace(/([A-Z])/g, " $1")
          .trim()
          .toLowerCase(),
      )
      .join(" and ")

    return `${operation.length} changes to ${collectionNames} (${typeVerbsPresent})`
  }

  try {
    const { type, collection, data } = operation
    const collectionName = collection
      .replace(/([A-Z])/g, " $1")
      .trim()
      .toLowerCase()
    const title = getTitleFromData(data) || "item"

    // Create user-friendly summaries based on operation type
    switch (type) {
      case "add":
        return `Add a new ${collectionName}: "${title}"`
      case "update":
        return `Update ${collectionName}: "${title}"`
      case "delete":
        return `Delete ${collectionName}: "${title}"`
      default:
        return `Unknown operation on ${collectionName}`
    }
  } catch (error) {
    console.error("Error generating summary:", error)
    return "Data edit operation"
  }
}

// Update the generateDataEditDetails function to be more conversational
export function generateDataEditDetails(operation: DataEditOperation | DataEditOperation[]): string {
  if (Array.isArray(operation)) {
    // For multiple operations, create a numbered list
    return operation
      .map((op, index) => {
        const details = generateDataEditDetails(op)
        return `Change #${index + 1}:\n${details}`
      })
      .join("\n\n")
  }

  try {
    const { type, collection, id, query, data } = operation
    const collectionName = collection
      .replace(/([A-Z])/g, " $1")
      .trim()
      .toLowerCase()
    const title = getTitleFromData(data) || (id ? `ID: ${id}` : "item")

    // Create a conversational description based on operation type
    let details = ""

    switch (type) {
      case "add":
        details = `I'll create a new ${collectionName} called "${title}".`
        break
      case "update":
        details = `I'll update the ${collectionName} "${title}".`
        break
      case "delete":
        details = `I'll delete the ${collectionName} "${title}".`
        break
    }

    // Add more specific details based on the data and collection
    if (data) {
      // Add collection-specific details in plain language
      switch (collection) {
        case "tasks":
          if (data.dueDate) details += `\nDue date: ${formatDateForDisplay(data.dueDate)}`
          if (data.priority) details += `\nPriority: ${data.priority}`
          if (data.description) details += `\nDescription: ${truncateText(data.description, 100)}`
          break

        case "plannerData":
        case "meetings":
          if (data.date) details += `\nDate: ${formatDateForDisplay(data.date)}`
          if (data.startTime && data.endTime) details += `\nTime: ${data.startTime} to ${data.endTime}`
          if (data.location) details += `\nLocation: ${data.location}`
          if (data.description) details += `\nDetails: ${truncateText(data.description, 100)}`
          break

        case "notes":
        case "knowledgeItems":
        case "markdownDocuments":
          if (data.content) details += `\nContent: ${truncateText(data.content, 100)}`
          if (data.tags && Array.isArray(data.tags)) details += `\nTags: ${data.tags.join(", ")}`
          break

        case "contacts":
          if (data.firstName && data.lastName) details += `\nName: ${data.firstName} ${data.lastName}`
          if (data.email) details += `\nEmail: ${data.email}`
          if (data.phone) details += `\nPhone: ${data.phone}`
          break

        case "projects":
          if (data.description) details += `\nDescription: ${truncateText(data.description, 100)}`
          if (data.startDate && data.endDate)
            details += `\nTimeframe: ${formatDateForDisplay(data.startDate)} to ${formatDateForDisplay(data.endDate)}`
          if (data.status) details += `\nStatus: ${data.status}`
          break

        case "financeData":
          if (data.amount) details += `\nAmount: $${data.amount}`
          if (data.date) details += `\nDate: ${formatDateForDisplay(data.date)}`
          if (data.category) details += `\nCategory: ${data.category}`
          break
      }
    }

    return details
  } catch (error) {
    console.error("Error generating details:", error)
    return "Operation details unavailable"
  }
}

// Helper function to format dates in a user-friendly way
function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch (error) {
    return dateString
  }
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Helper function to get a title from data
function getTitleFromData(data: any): string | null {
  if (!data) return null

  // Special handling for contacts
  if (data.firstName && data.lastName) {
    return `${data.firstName} ${data.lastName}`
  }

  if (data.title) return data.title
  if (data.name) return data.name
  if (data.description) return data.description.substring(0, 30) + (data.description.length > 30 ? "..." : "")

  return null
}
