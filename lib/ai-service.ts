import { loadAllData } from "./data-manager"
import type { AppData } from "./data-manager"
import type { DataEditOperation } from "./ai-data-editor"
import { sendMessageToOpenRouter } from "@/app/actions/ai-actions"

// Define types for OpenRouter API
interface OpenRouterMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
}

interface OpenRouterResponse {
  id: string
  choices: {
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
}

// Define the AI service
export const aiService = {
  // Send a message to the AI and get a response
  async sendMessage(
    messages: OpenRouterMessage[],
    apiKey: string,
    canAccessData: boolean,
    canEditData: boolean,
  ): Promise<{ content: string; dataEditOperation?: DataEditOperation | DataEditOperation[] | null; error?: string }> {
    try {
      // Prepare system message with context about the application
      const systemMessage: OpenRouterMessage = {
        role: "system",
        content: generateSystemPrompt(canAccessData, canEditData),
      }

      // Add data context if allowed
      if (canAccessData) {
        // Get all data contexts
        const dataContexts = await prepareDataContexts()

        if (dataContexts && dataContexts.length > 0) {
          // Add each data context as a separate system message
          const allMessages = [systemMessage]

          // Add data context messages
          dataContexts.forEach((context) => {
            allMessages.push({
              role: "system",
              content: context,
            })
          })

          // Add user messages
          messages.forEach((msg) => {
            allMessages.push(msg)
          })

          messages = allMessages
        } else {
          messages = [systemMessage, ...messages]
        }
      } else {
        messages = [systemMessage, ...messages]
      }

      // Optimize message history by truncating older messages if too long
      const optimizedMessages = optimizeMessageHistory(messages)

      // Use the server action to send the message
      const response = await sendMessageToOpenRouter(optimizedMessages)

      if (response.error) {
        throw new Error(response.error)
      }

      const content = response.content

      // Check if the response contains a data edit operation
      let dataEditOperation: DataEditOperation | DataEditOperation[] | null = null
      let error: string | undefined = undefined

      if (canEditData && content.includes("DATA_EDIT_OPERATION:")) {
        try {
          dataEditOperation = extractDataEditOperation(content)
        } catch (extractError) {
          console.error("Error extracting data edit operation:", extractError)
          error = extractError instanceof Error ? extractError.message : String(extractError)
        }
      }

      // Return the content, any data edit operation, and any error
      return {
        content: removeDataEditOperation(content),
        dataEditOperation,
        error,
      }
    } catch (error) {
      console.error("Error sending message to OpenRouter:", error)
      throw error
    }
  },
}

// Optimize message history to reduce token usage
function optimizeMessageHistory(messages: OpenRouterMessage[]): OpenRouterMessage[] {
  // Keep all system messages
  const systemMessages = messages.filter((msg) => msg.role === "system")

  // For user and assistant messages, keep only the most recent ones
  const conversationMessages = messages.filter((msg) => msg.role !== "system")

  // If we have more than 10 conversation messages, keep only the most recent 10
  const recentMessages = conversationMessages.length > 10 ? conversationMessages.slice(-10) : conversationMessages

  // Combine system messages with recent conversation messages
  return [...systemMessages, ...recentMessages]
}

// Generate system prompt with application context
function generateSystemPrompt(canAccessData: boolean, canEditData: boolean): string {
  // Get current date and time
  const now = new Date()
  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  // Get user preferences from localStorage to determine role
  const userPreferencesString = localStorage.getItem("userPreferences")
  const userPreferences = userPreferencesString ? JSON.parse(userPreferencesString) : { role: "student" }
  const role = userPreferences.role || "student"

  let prompt = `You're an AI assistant for "Utility Hub" - a web app that stores data in localStorage.

Current date/time: ${formattedDate} at ${formattedTime}.

## YOUR ROLE

You are a PROACTIVE assistant. Don't just answer questions - anticipate needs and take initiative:

1. When users mention tasks, events, or information they need to track, AUTOMATICALLY offer to create appropriate entries
2. Always provide COMPLETE data entries with detailed descriptions, not just basic fields
3. When creating tasks, include detailed descriptions, appropriate due dates, and relevant tags
4. For notes and knowledge items, generate comprehensive content based on context
5. Suggest related items across features (e.g., create both a task and calendar event for deadlines)
6. Offer to create multiple related entries when appropriate (e.g., project + related tasks)

## FEATURES`

  // Add features based on user role
  if (role === "student") {
    prompt += `

### Task Management
- Create to-dos with due dates, priorities, tags
- Mark complete, filter, sort
- Uses: Daily to-dos, work tasks, shopping lists

### Notes
- Create formatted notes with titles
- Organize with tags, categories, colors
- Uses: Meeting notes, ideas, journal entries

### Bookmarks
- Save URLs with titles, descriptions, tags
- Uses: Research resources, reading lists

### Password Manager
- Store credentials securely
- Uses: Website logins, account info

### Knowledge Base
- Store structured information
- Uses: Study notes, research, documentation

### Code Snippets
- Save code with syntax highlighting
- Uses: Programming reference, reusable functions

### Meal Planning
- Store recipes and plan meals
- Uses: Weekly meal planning, recipe collection

### Workout Tracker
- Log exercises, duration, calories
- Uses: Fitness tracking, exercise routines

### Countdown Timers
- Track important dates
- Uses: Event planning, deadlines

### Flashcards
- Create study cards with front/back
- Uses: Language learning, exam prep

### Assignment Tracker
- Track academic work with due dates
- Uses: Homework management, research papers

### Calendar
- Schedule events with recurring options
- Uses: Appointments, time blocking

### Gantt Chart
- Visual project planning with dependencies
- Uses: Project management, timelines

### Citation Manager
- Track academic references
- Uses: Research papers, academic writing

### Spotify Integration
- Connect to Spotify, control playback
- Uses: Background music while working

## COMMON WORKFLOWS

1. **Academic**: Assignments + Calendar + Flashcards + Citations + Knowledge Base
2. **Personal**: Calendar + Tasks + Notes + Countdown Timers
3. **Study**: Flashcards + Knowledge Base + Bookmarks + Code Snippets
4. **Health**: Meal Planning + Workout Tracker + Calendar`
  } else {
    // Professional role
    prompt += `

### Task Management
- Create to-dos with due dates, priorities, tags
- Mark complete, filter, sort
- Uses: Daily to-dos, work tasks, shopping lists

### Notes
- Create formatted notes with titles
- Organize with tags, categories, colors
- Uses: Meeting notes, ideas, journal entries

### Bookmarks
- Save URLs with titles, descriptions, tags
- Uses: Research resources, reading lists

### Password Manager
- Store credentials securely
- Uses: Website logins, account info

### Knowledge Base
- Store structured information
- Uses: Study notes, research, documentation

### Code Snippets
- Save code with syntax highlighting
- Uses: Programming reference, reusable functions

### Meal Planning
- Store recipes and plan meals
- Uses: Weekly meal planning, recipe collection

### Workout Tracker
- Log exercises, duration, calories
- Uses: Fitness tracking, exercise routines

### Contacts Manager
- Store contact details
- Uses: Address book, client directory

### Finance Dashboard
- Track income/expenses, accounts, goals
- Uses: Budgeting, expense tracking

### Markdown Editor
- Create formatted documents
- Uses: Documentation, blog posts, notes

### Countdown Timers
- Track important dates
- Uses: Event planning, deadlines

### Project Tracker
- Manage complex projects with team members
- Uses: Work projects, renovations, events

### Meeting Notes
- Schedule meetings, prepare agendas
- Uses: Work meetings, interviews

### Client Manager
- Track client information
- Uses: Freelance work, consulting

### Time Billing
- Track billable time and invoices
- Uses: Freelancers, consultants

### Calendar
- Schedule events with recurring options
- Uses: Appointments, time blocking

### Gantt Chart
- Visual project planning with dependencies
- Uses: Project management, timelines

## COMMON WORKFLOWS

1. **Professional**: Tasks + Projects + Meetings + Clients + Billing + Gantt
2. **Personal**: Calendar + Tasks + Notes + Contacts + Finance
3. **Content Creation**: Markdown + Knowledge Base + Bookmarks + Code Snippets
4. **Health**: Meal Planning + Workout Tracker + Calendar`
  }

  if (canAccessData) {
    prompt += `\n\nYou have access to user data for personalized assistance. I will provide you with detailed information about the user's data in separate messages.`
  }

  if (canEditData) {
    prompt += `\n\nYou can suggest data edits. Include DATA_EDIT_OPERATION section with valid JSON.

RULES:
1. Only edit EXISTING FEATURES
2. Start with "DATA_EDIT_OPERATION:" followed by space
3. JSON on new line after marker
4. Use proper JSON format with double quotes. Escape single quotes with backslash (\\')
5. Only use fields defined below
6. No trailing commas
7. Properly close brackets
8. Complete, valid JSON only

Example:
DATA_EDIT_OPERATION: 
{
  "type": "add",
  "collection": "plannerData",
  "data": {
    "title": "Doctor's appointment",
    "date": "2025-04-22",
    "startTime": "08:00",
    "endTime": "09:00",
    "description": "Annual physical checkup with Dr. Smith. Remember to bring insurance card and list of current medications. Arrive 15 minutes early to fill out paperwork.",
    "category": "Health"
  }
}

Update example:
DATA_EDIT_OPERATION: 
{
  "type": "update",
  "collection": "tasks",
  "id": "task-123456", 
  "data": {
    "title": "Updated task title",
    "description": "This is the updated description",
    "priority": "high"
  }
}

Update with query example:
DATA_EDIT_OPERATION: 
{
  "type": "update",
  "collection": "notes",
  "query": {"title": "Meeting Notes"}, 
  "data": {
    "content": "Updated content for the meeting notes",
    "tags": ["important", "meeting", "updated"]
  }
}

Multiple operations:
DATA_EDIT_OPERATION: 
[
  {
    "type": "add",
    "collection": "plannerData",
    "data": {
      "title": "Doctor's appointment",
      "date": "2025-04-22",
      "startTime": "08:00",
      "endTime": "09:00",
      "description": "Annual physical checkup with Dr. Smith. Remember to bring insurance card and list of current medications. Arrive 15 minutes early to fill out paperwork.",
      "category": "Health"
    }
  },
  {
    "type": "update",
    "collection": "tasks",
    "id": "task-123456",
    "data": {
      "title": "Prepare for doctor's appointment",
      "completed": true,
      "description": "Completed all preparations for the appointment"
    }
  }
]

Operations:
- add: Add new item
- update: Update existing item (requires id or query)
- delete: Delete item (requires id or query)

Collections and fields:`

    // Add collections based on user role
    if (role === "student") {
      prompt += `

1. tasks
   - Required: title
   - Optional: description, dueDate (YYYY-MM-DD), completed (boolean), priority ("low"/"medium"/"high"), tags (array), category

2. notes
   - Required: title, content
   - Optional: tags (array), category, color, createdAt (ISO date)

3. bookmarks
   - Required: title, url
   - Optional: description, tags (array), category, favicon

4. passwordEntries
   - Required: title, username, password
   - Optional: website, notes, category, lastUpdated (ISO date)

5. knowledgeItems
   - Required: title, content
   - Optional: tags (array), category, source, createdAt (ISO date)

6. codeSnippets
   - Required: title, code, language
   - Optional: description, tags (array), createdAt (ISO date)

7. mealPlannerData
   - Required: title
   - Optional: ingredients (array), instructions, prepTime (number), cookTime (number), servings (number), category, tags (array)

8. workoutHistory
   - Required: date (YYYY-MM-DD), exercises (array)
   - Optional: duration (number), calories (number), notes

9. countdownTimers
   - Required: title, targetDate (ISO date)
   - Optional: description, color

10. flashcards
    - Required: front, back
    - Optional: deckId

11. assignments
    - Required: title, dueDate (YYYY-MM-DD)
    - Optional: description, course, priority ("low"/"medium"/"high"), completed (boolean), attachments (array)

12. plannerData
    - Required: title, date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM)
    - Optional: description, category, isRecurring (boolean), recurringPattern (daily/weekly/monthly/weekdays/weekends), color, completed (boolean)

13. ganttData
    - Required: projects (array), tasks (array)
    - Optional: sections (array), links (array), lastUpdated (ISO date)

14. citations
    - Required: title, source
    - Optional: authors (array), date (YYYY-MM-DD), url, journal, volume, issue, pages, publisher, doi, notes, tags (array)

Cross-feature usage:
- Add assignments to both assignments and ganttData
- Add important dates to both countdownTimers and plannerData
- Add study sessions to plannerData and link to assignments`
    } else {
      // Professional role
      prompt += `

1. tasks
   - Required: title
   - Optional: description, dueDate (YYYY-MM-DD), completed (boolean), priority ("low"/"medium"/"high"), tags (array), category

2. notes
   - Required: title, content
   - Optional: tags (array), category, color, createdAt (ISO date)

3. bookmarks
   - Required: title, url
   - Optional: description, tags (array), category, favicon

4. passwordEntries
   - Required: title, username, password
   - Optional: website, notes, category, lastUpdated (ISO date)

5. knowledgeItems
   - Required: title, content
   - Optional: tags (array), category, source, createdAt (ISO date)

6. codeSnippets
   - Required: title, code, language
   - Optional: description, tags (array), createdAt (ISO date)

7. mealPlannerData
   - Required: title
   - Optional: ingredients (array), instructions, prepTime (number), cookTime (number), servings (number), category, tags (array)

8. workoutHistory
   - Required: date (YYYY-MM-DD), exercises (array)
   - Optional: duration (number), calories (number), notes

9. contacts
   - Required: firstName
   - Optional: lastName, email, phone, address, company, notes, tags (array), category

10. financeData
    - Required: type (income/expense/transfer)
    - Optional: date (YYYY-MM-DD), amount (number), category, description, account, recurring (boolean)

11. markdownDocuments
    - Required: title, content
    - Optional: tags (array), createdAt (ISO date), lastUpdated (ISO date), category

12. countdownTimers
    - Required: title, targetDate (ISO date)
    - Optional: description, color

13. projects
    - Required: title
    - Optional: description, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), status ("planning"/"in-progress"/"completed"/"cancelled"), priority ("low"/"medium"/"high"/"urgent"), members (array), tasks (array), category

14. meetings
    - Required: title, date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM)
    - Optional: location, participants (array), agenda, notes

15. clients
    - Required: name
    - Optional: email, phone, company, address, notes, projects (array)

16. billingData
    - Required: client, amount (number), date (YYYY-MM-DD)
    - Optional: description, status (paid/unpaid/partial), dueDate (YYYY-MM-DD), invoiceNumber, paymentMethod

17. plannerData
    - Required: title, date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM)
    - Optional: description, category, isRecurring (boolean), recurringPattern (daily/weekly/monthly/weekdays/weekends), color, completed (boolean)

18. ganttData
    - Required: projects (array), tasks (array)
    - Optional: sections (array), links (array), lastUpdated (ISO date)

Cross-feature usage:
- Add appointments to both plannerData and meetings
- Add project deadlines to tasks and countdownTimers
- Add new projects to both projects and ganttData`
    }

    // Add Gantt-specific information for both roles
    prompt += `

Gantt task fields:
- id: Task ID (string)
- name: Task name (string)
- description: Task description (string)
- start: Start date (ISO date string)
- end: End date (ISO date string)
- progress: Number 0-100
- status: "todo"/"in-progress"/"review"/"done"
- priority: "low"/"medium"/"high"
- assignees: Array of user IDs
- dependencies: Array of task IDs
- projectId: Project ID
- sectionId: Section ID (optional)

Gantt project fields:
- id: Project ID (string)
- name: Project name (string)
- description: Project description (string)
- color: Hex code (e.g., "#4f46e5")
- status: "active"/"completed"/"archived"
- start: Start date (ISO date string)
- end: End date (ISO date string)

Gantt section fields:
- id: Section ID (string)
- name: Section name (string)
- projectId: Project ID (string)
- color: Hex code (e.g., "#8b5cf6")

Gantt link fields:
- id: Link ID (string)
- source: Source task ID (string)
- target: Target task ID (string)
- type: "finish_to_start"/"start_to_start"/"finish_to_finish"/"start_to_finish"

Example ganttData operation:
{
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
        "start": "2025-04-01T00:00:00.000Z",
        "end": "2025-04-30T00:00:00.000Z"
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
        "start": "2025-04-01T00:00:00.000Z",
        "end": "2025-04-15T00:00:00.000Z",
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

  return prompt
}

// New function to prepare data contexts in multiple chunks for better comprehension
async function prepareDataContexts(): Promise<string[]> {
  try {
    // Load all data
    const allData = loadAllData()

    // Create an array to hold all context messages
    const contexts: string[] = []

    // Add an overview message first
    const overview = createDataOverview(allData)
    if (overview) {
      contexts.push(`User's data overview: ${overview}`)
    }

    // Process each data type separately to provide more detailed information
    // This ensures the AI gets complete information about each data type

    // Process tasks
    if (allData.tasks && allData.tasks.length > 0) {
      const tasksContext = processTasksData(allData.tasks)
      if (tasksContext) contexts.push(tasksContext)
    }

    // Process notes
    if (allData.notes && allData.notes.length > 0) {
      const notesContext = processNotesData(allData.notes)
      if (notesContext) contexts.push(notesContext)
    }

    // Process bookmarks
    if (allData.bookmarks && allData.bookmarks.length > 0) {
      const bookmarksContext = processBookmarksData(allData.bookmarks)
      if (bookmarksContext) contexts.push(bookmarksContext)
    }

    // Process knowledge items
    if (allData.knowledgeItems && allData.knowledgeItems.length > 0) {
      const knowledgeContext = processKnowledgeData(allData.knowledgeItems)
      if (knowledgeContext) contexts.push(knowledgeContext)
    }

    // Process calendar/planner data
    if (allData.plannerData && allData.plannerData.length > 0) {
      const plannerContext = processPlannerData(allData.plannerData)
      if (plannerContext) contexts.push(plannerContext)
    }

    // Process projects and gantt data
    if (allData.projects || (allData.ganttData && Object.keys(allData.ganttData).length > 0)) {
      const projectsContext = processProjectsData(allData.projects, allData.ganttData)
      if (projectsContext) contexts.push(projectsContext)
    }

    // Process other data types as needed
    // Add more specialized processors for other data types

    // Process remaining data types in a more general way
    const remainingDataContext = processRemainingData(allData)
    if (remainingDataContext) {
      contexts.push(remainingDataContext)
    }

    return contexts
  } catch (error) {
    console.error("Error preparing data contexts:", error)
    return []
  }
}

