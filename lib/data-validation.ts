import { getLocalStorage, setLocalStorage, removeLocalStorage, isLocalStorageAvailable } from "./local-storage"

// Types of validation to perform
export type ValidationRule = "required" | "date" | "number" | "boolean" | "array" | "object" | "string"

// Interface for validation schema
export interface ValidationSchema {
  [key: string]: {
    type: ValidationRule
    default?: any
    repair?: (value: any) => any
  }
}

/**
 * Validates data against a schema and repairs if needed
 * @param data The data to validate
 * @param schema The validation schema
 * @returns Validated and repaired data
 */
export function validateData<T>(data: T, schema: ValidationSchema): T {
  if (!data) {
    // Create a new object with default values from schema
    const defaultData: any = {}
    Object.entries(schema).forEach(([key, rule]) => {
      if (rule.default !== undefined) {
        defaultData[key] = rule.default
      }
    })
    return defaultData as T
  }

  const validatedData = { ...data } as any

  Object.entries(schema).forEach(([key, rule]) => {
    const value = (data as any)[key]

    // Check if value exists
    if (value === undefined || value === null) {
      if (rule.default !== undefined) {
        validatedData[key] = rule.default
      }
      return
    }

    // Validate based on type
    let isValid = false
    switch (rule.type) {
      case "date":
        isValid =
          value instanceof Date ||
          (typeof value === "string" && !isNaN(new Date(value).getTime())) ||
          (typeof value === "number" && !isNaN(new Date(value).getTime()))
        break
      case "number":
        isValid = typeof value === "number" && !isNaN(value)
        break
      case "boolean":
        isValid = typeof value === "boolean"
        break
      case "array":
        isValid = Array.isArray(value)
        break
      case "object":
        isValid = typeof value === "object" && !Array.isArray(value) && value !== null
        break
      case "string":
        isValid = typeof value === "string"
        break
      case "required":
        isValid = value !== undefined && value !== null
        break
      default:
        isValid = true
    }

    // Repair if invalid
    if (!isValid && rule.repair) {
      try {
        validatedData[key] = rule.repair(value)
      } catch (error) {
        console.error(`Error repairing value for ${key}:`, error)
        validatedData[key] = rule.default !== undefined ? rule.default : null
      }
    } else if (!isValid && rule.default !== undefined) {
      validatedData[key] = rule.default
    }
  })

  return validatedData as T
}

/**
 * Validates and repairs localStorage data
 * @param key The localStorage key
 * @param schema The validation schema
 * @param defaultValue Default value if data doesn't exist
 * @returns Validated data
 */
export function validateLocalStorageData<T>(key: string, schema: ValidationSchema, defaultValue: T): T {
  if (!isLocalStorageAvailable()) {
    console.warn(`LocalStorage not available, using default value for ${key}`)
    return defaultValue
  }

  try {
    const data = getLocalStorage<T>(key, defaultValue)
    const validatedData = validateData(data, schema)

    // If data was repaired, save it back
    if (JSON.stringify(data) !== JSON.stringify(validatedData)) {
      console.log(`Repaired data for ${key}`)
      setLocalStorage(key, validatedData)
    }

    return validatedData
  } catch (error) {
    console.error(`Error validating localStorage data for ${key}:`, error)
    removeLocalStorage(key)
    return defaultValue
  }
}

/**
 * Creates a validation schema for Gantt data
 */
export function createGanttDataSchema(): ValidationSchema {
  return {
    tasks: {
      type: "array",
      default: [],
      repair: (value) => (Array.isArray(value) ? value : []),
    },
    projects: {
      type: "array",
      default: [],
      repair: (value) => (Array.isArray(value) ? value : []),
    },
    sections: {
      type: "array",
      default: [],
      repair: (value) => (Array.isArray(value) ? value : []),
    },
    milestones: {
      type: "array",
      default: [],
      repair: (value) => (Array.isArray(value) ? value : []),
    },
    dependencies: {
      type: "array",
      default: [],
      repair: (value) => (Array.isArray(value) ? value : []),
    },
    settings: {
      type: "object",
      default: {},
      repair: (value) => (typeof value === "object" ? value : {}),
    },
  }
}

/**
 * Validates a date string
 * @param dateString The date string to validate
 * @returns A valid date string
 */
