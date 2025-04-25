import { loadAllData, saveData } from "./data-manager"
import type { DataEditOperation } from "./ai-data-editor"
import { getDataSchema } from "./data-schemas"
import { eventBus } from "./event-bus"

// Perform a data edit operation
export async function performDataEdit(operation: DataEditOperation) {
  try {
    const { type, collection, id, query, data } = operation

    // Validate that the collection exists in our application
    if (!isValidCollection(collection)) {
      return {
        success: false,
        message: `Collection "${collection}" is not a valid collection in this application`,
      }
    }

    // Load all data
    const allData = loadAllData()

    // Special handling for ganttData which has a different structure
    if (collection === "ganttData") {
      return handleGanttDataOperation(type, data, allData)
    }

    // Get the collection
    const collectionData = allData[collection] || []

    // Ensure collection is an array
    if (!Array.isArray(collectionData)) {
      return {
        success: false,
        message: `Collection ${collection} is not an array`,
      }
    }

    // Validate data against schema before proceeding
    if (data && !validateData(collection, data, type === "update")) {
      return {
        success: false,
        message: `Data validation failed for ${collection}`,
      }
    }

    // Fix date formats for countdown timers
    if (collection === "countdownTimers" && data && data.targetDate) {
      data.targetDate = ensureValidDate(data.targetDate)
    }

    switch (type) {
      case "add":
        // Add a new item
        if (!data) {
          return {
            success: false,
            message: "No data provided for add operation",
          }
        }

        // Check for duplicate IDs if ID is provided
        if (data.id && collectionData.some((item) => item.id === data.id)) {
          return {
            success: false,
            message: `Item with ID ${data.id} already exists in ${collection}`,
          }
        }

        // Generate a new ID if not provided
        const newItem = {
          ...data,
          id: data.id || generateId(collection),
          createdAt: data.createdAt || new Date().toISOString(),
        }

        // Add to collection
        collectionData.push(newItem)

        // Save updated collection
        saveData(collection, collectionData)

        // Handle special cases for certain collections
        await handleSpecialCases(type, collection, newItem)

        // Emit event
        eventBus.publish(`data:${collection}:added`, newItem)
        eventBus.publish(`data:${collection}:updated`, collectionData)

        return {
          success: true,
          message: `Added new item to ${collection}`,
          data: newItem,
        }

      case "update":
        // Update an existing item
        if (!id && !query) {
          return {
            success: false,
            message: "Update operation requires either id or query to identify the item to update",
          }
        }

        if (!data) {
          return {
            success: false,
            message: "No data provided for update operation",
          }
        }

        // Find the item to update
        let itemIndex = -1

        if (id) {
          // Find by ID
          itemIndex = collectionData.findIndex((item) => item.id === id)
        } else if (query) {
          // Find by query
          itemIndex = collectionData.findIndex((item) => {
            return Object.entries(query).every(([key, value]) => item[key] === value)
          })
        }

        if (itemIndex === -1) {
          return {
            success: false,
            message: `Item not found in ${collection}. Please check the id or query parameters.`,
          }
        }

        // Keep a copy of the original item for special case handling
        const originalItem = { ...collectionData[itemIndex] }

        // Update the item
        const updatedItem = {
          ...collectionData[itemIndex],
          ...data,
          lastUpdated: new Date().toISOString(),
        }

        collectionData[itemIndex] = updatedItem

        // Save updated collection
        saveData(collection, collectionData)

        // Handle special cases for certain collections
        await handleSpecialCases(type, collection, updatedItem, originalItem)

        // Emit event
        eventBus.publish(`data:${collection}:updated`, collectionData)

        return {
          success: true,
          message: `Updated item in ${collection}`,
          data: updatedItem,
        }

      case "delete":
        // Delete an item
        if (!id && !query) {
          return {
            success: false,
            message: "No id or query provided for delete operation",
          }
        }

        // Find the item to delete
        let deleteIndex = -1

        if (id) {
          // Find by ID
          deleteIndex = collectionData.findIndex((item) => item.id === id)
        } else if (query) {
          // Find by query
          deleteIndex = collectionData.findIndex((item) => {
            return Object.entries(query).every(([key, value]) => item[key] === value)
          })
        }

        if (deleteIndex === -1) {
          return {
            success: false,
            message: `Item not found in ${collection}`,
          }
        }

        // Delete the item
        const deletedItem = collectionData[deleteIndex]
        collectionData.splice(deleteIndex, 1)

        // Save updated collection
        saveData(collection, collectionData)

        // Handle special cases for certain collections
        await handleSpecialCases(type, collection, deletedItem)

        // Emit event
        eventBus.publish(`data:${collection}:deleted`, deletedItem)
        eventBus.publish(`data:${collection}:updated`, collectionData)

        return {
          success: true,
          message: `Deleted item from ${collection}`,
          data: deletedItem,
        }

      default:
        return {
          success: false,
          message: `Unknown operation type: ${type}`,
        }
    }
  } catch (error) {
    console.error("Error performing data edit:", error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Add a new function to handle ganttData operations
async function handleGanttDataOperation(type: string, data: any, allData: any) {
  try {
    if (type !== "add" && type !== "update") {
      return {
        success: false,
        message: `Operation type ${type} not supported for ganttData`,
      }
    }

    if (!data) {
      return {
        success: false,
        message: "No data provided for ganttData operation",
      }
    }

    // Get current ganttData or initialize if it doesn't exist
    const ganttData = allData.ganttData || {
      projects: [],
      sections: [],
      tasks: [],
      links: [],
      lastUpdated: new Date().toISOString(),
    }

    // Create a deep copy to avoid reference issues
    const updatedGanttData = JSON.parse(JSON.stringify(ganttData))
    let hasChanges = false

    // Process projects
    if (data.projects && Array.isArray(data.projects)) {
      for (const project of data.projects) {
        // Ensure project has an ID
        if (!project.id) {
          project.id = generateId("ganttProjects")
        }

        // Parse dates if they're strings
        if (project.start && typeof project.start === "string") {
          try {
            project.start = new Date(project.start).toISOString()
          } catch (e) {
            console.error("Invalid start date for project:", project.id, e)
          }
        }

        if (project.end && typeof project.end === "string") {
          try {
            project.end = new Date(project.end).toISOString()
          } catch (e) {
            console.error("Invalid end date for project:", project.id, e)
          }
        }

        const existingIndex = updatedGanttData.projects.findIndex((p: any) => p.id === project.id)
        if (existingIndex === -1) {
          // Add new project
          updatedGanttData.projects.push({
            ...project,
            id: project.id,
          })
          console.log("Added new project to ganttData:", project.id, project.name)
        } else {
          // Update existing project
          updatedGanttData.projects[existingIndex] = {
            ...updatedGanttData.projects[existingIndex],
            ...project,
          }
          console.log("Updated project in ganttData:", project.id, project.name)
        }
        hasChanges = true
      }
    }

    // Process sections
    if (data.sections && Array.isArray(data.sections)) {
      for (const section of data.sections) {
        // Ensure section has an ID
        if (!section.id) {
          section.id = generateId("ganttSections")
        }

        const existingIndex = updatedGanttData.sections.findIndex((s: any) => s.id === section.id)
        if (existingIndex === -1) {
          // Add new section
          updatedGanttData.sections.push({
            ...section,
            id: section.id,
          })
          console.log("Added new section to ganttData:", section.id, section.name)
        } else {
          // Update existing section
          updatedGanttData.sections[existingIndex] = {
            ...updatedGanttData.sections[existingIndex],
            ...section,
          }
          console.log("Updated section in ganttData:", section.id, section.name)
        }
        hasChanges = true
      }
    }

    // Process tasks
    if (data.tasks && Array.isArray(data.tasks)) {
      for (const task of data.tasks) {
        // Ensure task has an ID
        if (!task.id) {
          task.id = generateId("ganttTasks")
        }

        // Parse dates if they're strings
        if (task.start && typeof task.start === "string") {
          try {
            task.start = new Date(task.start).toISOString()
          } catch (e) {
            console.error("Invalid start date for task:", task.id, e)
          }
        }

        if (task.end && typeof task.end === "string") {
          try {
            task.end = new Date(task.end).toISOString()
          } catch (e) {
            console.error("Invalid end date for task:", task.id, e)
          }
        }

        const existingIndex = updatedGanttData.tasks.findIndex((t: any) => t.id === task.id)
        if (existingIndex === -1) {
          // Add new task
          updatedGanttData.tasks.push({
            ...task,
            id: task.id,
          })
          console.log("Added new task to ganttData:", task.id, task.name)
        } else {
          // Update existing task
          updatedGanttData.tasks[existingIndex] = {
            ...updatedGanttData.tasks[existingIndex],
            ...task,
          }
          console.log("Updated task in ganttData:", task.id, task.name)
        }
        hasChanges = true
      }
    }

    // Process links
    if (data.links && Array.isArray(data.links)) {
      for (const link of data.links) {
        // Ensure link has an ID
        if (!link.id) {
          link.id = generateId("ganttLinks")
        }

        const existingIndex = updatedGanttData.links.findIndex((l: any) => l.id === link.id)
        if (existingIndex === -1) {
          // Add new link
          updatedGanttData.links.push({
            ...link,
            id: link.id,
          })
          console.log("Added new link to ganttData:", link.id)
        } else {
          // Update existing link
          updatedGanttData.links[existingIndex] = {
            ...updatedGanttData.links[existingIndex],
            ...link,
          }
          console.log("Updated link in ganttData:", link.id)
        }
        hasChanges = true
      }
    }

    if (!hasChanges) {
      return {
        success: false,
        message: "No changes were made to Gantt data",
      }
    }

    // Update lastUpdated timestamp
    updatedGanttData.lastUpdated = new Date().toISOString()

    // Save updated ganttData
    saveData("ganttData", updatedGanttData)

    // Emit event
    eventBus.publish("data:ganttData:updated", updatedGanttData)

    // Force a refresh of the Gantt chart by dispatching a custom event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gantt-data-updated", { detail: updatedGanttData }))
    }

    return {
      success: true,
      message: "Updated Gantt data successfully",
      data: updatedGanttData,
    }
  } catch (error) {
    console.error("Error handling ganttData operation:", error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Check if a collection is valid
function isValidCollection(collection: string): boolean {
  const validCollections = [
    "tasks",
    "notes",
    "bookmarks",
    "passwordEntries",
    "knowledgeItems",
    "codeSnippets",
    "mealPlannerData",
    "workoutHistory",
    "contacts",
    "financeData",
    "markdownDocuments",
    "countdownTimers",
    "flashcards",
    "assignments",
    "projects",
    "meetings",
    "clients",
    "billingData",
    "plannerData",
    "ganttData",
    "citations",
  ]

  return validCollections.includes(collection)
}

// Ensure that the date is in the correct format
function ensureValidDate(dateString: string): string {
  try {
    // If it's already a valid ISO string, return it
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(dateString)) {
      return dateString
    }

    // If it's a YYYY-MM-DD format, add time
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return new Date(`${dateString}T23:59:59.000Z`).toISOString()
    }

    // Try to parse as a date
    const date = new Date(dateString)

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}, using current date`)
      return new Date().toISOString()
    }

    return date.toISOString()
  } catch (error) {
    console.error("Error ensuring valid date:", error)
    return new Date().toISOString()
  }
}

// Handle special cases for certain collections
async function handleSpecialCases(type: string, collection: string, item: any, oldItem?: any) {
  try {
    // Load all data
    const allData = loadAllData()

    // Add this new section to handle Gantt projects that need to be added to Project Tracker
    if (collection === "ganttData" && (type === "add" || type === "update")) {
      // Only process if there are projects in the data
      if (item.projects && Array.isArray(item.projects)) {
        // Get projects data
        const projectsData = allData.projects || []

        // Process each project in the gantt data
        for (const ganttProject of item.projects) {
          // Check if project already exists in projects collection
          const existingProjectIndex = projectsData.findIndex((project: any) => project.id === ganttProject.id)

          if (existingProjectIndex === -1) {
            // Map status from gantt to projects format
            let projectStatus = "planning"
            if (ganttProject.status === "completed") projectStatus = "completed"
            else if (ganttProject.status === "archived") projectStatus = "on-hold"
            else if (ganttProject.status === "active") projectStatus = "in-progress"

            // Create new project in projects collection
            const newProject = {
              id: ganttProject.id,
              name: ganttProject.name,
              description: ganttProject.description || "",
              client: "",
              startDate: ganttProject.start || new Date().toISOString().split("T")[0],
              dueDate: ganttProject.end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              status: projectStatus,
              priority: "medium",
              tasks: [],
              notes: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }

            projectsData.push(newProject)
            console.log("Added Gantt project to Projects collection:", newProject)
          } else {
            // Update existing project
            projectsData[existingProjectIndex] = {
              ...projectsData[existingProjectIndex],
              name: ganttProject.name || projectsData[existingProjectIndex].name,
              description: ganttProject.description || projectsData[existingProjectIndex].description,
              startDate: ganttProject.start || projectsData[existingProjectIndex].startDate,
              dueDate: ganttProject.end || projectsData[existingProjectIndex].dueDate,
              updatedAt: new Date().toISOString(),
            }

            // Update status if gantt status is completed
            if (ganttProject.status === "completed") {
              projectsData[existingProjectIndex].status = "completed"
            }

            console.log("Updated Projects collection from Gantt project:", projectsData[existingProjectIndex])
          }
        }

        // Save updated projects data
        saveData("projects", projectsData)
      }
    }

    // Handle tasks that need to be added to Gantt chart
    if (collection === "tasks" && (type === "add" || type === "update")) {
      // Get gantt data
      const ganttData = allData.ganttData || { tasks: [], projects: [], sections: [], links: [] }

      // Convert priority from string to number if needed
      let priorityValue = item.priority

      // If priority is a string, convert it to a number for Gantt chart
      if (typeof priorityValue === "string") {
        switch (priorityValue.toLowerCase()) {
          case "low":
            priorityValue = 1
            break
          case "medium":
            priorityValue = 2
            break
          case "high":
            priorityValue = 3
            break
          default:
            priorityValue = 2 // Default to medium
        }
      }

      if (type === "add") {
        // Check if task already exists in gantt
        const existingTaskIndex = ganttData.tasks.findIndex((task: any) => task.id === item.id)

        if (existingTaskIndex === -1) {
          // Add task to gantt
          const ganttTask = {
            id: item.id,
            name: item.title,
            description: item.description || "",
            start: item.dueDate ? new Date(item.dueDate).toISOString() : new Date().toISOString(),
            end: item.dueDate ? new Date(item.dueDate).toISOString() : new Date().toISOString(),
            progress: item.completed ? 100 : 0,
            status: item.completed ? "done" : "active",
            priority: priorityValue,
          }

          ganttData.tasks.push(ganttTask)
          saveData("ganttData", ganttData)
          console.log("Added task to Gantt chart:", ganttTask)
        }
      } else if (type === "update") {
        // Update task in gantt
        const existingTaskIndex = ganttData.tasks.findIndex((task: any) => task.id === item.id)

        if (existingTaskIndex !== -1) {
          // Update existing task
          ganttData.tasks[existingTaskIndex] = {
            ...ganttData.tasks[existingTaskIndex],
            name: item.title,
            description: item.description || ganttData.tasks[existingTaskIndex].description,
            start: item.dueDate ? new Date(item.dueDate).toISOString() : ganttData.tasks[existingTaskIndex].start,
            end: item.dueDate ? new Date(item.dueDate).toISOString() : ganttData.tasks[existingTaskIndex].end,
            progress: item.completed ? 100 : 0,
            status: item.completed ? "done" : "active",
            priority: priorityValue,
          }

          saveData("ganttData", ganttData)
          console.log("Updated task in Gantt chart:", ganttData.tasks[existingTaskIndex])
        } else {
          // Task doesn't exist in gantt yet, add it
          const ganttTask = {
            id: item.id,
            name: item.title,
            description: item.description || "",
            start: item.dueDate ? new Date(item.dueDate).toISOString() : new Date().toISOString(),
            end: item.dueDate ? new Date(item.dueDate).toISOString() : new Date().toISOString(),
            progress: item.completed ? 100 : 0,
            status: item.completed ? "done" : "active",
            priority: priorityValue,
          }

          ganttData.tasks.push(ganttTask)
          saveData("ganttData", ganttData)
          console.log("Added task to Gantt chart during update:", ganttTask)
        }
      }
    }

    // Handle tasks that need to be removed from Gantt chart
    if (collection === "tasks" && type === "delete") {
      // Get gantt data
      const ganttData = allData.ganttData || { tasks: [], projects: [], sections: [], links: [] }

      // Remove task from gantt
      const taskIndex = ganttData.tasks.findIndex((task: any) => task.id === item.id)

      if (taskIndex !== -1) {
        ganttData.tasks.splice(taskIndex, 1)
        saveData("ganttData", ganttData)
        console.log("Removed task from Gantt chart:", item.id)
      }
    }

    // Handle projects that need to be added to Gantt chart
    if (collection === "projects" && (type === "add" || type === "update")) {
      // Get gantt data
      const ganttData = allData.ganttData || { tasks: [], projects: [], sections: [], links: [] }

      if (type === "add") {
        // Check if project already exists in gantt
        const existingProjectIndex = ganttData.projects.findIndex((project: any) => project.id === item.id)

        if (existingProjectIndex === -1) {
          // Add project to gantt
          const ganttProject = {
            id: item.id,
            name: item.name || item.title, // Support both name and title fields
            description: item.description || "",
            color: item.color || getRandomColor(),
            status: mapProjectStatus(item.status) || "active",
            start: item.startDate || new Date().toISOString().split("T")[0],
            end:
              item.dueDate ||
              item.endDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          }

          ganttData.projects.push(ganttProject)
          saveData("ganttData", ganttData)
          console.log("Added project to Gantt chart:", ganttProject)
        }
      } else if (type === "update") {
        // Update project in gantt
        const existingProjectIndex = ganttData.projects.findIndex((project: any) => project.id === item.id)

        if (existingProjectIndex !== -1) {
          // Update existing project
          ganttData.projects[existingProjectIndex] = {
            ...ganttData.projects[existingProjectIndex],
            name: item.name || item.title || ganttData.projects[existingProjectIndex].name,
            description: item.description || ganttData.projects[existingProjectIndex].description,
            status: mapProjectStatus(item.status) || ganttData.projects[existingProjectIndex].status,
            start: item.startDate || ganttData.projects[existingProjectIndex].start,
            end: item.dueDate || item.endDate || ganttData.projects[existingProjectIndex].end,
          }

          saveData("ganttData", ganttData)
          console.log("Updated project in Gantt chart:", ganttData.projects[existingProjectIndex])
        } else {
          // Project doesn't exist in gantt yet, add it
          const ganttProject = {
            id: item.id,
            name: item.name || item.title, // Support both name and title fields
            description: item.description || "",
            color: item.color || getRandomColor(),
            status: mapProjectStatus(item.status) || "active",
            start: item.startDate || new Date().toISOString().split("T")[0],
            end:
              item.dueDate ||
              item.endDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          }

          ganttData.projects.push(ganttProject)
          saveData("ganttData", ganttData)
          console.log("Added project to Gantt chart during update:", ganttProject)
        }
      }
    }

    // Handle projects that need to be removed from Gantt chart
    if (collection === "projects" && type === "delete") {
      // Get gantt data
      const ganttData = allData.ganttData || { tasks: [], projects: [], sections: [], links: [] }

      // Remove project from gantt
      const projectIndex = ganttData.projects.findIndex((project: any) => project.id === item.id)

      if (projectIndex !== -1) {
        ganttData.projects.splice(projectIndex, 1)
        saveData("ganttData", ganttData)
        console.log("Removed project from Gantt chart:", item.id)
      }
    }

    // Handle meetings that need to be added to planner
    if (collection === "meetings" && (type === "add" || type === "update")) {
      // Get planner data
      const plannerData = allData.plannerData || []

      // Create a planner entry from the meeting
      const plannerEntry = {
        id: `planner-${item.id}`,
        title: item.title,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        description: `Meeting: ${item.agenda || ""}`,
        category: "Meeting",
        isRecurring: false,
        color: "bg-purple-500",
        completed: false,
      }

      if (type === "add") {
        // Check if entry already exists
        const existingEntryIndex = plannerData.findIndex((entry: any) => entry.id === plannerEntry.id)

        if (existingEntryIndex === -1) {
          // Add to planner
          plannerData.push(plannerEntry)
          saveData("plannerData", plannerData)
          console.log("Added meeting to planner:", plannerEntry)
        }
      } else if (type === "update") {
        // Update in planner
        const existingEntryIndex = plannerData.findIndex((entry: any) => entry.id === plannerEntry.id)

        if (existingEntryIndex !== -1) {
          // Update existing entry
          plannerData[existingEntryIndex] = plannerEntry
          saveData("plannerData", plannerData)
          console.log("Updated meeting in planner:", plannerEntry)
        } else {
          // Entry doesn't exist yet, add it
          plannerData.push(plannerEntry)
          saveData("plannerData", plannerData)
          console.log("Added meeting to planner during update:", plannerEntry)
        }
      }
    }

    // Handle assignments that need to be added to Gantt chart
    if (collection === "assignments" && (type === "add" || type === "update")) {
      // Get gantt data
      const ganttData = allData.ganttData || { tasks: [], projects: [], sections: [], links: [] }

      // Convert priority from string to number if needed
      let priorityValue = item.priority

      // If priority is a string, convert it to a number for Gantt chart
      if (typeof priorityValue === "string") {
        switch (priorityValue.toLowerCase()) {
          case "low":
            priorityValue = 1
            break
          case "medium":
            priorityValue = 2
            break
          case "high":
            priorityValue = 3
            break
          default:
            priorityValue = 2 // Default to medium
        }
      }

      // Create a gantt task from the assignment
      const ganttTask = {
        id: item.id,
        name: item.title,
        description: item.description || "",
        start: item.dueDate ? new Date(item.dueDate).toISOString() : new Date().toISOString(),
        end: item.dueDate ? new Date(item.dueDate).toISOString() : new Date().toISOString(),
        progress: item.completed ? 100 : 0,
        status: item.completed ? "done" : "active",
        priority: priorityValue,
        type: "assignment",
      }

      if (type === "add") {
        // Check if task already exists in gantt
        const existingTaskIndex = ganttData.tasks.findIndex((task: any) => task.id === item.id)

        if (existingTaskIndex === -1) {
          // Add to gantt
          ganttData.tasks.push(ganttTask)
          saveData("ganttData", ganttData)
          console.log("Added assignment to Gantt chart:", ganttTask)
        }
      } else if (type === "update") {
        // Update in gantt
        const existingTaskIndex = ganttData.tasks.findIndex((task: any) => task.id === item.id)

        if (existingTaskIndex !== -1) {
          // Update existing task
          ganttData.tasks[existingTaskIndex] = {
            ...ganttData.tasks[existingTaskIndex],
            name: item.title,
            description: item.description || ganttData.tasks[existingTaskIndex].description,
            start: item.dueDate ? new Date(item.dueDate).toISOString() : ganttData.tasks[existingTaskIndex].start,
            end: item.dueDate ? new Date(item.dueDate).toISOString() : ganttData.tasks[existingTaskIndex].end,
            progress: item.completed ? 100 : 0,
            status: item.completed ? "done" : "active",
            priority: priorityValue,
          }

          saveData("ganttData", ganttData)
          console.log("Updated assignment in Gantt chart:", ganttData.tasks[existingTaskIndex])
        } else {
          // Task doesn't exist in gantt yet, add it
          ganttData.tasks.push(ganttTask)
          saveData("ganttData", ganttData)
          console.log("Added assignment to Gantt chart during update:", ganttTask)
        }
      }
    }

    // Handle countdown timers for important tasks
    if (collection === "tasks" && (type === "add" || type === "update")) {
      // Only create countdown timers for high priority tasks with due dates
      if (item.priority === "high" && item.dueDate) {
        const countdownTimers = allData.countdownTimers || []

        // Check if a timer already exists for this task
        const existingTimerIndex = countdownTimers.findIndex(
          (timer: any) => timer.id === `countdown-${item.id}` || timer.relatedItemId === item.id,
        )

        // Create a countdown timer for the task
        const countdownTimer = {
          id: `countdown-${item.id}`,
          title: `Deadline: ${item.title}`,
          targetDate: new Date(item.dueDate + "T23:59:59").toISOString(),
          description: item.description || "High priority task deadline",
          color: "#dc2626", // Red color for high priority
          relatedItemId: item.id,
          relatedItemType: "task",
        }

        if (existingTimerIndex === -1) {
          // Add new timer
          countdownTimers.push(countdownTimer)
        } else {
          // Update existing timer
          countdownTimers[existingTimerIndex] = countdownTimer
        }

        saveData("countdownTimers", countdownTimers)
      }
    }
  } catch (error) {
    console.error("Error handling special cases:", error)
  }
}

// Add this new function to map project statuses between the two systems
function mapProjectStatus(status: string): string {
  if (!status) return "active"

  switch (status.toLowerCase()) {
    case "planning":
      return "active"
    case "in-progress":
      return "active"
    case "on-hold":
      return "archived"
    case "completed":
      return "completed"
    case "cancelled":
      return "archived"
    default:
      return "active"
  }
}

// Generate a random color for new projects
function getRandomColor(): string {
  const colors = [
    "#4f46e5", // indigo-600
    "#0891b2", // cyan-600
    "#059669", // emerald-600
    "#d97706", // amber-600
    "#dc2626", // red-600
    "#7c3aed", // violet-600
    "#2563eb", // blue-600
    "#c026d3", // fuchsia-600
  ]

  return colors[Math.floor(Math.random() * colors.length)]
}

// Generate a unique ID for a new item
function generateId(collection: string): string {
  const prefix = getCollectionPrefix(collection)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}-${timestamp}-${random}`
}

// Get a prefix for IDs based on the collection
function getCollectionPrefix(collection: string): string {
  // Map collection names to prefixes
  const prefixMap: Record<string, string> = {
    tasks: "task",
    notes: "note",
    bookmarks: "bkmk",
    passwordEntries: "pwd",
    knowledgeItems: "know",
    codeSnippets: "code",
    mealPlannerData: "meal",
    workoutHistory: "wrkt",
    contacts: "cont",
    financeData: "fin",
    markdownDocuments: "doc",
    countdownTimers: "timer",
    flashcards: "card",
    assignments: "asgn",
    projects: "proj",
    meetings: "meet",
    clients: "clnt",
    billingData: "bill",
    plannerData: "plan",
    ganttData: "gantt",
    citations: "cite",
  }

  return prefixMap[collection] || collection.substring(0, 4)
}

// Validate data against schema
export function validateData(collection: string, data: Record<string, any>, isUpdate = false): boolean {
  try {
    const schemas = getDataSchema()
    const schema = schemas[collection]

    if (!schema) {
      return true // No schema to validate against
    }

    // For updates, we don't need to check required fields
    if (!isUpdate) {
      // Check required fields
      for (const field of schema.required) {
        if (data[field] === undefined) {
          console.error(`Missing required field: ${field}`)
          return false
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error validating data:", error)
    return false
  }
}

export function validateDataEditOperation(operation: DataEditOperation): { valid: boolean; message?: string } {
  const { type, id, query, data } = operation

  switch (type) {
    case "add":
      // For add operations, data must be provided
      if (!data) {
        return { valid: false, message: "Add operation requires data" }
      }
      break

    case "update":
      // For update operations, both (id or query) and data must be provided
      if (type === "update" && !data) {
        return { valid: false, message: "Update operation requires data" }
      }

      if (type === "update" && !id && !query) {
        return { valid: false, message: "Update operation requires either id or query" }
      }
      break

    case "delete":
      // For delete operations, either id or query must be provided
      if (!id && !query) {
        return { valid: false, message: "Delete operation requires either id or query" }
      }
      break

    default:
      return { valid: false, message: `Unknown operation type: ${type}` }
  }

  return { valid: true }
}