// Create a high-level overview of all data
function createDataOverview(data: AppData): string {
  try {
    const overview: Record<string, any> = {}

    // Count items in each collection
    Object.entries(data).forEach(([key, value]) => {
      if (!value) return

      if (Array.isArray(value)) {
        overview[key] = {
          count: value.length,
          lastUpdated: getLastUpdatedDate(value),
        }
      } else if (typeof value === "object" && value !== null) {
        overview[key] = {
          type: "object",
          properties: Object.keys(value).length,
        }
      }
    })

    return `Data collections overview: ${JSON.stringify(overview)}`
  } catch (error) {
    console.error("Error creating data overview:", error)
    return ""
  }
}

// Get the last updated date from an array of items
function getLastUpdatedDate(items: any[]): string | null {
  if (!items || items.length === 0) return null

  // Look for date fields in the last item
  const lastItem = items[items.length - 1]

  // Check common date fields
  const dateField = lastItem.updatedAt || lastItem.createdAt || lastItem.date || lastItem.lastUpdated

  return dateField || null
}

// Process tasks data
function processTasksData(tasks: any[]): string {
  try {
    // Group tasks by status (completed/not completed)
    const completed = tasks.filter((task) => task.completed)
    const pending = tasks.filter((task) => !task.completed)

    // Group pending tasks by due date
    const overdue = pending.filter((task) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return dueDate < new Date()
    })

    const dueSoon = pending.filter((task) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)
      return dueDate >= today && dueDate <= nextWeek
    })

    // Group by priority
    const highPriority = pending.filter((task) => task.priority === "high")

    // Create a summary
    const summary = {
      total: tasks.length,
      completed: completed.length,
      pending: pending.length,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      highPriority: highPriority.length,
    }

    // Include details of important tasks
    const importantTasks = [...overdue, ...dueSoon, ...highPriority]
      .filter((task, index, self) => index === self.findIndex((t) => t.id === task.id))
      .slice(0, 10) // Limit to 10 important tasks
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        tags: task.tags,
        category: task.category,
      }))

    return `User's tasks: ${JSON.stringify({
      summary,
      importantTasks,
    })}`
  } catch (error) {
    console.error("Error processing tasks data:", error)
    return ""
  }
}