export function validateDateString(dateString: string): string {
  if (!dateString) {
    return new Date().toISOString().split("T")[0]
  }

  try {
    // Handle different date formats
    let date: Date

    // Try parsing as ISO string
    date = new Date(dateString)

    // If invalid, try different formats
    if (isNaN(date.getTime())) {
      // Try MM/DD/YYYY format
      const parts = dateString.split(/[/\-.]/)
      if (parts.length === 3) {
        // Try different date part orders
        date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`) // MM-DD-YYYY
        if (isNaN(date.getTime())) {
          date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) // DD-MM-YYYY
        }
      }
    }

    // If still invalid, return current date
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split("T")[0]
    }

    // Return in consistent format
    return date.toISOString().split("T")[0]
  } catch (error) {
    console.error("Error validating date string:", error)
    return new Date().toISOString().split("T")[0]
  }
}

// Add a function to validate Gantt data
export function validateGanttData(ganttData: any): any {
  if (!ganttData) return { projects: [], sections: [], tasks: [], links: [] }

  const validatedData = { ...ganttData }

  // Validate projects
  if (validatedData.projects) {
    validatedData.projects = validatedData.projects.map((project: any) => {
      const validProject = { ...project }

      // Ensure project has an ID
      if (!validProject.id) {
        validProject.id = `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }

      // Ensure project has a name
      if (!validProject.name) {
        validProject.name = "Untitled Project"
      }

      // Ensure project has a status
      if (!validProject.status) {
        validProject.status = "active"
      }

      // Validate dates
      if (validProject.start) {
        try {
          validProject.start = new Date(validProject.start)
          if (isNaN(validProject.start.getTime())) {
            validProject.start = new Date()
          }
        } catch (e) {
          validProject.start = new Date()
        }
      } else {
        validProject.start = new Date()
      }

      if (validProject.end) {
        try {
          validProject.end = new Date(validProject.end)
          if (isNaN(validProject.end.getTime())) {
            validProject.end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        } catch (e) {
          validProject.end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      } else {
        validProject.end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }

      return validProject
    })
  } else {
    validatedData.projects = []
  }

  // Validate sections
  if (validatedData.sections) {
    validatedData.sections = validatedData.sections.map((section: any) => {
      const validSection = { ...section }

      // Ensure section has an ID
      if (!validSection.id) {
        validSection.id = `section-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }

      // Ensure section has a name
      if (!validSection.name) {
        validSection.name = "Untitled Section"
      }

      // Ensure section has a projectId
      if (!validSection.projectId) {
        // Try to assign to the first project if available
        if (validatedData.projects && validatedData.projects.length > 0) {
          validSection.projectId = validatedData.projects[0].id
        } else {
          // Create a default project if none exists
          const defaultProject = {
            id: `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: "Default Project",
            status: "active",
            start: new Date(),
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }
          validatedData.projects.push(defaultProject)
          validSection.projectId = defaultProject.id
        }
      }

      return validSection
    })
  } else {
    validatedData.sections = []
  }

  // Validate tasks
  if (validatedData.tasks) {
    validatedData.tasks = validatedData.tasks.map((task: any) => {
      const validTask = { ...task }

      // Ensure task has an ID
      if (!validTask.id) {
        validTask.id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }

      // Ensure task has a name
      if (!validTask.name) {
        validTask.name = "Untitled Task"
      }

      // Ensure task has a status
      if (!validTask.status) {
        validTask.status = "todo"
      }

      // Validate dates
      if (validTask.start) {
        try {
          validTask.start = new Date(validTask.start)
          if (isNaN(validTask.start.getTime())) {
            validTask.start = new Date()
          }
        } catch (e) {
          validTask.start = new Date()
        }
      } else {
        validTask.start = new Date()
      }

      if (validTask.end) {
        try {
          validTask.end = new Date(validTask.end)
          if (isNaN(validTask.end.getTime())) {
            validTask.end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        } catch (e) {
          validTask.end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      } else {
        validTask.end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }

      // Ensure task has a projectId
      if (!validTask.projectId && validatedData.projects && validatedData.projects.length > 0) {
        validTask.projectId = validatedData.projects[0].id
      }

      return validTask
    })
  } else {
    validatedData.tasks = []
  }

  // Validate links
  if (validatedData.links) {
    validatedData.links = validatedData.links
      .filter((link: any) => {
        // Ensure link has source and target
        if (!link.source || !link.target) {
          return false
        }

        // Ensure source and target tasks exist
        const sourceExists = validatedData.tasks.some((task: any) => task.id === link.source)
        const targetExists = validatedData.tasks.some((task: any) => task.id === link.target)

        return sourceExists && targetExists
      })
      .map((link: any) => {
        const validLink = { ...link }

        // Ensure link has an ID
        if (!validLink.id) {
          validLink.id = `link-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }

        // Ensure link has a type
        if (!validLink.type) {
          validLink.type = "finish_to_start"
        }

        return validLink
      })
  } else {
    validatedData.links = []
  }

  return validatedData
}
