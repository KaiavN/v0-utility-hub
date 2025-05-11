import { performDataEdit } from "./data-editor"
import { validateDataEditOperation } from "./data-editor"
import { getDataSchema } from "./data-schemas"
import type { DataSchema } from "./data-schemas"
import { eventBus } from "./event-bus"
import { forceSaveAllData, loadAllData } from "./data-manager"

// Define the data edit operation type
export interface DataEditOperation {
  type: "add" | "update" | "delete"
  collection: string
  id?: string
  query?: Record<string, any>
  data?: any
}

// Add a more comprehensive data validation function
function validateDataContent(data: any, collection: string): { valid: boolean; message?: string } {
  try {
    // Skip validation for null or undefined data
    if (data === null || data === undefined) {
      return { valid: true }
    }

    // Ensure it's an object
    if (typeof data !== "object" || Array.isArray(data)) {
      return {
        valid: false,
        message: `Data must be an object, got ${Array.isArray(data) ? "array" : typeof data}`,
      }
    }

    // Collection-specific validation
    switch (collection) {
      case "tasks":
        if (!data.title) {
          return { valid: false, message: "Task must have a title" }
        }

        // Validate date format if provided
        if (data.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)) {
          return { valid: false, message: "Due date must be in YYYY-MM-DD format" }
        }

        // Validate priority if provided
        if (data.priority && !["low", "medium", "high"].includes(data.priority)) {
          return { valid: false, message: "Priority must be low, medium, or high" }
        }

        break

      case "plannerData":
        // If it's a blocks array, validate each block
        if (Array.isArray(data.blocks)) {
          for (let i = 0; i < data.blocks.length; i++) {
            const block = data.blocks[i]
            if (!block.title) {
              return { valid: false, message: `Block at index ${i} must have a title` }
            }
            if (!block.date) {
              return { valid: false, message: `Block at index ${i} must have a date` }
            }
            if (block.date && !/^\d{4}-\d{2}-\d{2}$/.test(block.date)) {
              return { valid: false, message: `Block at index ${i} date must be in YYYY-MM-DD format` }
            }
            if (block.startTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(block.startTime)) {
              return { valid: false, message: `Block at index ${i} startTime must be in HH:MM format` }
            }
            if (block.endTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(block.endTime)) {
              return { valid: false, message: `Block at index ${i} endTime must be in HH:MM format` }
            }
          }
        }
        break

      case "notes":
        if (!data.title) {
          return { valid: false, message: "Note must have a title" }
        }
        if (!data.content) {
          return { valid: false, message: "Note must have content" }
        }
        break

      case "knowledgeItems":
        if (!data.title) {
          return { valid: false, message: "Knowledge item must have a title" }
        }
        if (!data.content) {
          return { valid: false, message: "Knowledge item must have content" }
        }
        break

      case "ganttData":
        // Additional validation for projects
        if (data.projects) {
          if (!Array.isArray(data.projects)) {
            return { valid: false, message: "Projects must be an array" }
          }

          for (let i = 0; i < data.projects.length; i++) {
            const project = data.projects[i]
            if (!project.name) {
              return { valid: false, message: `Project at index ${i} must have a name` }
            }

            // Validate dates if provided
            try {
              if (project.start) new Date(project.start)
              if (project.end) new Date(project.end)
            } catch {
              return { valid: false, message: `Project at index ${i} has invalid date formats` }
            }
          }
        }

        // Validate tasks
        if (data.tasks) {
          if (!Array.isArray(data.tasks)) {
            return { valid: false, message: "Tasks must be an array" }
          }

          for (let i = 0; i < data.tasks.length; i++) {
            const task = data.tasks[i]
            if (!task.name) {
              return { valid: false, message: `Task at index ${i} must have a name` }
            }
            if (!task.projectId) {
              return { valid: false, message: `Task at index ${i} must have a projectId` }
            }

            // Validate dates
            try {
              if (task.start) new Date(task.start)
              if (task.end) new Date(task.end)
            } catch {
              return { valid: false, message: `Task at index ${i} has invalid date formats` }
            }
          }
        }
        break

      // Add more collection-specific validations as needed
    }

    return { valid: true }
  } catch (error) {
    console.error("Error validating data content:", error)
    return {
      valid: false,
      message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Process a single data edit operation with improved error handling and validation
export async function processDataEditOperation(
  operation: DataEditOperation,
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    console.log(`Processing data edit operation: ${operation.type} on ${operation.collection}`, operation)

    // First validate the operation structure
    const validation = validateDataEditOperation(operation)
    if (!validation.valid) {
      console.error(`Invalid data edit operation: ${validation.message}`, operation)
      return {
        success: false,
        message: validation.message || "Invalid data edit operation",
      }
    }

    // Then validate the data content if it's an add or update operation
    if ((operation.type === "add" || operation.type === "update") && operation.data) {
      const contentValidation = validateDataContent(operation.data, operation.collection)
      if (!contentValidation.valid) {
        console.error(`Invalid data content: ${contentValidation.message}`, operation.data)
        return {
          success: false,
          message: contentValidation.message || "Invalid data content",
        }
      }
    }

    // Perform the operation with additional safety checks
    try {
      const result = await performDataEdit(operation)

      if (result.success) {
        console.log(`Data edit operation successful: ${operation.type} on ${operation.collection}`)

        // Force an immediate save to ensure data persistence
        try {
          const allData = loadAllData()
          forceSaveAllData(allData)
          console.log("Forced immediate save of all data after successful edit operation")

          // Double-check that the data was saved correctly
          setTimeout(() => {
            try {
              const verificationData = loadAllData()
              const verificationResult = verificationData[operation.collection as keyof typeof verificationData]
              if (!verificationResult) {
                console.warn(`Verification check: ${operation.collection} not found in saved data`)
              } else {
                console.log(`Verification check: ${operation.collection} found in saved data`)
              }
            } catch (verifyError) {
              console.error("Error during verification check:", verifyError)
            }
          }, 500)
        } catch (saveError) {
          console.error("Error forcing data save after edit operation:", saveError)
          // Continue anyway since the operation itself was successful
        }
      } else {
        console.error(`Data edit operation failed: ${result.message}`, operation)
      }

      // Emit events for the operation
      eventBus.publish(`data:${operation.collection}:operation`, {
        type: operation.type,
        result,
      })

      // Also emit a general data updated event
      eventBus.publish("data:updated", {
        collection: operation.collection,
        type: operation.type,
        success: result.success,
      })

      return result
    } catch (operationError) {
      console.error("Error during data edit operation:", operationError)
      return {
        success: false,
        message: `Operation error: ${operationError instanceof Error ? operationError.message : String(operationError)}`,
      }
    }
  } catch (error) {
    console.error("Error processing data edit operation:", error, operation)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Add a function to safely process operations with retry logic
export async function safeProcessOperation(
  operation: DataEditOperation,
  maxRetries = 2,
): Promise<{ success: boolean; message: string; data?: any }> {
  let attempts = 0
  let lastError = null

  while (attempts <= maxRetries) {
    try {
      console.log(`Attempt ${attempts + 1} for operation: ${operation.type} on ${operation.collection}`)

      // Process the operation
      const result = await processDataEditOperation(operation)

      if (result.success) {
        // If successful, we're done
        if (attempts > 0) {
          console.log(`Operation succeeded after ${attempts + 1} attempts`)
        }
        return result
      } else {
        // If failed but retriable, try again
        lastError = result.message
        console.warn(`Attempt ${attempts + 1} failed: ${lastError}`)
        attempts++
      }
    } catch (error) {
      // If unexpected error, record it and try again
      lastError = error instanceof Error ? error.message : String(error)
      console.error(`Unexpected error in attempt ${attempts + 1}: ${lastError}`)
      attempts++
    }

    // Add a short delay before retrying to avoid race conditions
    if (attempts <= maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 500 * attempts)) // Progressive backoff
    }
  }

  console.error(`Operation failed after ${attempts} attempts. Last error: ${lastError}`)
  return {
    success: false,
    message: `Failed after ${attempts} attempts. Last error: ${lastError}`,
  }
}

// Process multiple data edit operations with improved error handling
export async function processMultipleDataEditOperations(
  operations: DataEditOperation[],
): Promise<{ success: boolean; message: string; data?: any }[]> {
  try {
    console.log(`Processing ${operations.length} data edit operations`)

    // Validate all operations first
    const invalidOperations = operations
      .map((op, index) => {
        const validation = validateDataEditOperation(op)
        if (!validation.valid) {
          return { index, message: validation.message || "Invalid operation" }
        }

        // Also validate data content for add/update operations
        if ((op.type === "add" || op.type === "update") && op.data) {
          const contentValidation = validateDataContent(op.data, op.collection)
          if (!contentValidation.valid) {
            return { index, message: contentValidation.message || "Invalid data content" }
          }
        }

        return null
      })
      .filter(Boolean)

    if (invalidOperations.length > 0) {
      console.error(`Found ${invalidOperations.length} invalid operations:`, invalidOperations)

      // Return results with failures for invalid operations
      return operations
        .map((op, index) => {
          const invalidOp = invalidOperations.find((io) => io?.index === index)
          if (invalidOp) {
            return {
              success: false,
              message: `Validation failed: ${invalidOp.message}`,
            }
          }

          // For valid operations, we'll process them below
          return null as any // Placeholder
        })
        .filter(Boolean)
    }

    // Process each operation with retry logic for better reliability
    const results = await Promise.all(operations.map((operation) => safeProcessOperation(operation)))

    // Force an immediate save to ensure data persistence after all operations
    try {
      const allData = loadAllData()
      forceSaveAllData(allData)
      console.log("Forced immediate save of all data after multiple edit operations")

      // Verification check after a delay
      setTimeout(() => {
        try {
          // Check that all collections that were modified are still in the saved data
          const verificationData = loadAllData()
          const modifiedCollections = [...new Set(operations.map((op) => op.collection))]

          for (const collection of modifiedCollections) {
            const collectionData = verificationData[collection as keyof typeof verificationData]
            if (!collectionData) {
              console.warn(`Verification check: ${collection} not found in saved data`)
            } else {
              console.log(`Verification check: ${collection} found in saved data`)
            }
          }
        } catch (verifyError) {
          console.error("Error during verification check:", verifyError)
        }
      }, 500)
    } catch (saveError) {
      console.error("Error forcing data save after multiple edit operations:", saveError)
      // Continue anyway since we already have individual operation results
    }

    // Log summary of results
    const successCount = results.filter((r) => r.success).length
    console.log(
      `Completed ${operations.length} operations: ${successCount} succeeded, ${operations.length - successCount} failed`,
    )

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
  if (Array.isArray(operation)) {
    const counts = operation.reduce(
      (acc, op) => {
        acc[op.type]++
        return acc
      },
      { add: 0, update: 0, delete: 0 },
    )

    const parts = []
    if (counts.add > 0) parts.push(`add ${counts.add} item${counts.add > 1 ? "s" : ""}`)
    if (counts.update > 0) parts.push(`update ${counts.update} item${counts.update > 1 ? "s" : ""}`)
    if (counts.delete > 0) parts.push(`delete ${counts.delete} item${counts.delete > 1 ? "s" : ""}`)

    return `The AI assistant wants to ${parts.join(", ")}.`
  }

  const collectionName = operation.collection
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()

  switch (operation.type) {
    case "add":
      return `Add a new ${collectionName}`
    case "update":
      return `Update an existing ${collectionName}`
    case "delete":
      return `Delete a ${collectionName}`
    default:
      return "Unknown operation"
  }
}

// Generate detailed information about the data edit operation
export function generateDataEditDetails(operation: DataEditOperation): string {
  const collectionName = operation.collection
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()

  switch (operation.type) {
    case "add":
      return `Add a new ${collectionName} with the provided data.`
    case "update":
      return `Update the ${collectionName} with ID: ${operation.id} with the provided data.`
    case "delete":
      return `Delete the ${collectionName} with ID: ${operation.id}.`
    default:
      return "Unknown operation"
  }
}

// Export the DataEditOperation type for use in other files
export type { DataEditOperation }