// Process notes data
function processNotesData(notes: any[]): string {
  try {
    // Group notes by category
    const categories: Record<string, number> = {}
    notes.forEach((note) => {
      const category = note.category || "Uncategorized"
      categories[category] = (categories[category] || 0) + 1
    })

    // Get unique tags
    const allTags = new Set<string>()
    notes.forEach((note) => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach((tag: string) => allTags.add(tag))
      }
    })

    // Get recent notes
    const recentNotes = notes
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0)
        const dateB = new Date(b.createdAt || b.updatedAt || 0)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 5) // Get 5 most recent notes
      .map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content?.substring(0, 100) + (note.content?.length > 100 ? "..." : ""),
        category: note.category,
        tags: note.tags,
        createdAt: note.createdAt,
      }))

    return `User's notes: ${JSON.stringify({
      total: notes.length,
      categories,
      tags: Array.from(allTags),
      recentNotes,
    })}`
  } catch (error) {
    console.error("Error processing notes data:", error)
    return ""
  }
}

// Process bookmarks data
function processBookmarksData(bookmarks: any[]): string {
  try {
    // Group bookmarks by category
    const categories: Record<string, number> = {}
    bookmarks.forEach((bookmark) => {
      const category = bookmark.category || "Uncategorized"
      categories[category] = (categories[category] || 0) + 1
    })

    // Get unique tags
    const allTags = new Set<string>()
    bookmarks.forEach((bookmark) => {
      if (bookmark.tags && Array.isArray(bookmark.tags)) {
        bookmark.tags.forEach((tag: string) => allTags.add(tag))
      }
    })

    // Get recent bookmarks
    const recentBookmarks = bookmarks
      .slice(-5) // Get 5 most recent bookmarks
      .map((bookmark) => ({
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description,
        category: bookmark.category,
        tags: bookmark.tags,
      }))

    return `User's bookmarks: ${JSON.stringify({
      total: bookmarks.length,
      categories,
      tags: Array.from(allTags),
      recentBookmarks,
    })}`
  } catch (error) {
    console.error("Error processing bookmarks data:", error)
    return ""
  }
}

