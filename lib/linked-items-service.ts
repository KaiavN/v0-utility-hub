import type { LinkedItem, LinkableItem, ItemType } from "./linked-items-types"
import { getLocalStorage, setLocalStorage } from "./local-storage"
import { eventBus } from "./event-bus"

const LINKED_ITEMS_KEY = "linked-items"

// Get all linked items
export function getAllLinkedItems(): LinkedItem[] {
  return getLocalStorage<LinkedItem[]>(LINKED_ITEMS_KEY, [])
}

// Get linked items for a specific source
export function getLinkedItems(sourceId: string, sourceType: ItemType): LinkedItem[] {
  const allItems = getAllLinkedItems()
  return allItems.filter((item) => item.sourceId === sourceId && item.sourceType === sourceType)
}

// Get items linked to a specific target
export function getItemsLinkedTo(id: string, type: ItemType): LinkedItem[] {
  const allItems = getAllLinkedItems()
  return allItems.filter((item) => item.id === id && item.type === type)
}

// Add a linked item
export function addLinkedItem(item: Omit<LinkedItem, "createdAt">): LinkedItem {
  const allItems = getAllLinkedItems()

  // Check if link already exists
  const existingLink = allItems.find(
    (link) =>
      link.id === item.id &&
      link.type === item.type &&
      link.sourceId === item.sourceId &&
      link.sourceType === item.sourceType,
  )

  if (existingLink) {
    return existingLink
  }

  const newItem: LinkedItem = {
    ...item,
    createdAt: new Date().toISOString(),
  }

  allItems.push(newItem)
  setLocalStorage(LINKED_ITEMS_KEY, allItems)

  // Publish event
  eventBus.publish("linked-items:added", newItem)

  return newItem
}

// Remove a linked item
export function removeLinkedItem(id: string, type: ItemType, sourceId: string, sourceType: ItemType): boolean {
  const allItems = getAllLinkedItems()
  const initialLength = allItems.length

  const filteredItems = allItems.filter(
    (item) => !(item.id === id && item.type === type && item.sourceId === sourceId && item.sourceType === sourceType),
  )

  if (filteredItems.length !== initialLength) {
    setLocalStorage(LINKED_ITEMS_KEY, filteredItems)

    // Publish event
    eventBus.publish("linked-items:removed", { id, type, sourceId, sourceType })

    return true
  }

  return false
}

// Get linkable items from a specific feature
export function getLinkableItems(type: ItemType): LinkableItem[] {
  switch (type) {
    case "client":
      return getClientsAsLinkableItems()
    case "note":
      return getNotesAsLinkableItems()
    case "task":
      return getTasksAsLinkableItems()
    case "project":
      return getProjectsAsLinkableItems()
    case "ganttTask":
      return getGanttTasksAsLinkableItems()
    case "ganttProject":
      return getGanttProjectsAsLinkableItems()
    case "billing":
      return getBillingItemsAsLinkableItems()
    case "meeting":
      return getMeetingsAsLinkableItems()
    case "document":
      return getDocumentsAsLinkableItems()
    case "contact":
      return getContactsAsLinkableItems()
    case "codeSnippet":
      return getCodeSnippetsAsLinkableItems()
    case "assignment":
      return getAssignmentsAsLinkableItems()
    case "event":
      return getEventsAsLinkableItems()
    case "finance":
      return getFinanceItemsAsLinkableItems()
    default:
      return []
  }
}

// Helper functions to get linkable items from different features
function getClientsAsLinkableItems(): LinkableItem[] {
  const clients = getLocalStorage<any[]>("clients", [])
  return clients.map((client) => ({
    id: client.id,
    title: client.name,
    type: "client",
    description: client.company || "",
  }))
}

function getNotesAsLinkableItems(): LinkableItem[] {
  const notes = getLocalStorage<any[]>("notes", [])
  return notes.map((note) => ({
    id: note.id,
    title: note.title,
    type: "note",
    description: note.content?.substring(0, 100) || "",
    date: note.createdAt,
  }))
}

