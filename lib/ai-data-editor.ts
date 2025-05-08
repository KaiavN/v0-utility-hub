import { performDataEdit } from "./data-editor"
import { validateDataEditOperation } from "./data-editor"
import { getDataSchema } from "./data-schemas"
import type { DataSchema } from "./data-schemas"
import { eventBus } from "./event-bus"

// Define the data edit operation type
export interface DataEditOperation {
  type: "add" | "update" | "delete"
  collection: string
  id?: string
  query?: Record<string, any>
  data?: any
}

// Process a single data edit operation
export async function processDataEditOperation(
  operation: DataEditOperation,
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Validate the operation
    const validation = validateDataEditOperation(operation)
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message || "Invalid data edit operation",
      }
    }

    // Perform the operation
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

// Process multiple data edit operations
export async function processMultipleDataEditOperations(
  operations: DataEditOperation[],
): Promise<{ success: boolean; message: string; data?: any }[]> {
  try {
    // Process each operation
    const results = await Promise.all(operations.map((operation) => processDataEditOperation(operation)))

    return results
  } catch (error) {
    console.error("Error processing multiple data edit operations:", error)
    return [
      {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
    ]
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

// Validate a data edit operation against schemas
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

// Add this function to validate planner data structure
const validatePlannerData = (data: any, collection: string): any => {
  if (!data) return data

  // If this is planner data, ensure it has the correct structure
  if (collection === "plannerData") {
    if (!data.stats) {
      data.stats = {
        totalTimeBlocked: 0,
        completedBlocks: 0,
        streak: 0,
        lastActiveDate: null,
      }
    }

    if (!data.settings) {
      data.settings = {
        dayStartHour: 6,
        dayEndHour: 22,
        timeSlotHeight: 80,
        defaultBlockDuration: 60,
        categories: [],
        templates: [],
        showCompletedBlocks: true,
      }
    }

    if (!data.blocks) {
      data.blocks = []
    }
  }

  return data
}

// Generate a summary of the data edit operation(s)
export function generateDataEditSummary(operation: DataEditOperation | DataEditOperation[]): string {
  try {
    if (Array.isArray(operation)) {
      // Multiple operations
      const addCount = operation.filter((op) => op.type === "add").length
      const updateCount = operation.filter((op) => op.type === "update").length
      const deleteCount = operation.filter((op) => op.type === "delete").length

      const collections = [...new Set(operation.map((op) => op.collection))]
      const collectionNames = collections.map((c) => formatCollectionName(c)).join(", ")

      let summary = `The AI assistant wants to make ${operation.length} changes to your data:`

      if (addCount > 0) {
        summary += ` add ${addCount} item${addCount > 1 ? "s" : ""}`
      }

      if (updateCount > 0) {
        summary += `${addCount > 0 ? "," : ""} update ${updateCount} item${updateCount > 1 ? "s" : ""}`
      }

      if (deleteCount > 0) {
        summary += `${addCount > 0 || updateCount > 0 ? "," : ""} delete ${deleteCount} item${deleteCount > 1 ? "s" : ""}`
      }

      summary += ` in ${collections.length > 1 ? "these collections" : "this collection"}: ${collectionNames}.`

      return summary
    } else {
      // Single operation
      const { type, collection, id, query, data } = operation
      const collectionName = formatCollectionName(collection)

      switch (type) {
        case "add":
          return `The AI assistant wants to add a new ${collectionName.toLowerCase()} to your data.`

        case "update":
          if (id) {
            return `The AI assistant wants to update an existing ${collectionName.toLowerCase()} (ID: ${id}).`
          } else if (query) {
            const queryStr = Object.entries(query)
              .map(([key, value]) => `${key}: ${typeof value === "string" ? `"${value}"` : value}`)
              .join(", ")
            return `The AI assistant wants to update ${collectionName.toLowerCase()} matching these criteria: ${queryStr}.`
          }
          return `The AI assistant wants to update a ${collectionName.toLowerCase()}.`

        case "delete":
          if (id) {
            return `The AI assistant wants to delete a ${collectionName.toLowerCase()} (ID: ${id}).`
          } else if (query) {
            const queryStr = Object.entries(query)
              .map(([key, value]) => `${key}: ${typeof value === "string" ? `"${value}"` : value}`)
              .join(", ")
            return `The AI assistant wants to delete ${collectionName.toLowerCase()} matching these criteria: ${queryStr}.`
          }
          return `The AI assistant wants to delete a ${collectionName.toLowerCase()}.`

        default:
          return `The AI assistant wants to perform an unknown operation on your ${collectionName.toLowerCase()} data.`
      }
    }
  } catch (error) {
    console.error("Error generating data edit summary:", error)
    return "The AI assistant wants to make changes to your data."
  }
}

// Generate detailed information about the data edit operation
export function generateDataEditDetails(operation: DataEditOperation): string {
  try {
    const { type, collection, id, query, data } = operation
    const collectionName = formatCollectionName(collection)
    const schemas = getDataSchema()
    const schema = schemas[collection]

    switch (type) {
      case "add":
        if (!data) return "No data provided for add operation."

        let addDetails = `Add a new ${collectionName.toLowerCase()} with the following details:\n\n`

        // Format the data based on the schema if available
        if (schema) {
          // Add required fields first
          schema.required.forEach((field) => {
            if (data[field] !== undefined) {
              addDetails += `- ${formatFieldName(field)}: ${formatFieldValue(data[field])}\n`
            }
          })

          // Add optional fields
          schema.optional.forEach((field) => {
            if (data[field] !== undefined) {
              addDetails += `- ${formatFieldName(field)}: ${formatFieldValue(data[field])}\n`
            }
          })

          // Add any fields not in the schema
          Object.keys(data).forEach((field) => {
            if (!schema.required.includes(field) && !schema.optional.includes(field) && field !== "id") {
              addDetails += `- ${formatFieldName(field)}: ${formatFieldValue(data[field])}\n`
            }
          })
        } else {
          // No schema, just format all fields
          Object.entries(data).forEach(([field, value]) => {
            if (field !== "id") {
              addDetails += `- ${formatFieldName(field)}: ${formatFieldValue(value)}\n`
            }
          })
        }

        return addDetails

      case "update":
        if (!data) return "No data provided for update operation."

        let updateDetails = `Update ${collectionName.toLowerCase()}`

        if (id) {
          updateDetails += ` with ID: ${id}`
        } else if (query) {
          const queryStr = Object.entries(query)
            .map(([key, value]) => `${formatFieldName(key)}: ${formatFieldValue(value)}`)
            .join(", ")
          updateDetails += ` matching: ${queryStr}`
        }

        updateDetails += "\n\nChanges to be made:\n\n"

        // Format the data based on the schema if available
        if (schema) {
          // Add required fields first
          schema.required.forEach((field) => {
            if (data[field] !== undefined) {
              updateDetails += `- ${formatFieldName(field)}: ${formatFieldValue(data[field])}\n`
            }
          })

          // Add optional fields
          schema.optional.forEach((field) => {
            if (data[field] !== undefined) {
              updateDetails += `- ${formatFieldName(field)}: ${formatFieldValue(data[field])}\n`
            }
          })

          // Add any fields not in the schema
          Object.keys(data).forEach((field) => {
            if (!schema.required.includes(field) && !schema.optional.includes(field) && field !== "id") {
              updateDetails += `- ${formatFieldName(field)}: ${formatFieldValue(data[field])}\n`
            }
          })
        } else {
          // No schema, just format all fields
          Object.entries(data).forEach(([field, value]) => {
            if (field !== "id") {
              updateDetails += `- ${formatFieldName(field)}: ${formatFieldValue(value)}\n`
            }
          })
        }

        return updateDetails

      case "delete":
        let deleteDetails = `Delete ${collectionName.toLowerCase()}`

        if (id) {
          deleteDetails += ` with ID: ${id}`
        } else if (query) {
          const queryStr = Object.entries(query)
            .map(([key, value]) => `${formatFieldName(key)}: ${formatFieldValue(value)}`)
            .join(", ")
          deleteDetails += ` matching: ${queryStr}`
        }

        deleteDetails += "\n\nThis action will permanently remove the data and cannot be undone."

        return deleteDetails

      default:
        return `Unknown operation type: ${type}`
    }
  } catch (error) {
    console.error("Error generating data edit details:", error)
    return "Could not generate details for this operation."
  }
}

// Format a collection name for display
function formatCollectionName(collection: string): string {
  // Convert camelCase to Title Case with spaces
  return collection
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

// Format a field name for display
function formatFieldName(field: string): string {
  // Convert camelCase to Title Case with spaces
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

// Format a field value for display
function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return "None"
  }

  if (typeof value === "string") {
    // Truncate long strings
    if (value.length > 100) {
      return `"${value.substring(0, 100)}..."`
    }
    return `"${value}"`
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Empty list"
    }

    if (typeof value[0] === "object" && value[0] !== null) {
      return `List of ${value.length} items`
    }

    // Format array of primitive values
    const formattedItems = value.map((item) => {
      if (typeof item === "string") {
        return `"${item}"`
      }
      return String(item)
    })

    // Truncate if too many items
    if (formattedItems.length > 5) {
      return `[${formattedItems.slice(0, 5).join(", ")}, ... and ${formattedItems.length - 5} more]`
    }

    return `[${formattedItems.join(", ")}]`
  }

  if (typeof value === "object") {
    return "Complex object"
  }

  return String(value)
}