// Process knowledge data
function processKnowledgeData(knowledgeItems: any[]): string {
  try {
    // Group by category
    const categories: Record<string, number> = {}
    knowledgeItems.forEach((item) => {
      const category = item.category || "Uncategorized"
      categories[category] = (categories[category] || 0) + 1
    })

    // Get unique tags
    const allTags = new Set<string>()
    knowledgeItems.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag: string) => allTags.add(tag))
      }
    })

    // Get recent items
    const recentItems = knowledgeItems
      .slice(-5) // Get 5 most recent items
      .map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content?.substring(0, 100) + (item.content?.length > 100 ? "..." : ""),
        category: item.category,
        tags: item.tags,
        source: item.source,
      }))

    return `User's knowledge items: ${JSON.stringify({
      total: knowledgeItems.length,
      categories,
      tags: Array.from(allTags),
      recentItems,
    })}`
  } catch (error) {
    console.error("Error processing knowledge data:", error)
    return ""
  }
}

// Process planner/calendar data
function processPlannerData(plannerData: any[]): string {
  try {
    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get tomorrow's date
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get next week's date
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Filter events
    const todayEvents = plannerData.filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() === today.getTime()
    })

    const tomorrowEvents = plannerData.filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate.getTime() === tomorrow.getTime()
    })

    const upcomingEvents = plannerData.filter((event) => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate > today && eventDate <= nextWeek
    })

    // Format events
    const formatEvents = (events: any[]) =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description,
        category: event.category,
        isRecurring: event.isRecurring,
        recurringPattern: event.recurringPattern,
      }))

    return `User's calendar events: ${JSON.stringify({
      total: plannerData.length,
      todayEvents: formatEvents(todayEvents),
      tomorrowEvents: formatEvents(tomorrowEvents),
      upcomingEvents: formatEvents(upcomingEvents),
    })}`
  } catch (error) {
    console.error("Error processing planner data:", error)
    return ""
  }
}