function getTasksAsLinkableItems(): LinkableItem[] {
  const tasks = getLocalStorage<any[]>("tasks", [])
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    type: "task",
    description: task.description || "",
    date: task.dueDate,
  }))
}

function getProjectsAsLinkableItems(): LinkableItem[] {
  const projects = getLocalStorage<any[]>("projects", [])
  return projects.map((project) => ({
    id: project.id,
    title: project.name || project.title,
    type: "project",
    description: project.description || "",
    date: project.dueDate || project.endDate,
  }))
}

function getGanttTasksAsLinkableItems(): LinkableItem[] {
  const ganttData = getLocalStorage<any>("ganttData", { tasks: [] })
  return (ganttData.tasks || []).map((task: any) => ({
    id: task.id,
    title: task.name,
    type: "ganttTask",
    description: task.description || "",
    date: task.end,
  }))
}

function getGanttProjectsAsLinkableItems(): LinkableItem[] {
  const ganttData = getLocalStorage<any>("ganttData", { projects: [] })
  return (ganttData.projects || []).map((project: any) => ({
    id: project.id,
    title: project.name,
    type: "ganttProject",
    description: project.description || "",
    date: project.end,
  }))
}

function getBillingItemsAsLinkableItems(): LinkableItem[] {
  const billingData = getLocalStorage<any[]>("billingData", [])
  return billingData.map((item) => ({
    id: item.id,
    title: `Invoice #${item.invoiceNumber || "Unknown"}`,
    type: "billing",
    description: item.description || `${item.amount} for ${item.client}`,
    date: item.date,
  }))
}

function getMeetingsAsLinkableItems(): LinkableItem[] {
  const meetings = getLocalStorage<any[]>("meetings", [])
  return meetings.map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    type: "meeting",
    description: meeting.agenda || "",
    date: meeting.date,
  }))
}

function getDocumentsAsLinkableItems(): LinkableItem[] {
  const documents = getLocalStorage<any[]>("markdownDocuments", [])
  return documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: "document",
    description: doc.content?.substring(0, 100) || "",
    date: doc.lastModified ? new Date(doc.lastModified).toISOString() : undefined,
  }))
}

function getContactsAsLinkableItems(): LinkableItem[] {
  const contacts = getLocalStorage<any[]>("contacts", [])
  return contacts.map((contact) => ({
    id: contact.id,
    title: `${contact.firstName} ${contact.lastName || ""}`.trim(),
    type: "contact",
    description: contact.company || contact.email || "",
  }))
}

function getCodeSnippetsAsLinkableItems(): LinkableItem[] {
  const snippets = getLocalStorage<any[]>("code-snippets", [])
  return snippets.map((snippet) => ({
    id: snippet.id,
    title: snippet.title,
    type: "codeSnippet",
    description: `${snippet.language}: ${snippet.description || ""}`,
    date: snippet.createdAt,
  }))
}

function getAssignmentsAsLinkableItems(): LinkableItem[] {
  const assignments = getLocalStorage<any[]>("assignments", [])
  return assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    type: "assignment",
    description: assignment.description || "",
    date: assignment.dueDate,
  }))
}

function getEventsAsLinkableItems(): LinkableItem[] {
  const plannerData = getLocalStorage<any>("plannerData", { blocks: [] })
  return (plannerData.blocks || []).map((event: any) => ({
    id: event.id,
    title: event.title,
    type: "event",
    description: event.description || "",
    date: event.date,
  }))
}

function getFinanceItemsAsLinkableItems(): LinkableItem[] {
  const financeData = getLocalStorage<any>("finance-transactions", [])
  return financeData.map((item) => ({
    id: item.id,
    title: `${item.description || "Transaction"} (${item.amount})`,
    type: "finance",
    description: `${item.type}: ${item.category}`,
    date: item.date,
  }))
}