// Process projects and gantt data
function processProjectsData(projects: any[] = [], ganttData: any = {}): string {
  try {
    let projectsInfo = []

    // Process standalone projects
    if (projects && projects.length > 0) {
      projectsInfo = projects.map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        priority: project.priority,
        members: project.members,
        taskCount: project.tasks?.length || 0,
      }))
    }

    // Process gantt projects
    if (ganttData && ganttData.projects && ganttData.projects.length > 0) {
      const ganttProjects = ganttData.projects.map((project: any) => {
        // Count tasks for this project
        const projectTasks = ganttData.tasks?.filter((task: any) => task.projectId === project.id) || []

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          start: project.start,
          end: project.end,
          taskCount: projectTasks.length,
          // Include a few tasks as examples
          sampleTasks: projectTasks.slice(0, 3).map((task: any) => ({
            id: task.id,
            name: task.name,
            status: task.status,
            progress: task.progress,
            priority: task.priority,
          })),
        }
      })

      // Add gantt projects to projects info if not already there
      ganttProjects.forEach((ganttProject: any) => {
        if (!projectsInfo.some((p) => p.id === ganttProject.id)) {
          projectsInfo.push(ganttProject)
        }
      })
    }

    return `User's projects: ${JSON.stringify({
      projectCount: projectsInfo.length,
      projects: projectsInfo,
    })}`
  } catch (error) {
    console.error("Error processing projects data:", error)
    return ""
  }
}

// Process remaining data types
function processRemainingData(data: AppData): string {
  try {
    const processedTypes = ["tasks", "notes", "bookmarks", "knowledgeItems", "plannerData", "projects", "ganttData"]

    const remainingData: Record<string, any> = {}

    Object.entries(data).forEach(([key, value]) => {
      // Skip already processed data types and empty values
      if (processedTypes.includes(key) || !value) return

      if (Array.isArray(value)) {
        // For arrays, provide count and sample items
        const sampleItems = value.slice(-3).map((item) => {
          if (typeof item === "object" && item !== null) {
            // Keep only essential fields for each item type
            const essentialItem: Record<string, any> = {}

            // Common fields to keep
            if ("id" in item) essentialItem.id = item.id
            if ("title" in item) essentialItem.title = item.title
            if ("name" in item) essentialItem.name = item.name

            // Type-specific fields
            if (key === "passwordEntries") {
              if ("username" in item) essentialItem.username = item.username
              if ("website" in item) essentialItem.website = item.website
              // Don't include actual passwords
            } else if (key === "codeSnippets") {
              if ("language" in item) essentialItem.language = item.language
              if ("description" in item) essentialItem.description = item.description
              // Include a truncated version of the code
              if ("code" in item) essentialItem.code = item.code.substring(0, 50) + (item.code.length > 50 ? "..." : "")
            } else if (key === "contacts") {
              if ("firstName" in item) essentialItem.firstName = item.firstName
              if ("lastName" in item) essentialItem.lastName = item.lastName
              if ("email" in item) essentialItem.email = item.email
              if ("company" in item) essentialItem.company = item.company
            } else if (key === "financeData") {
              if ("type" in item) essentialItem.type = item.type
              if ("amount" in item) essentialItem.amount = item.amount
              if ("category" in item) essentialItem.category = item.category
              if ("date" in item) essentialItem.date = item.date
            } else if (key === "workoutHistory") {
              if ("date" in item) essentialItem.date = item.date
              if ("duration" in item) essentialItem.duration = item.duration
              if ("calories" in item) essentialItem.calories = item.calories
              // Include a summary of exercises
              if ("exercises" in item && Array.isArray(item.exercises)) {
                essentialItem.exerciseCount = item.exercises.length
                essentialItem.exerciseTypes = item.exercises.map((ex: any) => ex.name).slice(0, 3)
              }
            } else if (key === "flashcards") {
              if ("front" in item) essentialItem.front = item.front
              if ("back" in item) essentialItem.back = item.back
              if ("deckId" in item) essentialItem.deckId = item.deckId
            }

            return essentialItem
          }
          return item
        })

        remainingData[key] = {
          count: value.length,
          sampleItems: sampleItems.length > 0 ? sampleItems : undefined,
        }
      } else if (typeof value === "object" && value !== null) {
        // For objects, provide a summary of keys
        remainingData[key] = {
          type: "object",
          keys: Object.keys(value),
        }
      } else {
        // For primitive values, include as is
        remainingData[key] = value
      }
    })

    return `Additional user data: ${JSON.stringify(remainingData)}`
  } catch (error) {
    console.error("Error processing remaining data:", error)
    return ""
  }
}

// Helper to truncate text
function truncateText(text: string, maxLength: number): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

// Improved function to extract data edit operations from AI responses
function extractDataEditOperation(content: string): DataEditOperation | DataEditOperation[] | null {
  try {
    // First, find the marker and extract everything after it
    const markerIndex = content.indexOf("DATA_EDIT_OPERATION:")
    if (markerIndex === -1) return null

    // Get the text after the marker
    const textAfterMarker = content.substring(markerIndex + "DATA_EDIT_OPERATION:".length).trim()

    // Find the JSON object or array using a more precise approach
    // Look for the first '{' or '[' and the matching closing '}' or ']'
    const startIndex = textAfterMarker.search(/[{[]/)
    if (startIndex === -1) return null

    const startChar = textAfterMarker[startIndex]
    const endChar = startChar === "{" ? "}" : "]"
    let bracketCount = 1
    let endIndex = -1

    // Scan through the text to find the matching closing bracket
    for (let i = startIndex + 1; i < textAfterMarker.length; i++) {
      if (textAfterMarker[i] === startChar) bracketCount++
      if (textAfterMarker[i] === endChar) bracketCount--

      if (bracketCount === 0) {
        endIndex = i
        break
      }
    }

    if (endIndex === -1) return null

    // Extract the JSON string
    let jsonStr = textAfterMarker.substring(startIndex, endIndex + 1)

    // Clean up the JSON string
    jsonStr = cleanJsonString(jsonStr)

    // Try to parse the JSON
    try {
      // First try with standard cleaning
      const operation = JSON.parse(jsonStr)

      // Check if it's an array of operations
      if (Array.isArray(operation)) {
        // Validate each operation in the array
        const validOperations = operation.filter((op) => op.type && op.collection)
        if (validOperations.length === 0) {
          console.error("No valid operations in array:", operation)
          return null
        }
        return validOperations as DataEditOperation[]
      } else {
        // Single operation
        if (!operation.type || !operation.collection) {
          console.error("Invalid data edit operation:", operation)
          return null
        }
        return operation as DataEditOperation
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "for JSON string:", jsonStr)

      try {
        // Try with special character processing
        const processedJson = processJsonString(jsonStr)
        const operation = JSON.parse(processedJson)

        // Check if it's an array of operations
        if (Array.isArray(operation)) {
          // Validate each operation in the array
          const validOperations = operation.filter((op) => op.type && op.collection)
          if (validOperations.length === 0) {
            console.error("No valid operations in array:", operation)
            return null
          }
          return validOperations as DataEditOperation[]
        } else {
          // Single operation
          if (!operation.type || !operation.collection) {
            console.error("Invalid data edit operation from processed JSON:", operation)
            return null
          }
          return operation as DataEditOperation
        }
      } catch (processError) {
        console.error("Process JSON error:", processError)

        // Try a fallback approach with aggressive cleaning as last resort
        const fallbackJson = aggressiveJsonCleaning(jsonStr)
        try {
          const operation = JSON.parse(fallbackJson)

          // Check if it's an array of operations
          if (Array.isArray(operation)) {
            // Validate each operation in the array
            const validOperations = operation.filter((op) => op.type && op.collection)
            if (validOperations.length === 0) {
              console.error("No valid operations in array:", operation)
              return null
            }
            return validOperations as DataEditOperation[]
          } else {
            // Single operation
            if (!operation.type || !operation.collection) {
              console.error("Invalid data edit operation from fallback:", operation)
              return null
            }
            return operation as DataEditOperation
          }
        } catch (fallbackError) {
          console.error("Fallback JSON parse error:", fallbackError)
          return null
        }
      }
    }
  } catch (error) {
    console.error("Error extracting data edit operation:", error, "from content:", content)
    return null
  }
}

// Improved JSON string cleaning
function cleanJsonString(jsonStr: string): string {
  // Handle apostrophes in strings properly
  let cleaned = jsonStr

  // Fix trailing commas
  cleaned = cleaned.replace(/,\s*}/g, "}")
  cleaned = cleaned.replace(/,\s*\]/g, "]")

  // Fix missing quotes around property names
  cleaned = cleaned.replace(/(\{|,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')

  // Remove any non-printable characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, "")

  // Fix unescaped quotes in strings
  cleaned = fixUnescapedQuotes(cleaned)

  return cleaned
}

// New function to fix unescaped quotes in JSON strings
function fixUnescapedQuotes(jsonStr: string): string {
  let result = ""
  let inString = false
  let escaped = false

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i]

    if (inString) {
      if (escaped) {
        // This character is escaped
        result += char
        escaped = false
      } else if (char === "\\") {
        // Escape character
        result += char
        escaped = true
      } else if (char === '"') {
        // End of string
        result += char
        inString = false
      } else {
        // Regular character in string
        result += char
      }
    } else {
      if (char === '"') {
        // Start of string
        result += char
        inString = true
      } else {
        // Regular character outside string
        result += char
      }
    }
  }

  return result
}

// Process JSON string to handle apostrophes and other special characters
function processJsonString(jsonStr: string): string {
  try {
    // First attempt to parse as is
    JSON.parse(jsonStr)
    return jsonStr
  } catch (error) {
    // If parsing fails, try to fix common issues

    // Create a temporary object to properly escape the string
    const tempObj = { str: jsonStr }
    const serialized = JSON.stringify(tempObj)
    // Extract the properly escaped string (removing the {"str": and } wrapper)
    const processed = serialized.substring(8, serialized.length - 1)

    try {
      // Verify the processed string is valid JSON
      JSON.parse(processed)
      return processed
    } catch (innerError) {
      console.error("Failed to process JSON string:", innerError)
      return jsonStr // Return original if all attempts fail
    }
  }
}

// More aggressive JSON cleaning for fallback
function aggressiveJsonCleaning(jsonStr: string): string {
  // Start with basic cleaning
  const cleaned = cleanJsonString(jsonStr)

  // Try to fix any unbalanced quotes
  let inQuote = false
  let fixedStr = ""

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]

    if (char === '"' && (i === 0 || cleaned[i - 1] !== "\\")) {
      inQuote = !inQuote
    }

    fixedStr += char
  }

  // If we ended with an unclosed quote, add a closing quote
  if (inQuote) {
    fixedStr += '"'
  }

  // Ensure all objects and arrays are properly closed
  let braceCount = 0
  let bracketCount = 0

  for (let i = 0; i < fixedStr.length; i++) {
    if (fixedStr[i] === "{") braceCount++
    if (fixedStr[i] === "}") braceCount--
    if (fixedStr[i] === "[") bracketCount++
    if (fixedStr[i] === "]") bracketCount--
  }

  // Add missing closing braces/brackets
  while (braceCount > 0) {
    fixedStr += "}"
    braceCount--
  }

  while (bracketCount > 0) {
    fixedStr += "]"
    bracketCount--
  }

  return fixedStr
}

// Remove data edit operation from AI response
function removeDataEditOperation(content: string): string {
  // Find the marker
  const markerIndex = content.indexOf("DATA_EDIT_OPERATION:")
  if (markerIndex === -1) return content

  // Get everything before the marker
  const beforeMarker = content.substring(0, markerIndex).trim()

  // Find where the JSON object ends
  const textAfterMarker = content.substring(markerIndex + "DATA_EDIT_OPERATION:".length)
  const startBraceIndex = textAfterMarker.search(/[{[]/)

  if (startBraceIndex === -1) return content

  let braceCount = 1
  let endBraceIndex = -1
  const startChar = textAfterMarker[startBraceIndex]
  const endChar = startChar === "{" ? "}" : "]"

  // Scan through the text to find the matching closing brace
  for (let i = startBraceIndex + 1; i < textAfterMarker.length; i++) {
    if (textAfterMarker[i] === startChar) braceCount++
    if (textAfterMarker[i] === endChar) braceCount--

    if (braceCount === 0) {
      endBraceIndex = i
      break
    }
  }

  if (endBraceIndex === -1) return content

  // Get everything after the JSON object
  const afterJson = textAfterMarker.substring(endBraceIndex + 1).trim()

  // Combine the parts
  return beforeMarker + (beforeMarker && afterJson ? "\n\n" : "") + afterJson
}

// Estimate the size of the data
function estimateDataSize(data: AppData): number {
  try {
    const jsonString = JSON.stringify(data)
    return new TextEncoder().encode(jsonString).length
  } catch (error) {
    console.error("Error estimating data size:", error)
    return 0
  }
}
