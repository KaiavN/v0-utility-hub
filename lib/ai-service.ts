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
    userProfile?: any,
  ): Promise<{ content: string; dataEditOperation?: DataEditOperation | DataEditOperation[] | null; error?: string }> {
    try {
      // Always enable data access
      canAccessData = true

      // Prepare system message with context about the application
      const systemMessage: OpenRouterMessage = {
        role: "system",
        content: generateSystemPrompt(canAccessData, canEditData),
      }

      // Add user profile context if available
      if (userProfile) {
        const userContextMessage: OpenRouterMessage = {
          role: "system",
          content: generateUserProfileContext(userProfile),
        }

        // Insert user context after system message but before data contexts
        if (messages.length > 0 && messages[0].role === "system") {
          messages.splice(1, 0, userContextMessage)
        } else {
          messages.unshift(userContextMessage)
        }
      }

      // Add data context if allowed (which is now always true)
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

// Optimize message history to reduce token usage but keep enough context
function optimizeMessageHistory(messages: OpenRouterMessage[]): OpenRouterMessage[] {
  // Keep all system messages
  const systemMessages = messages.filter((msg) => msg.role === "system")

  // For user and assistant messages, keep only the most recent ones
  const conversationMessages = messages.filter((msg) => msg.role !== "system")

  // If we have more than 20 conversation messages, keep only the most recent ones
  // This is increased from 15 to 20 to provide more context
  const recentMessages = conversationMessages.length > 20 ? conversationMessages.slice(-20) : conversationMessages

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
  const userPreferencesString = typeof localStorage !== "undefined" ? localStorage.getItem("userPreferences") : null
  const userPreferences = userPreferencesString ? JSON.parse(userPreferencesString) : { role: "student" }
  const role = userPreferences.role || "student"

  let prompt = `You're an AI assistant for "Utility Hub" - a comprehensive web app that stores data in localStorage.

Current date/time: ${formattedDate} at ${formattedTime}.

## YOUR ROLE

You are a PROACTIVE and KNOWLEDGEABLE assistant. Don't just answer questions - anticipate needs and take initiative:

1. When users mention tasks, events, or information they need to track, AUTOMATICALLY offer to create appropriate entries
2. Always provide COMPLETE data entries with detailed descriptions, not just basic fields
3. When creating tasks, include detailed descriptions, appropriate due dates, and relevant tags
4. For notes and knowledge items, generate comprehensive content based on context
5. Suggest related items across features (e.g., create both a task and calendar event for deadlines)
6. Offer to create multiple related entries when appropriate (e.g., project + related tasks)
7. Understand relationships between different data types (e.g., projects contain tasks, meetings appear in calendar)
8. Provide specific examples when explaining features

## RELIABILITY GUIDELINES

1. When editing data, ALWAYS use the proper format and structure
2. For dates, ALWAYS use YYYY-MM-DD format (e.g., 2025-04-22)
3. When creating or updating data, verify all required fields are present
4. After making data changes, summarize what was done for the user
5. If a data operation fails, explain what went wrong and offer an alternative approach
6. Always provide complete field values - especially for descriptions, content, and notes
7. Remember that each data type has specific requirements - reference the documentation if unsure

## APPLICATION STRUCTURE

Utility Hub is organized into these main components:

1. App Sidebar: Navigation menu for all features
2. Feature Pages: Individual pages for each feature (tasks, notes, etc.)
3. Data Storage: All data is stored in localStorage with specific keys
4. Settings: Global and feature-specific settings
5. Data Import/Export: Tools for backing up and transferring data

## FEATURES`

  // Add features based on user role
  if (role === "student") {
    prompt += `

### Task Management
- Create to-dos with due dates, priorities, tags
- Mark complete, filter, sort
- Uses: Daily to-dos, work tasks, shopping lists
- Data structure: Array of task objects with title, description, dueDate, completed, priority, tags, category

### Notes
- Create formatted notes with titles
- Organize with tags, categories, colors
- Uses: Meeting notes, ideas, journal entries
- Data structure: Array of note objects with title, content, tags, category, color, createdAt

### Bookmarks
- Save URLs with titles, descriptions, tags
- Uses: Research resources, reading lists
- Data structure: Array of bookmark objects with title, url, description, tags, category, favicon

### Password Manager
- Store credentials securely
- Uses: Website logins, account info
- Data structure: Array of password objects with title, username, password, website, notes, category, lastUpdated

### Knowledge Base
- Store structured information
- Uses: Study notes, research, documentation
- Data structure: Array of knowledge objects with title, content, tags, category, source, createdAt

### Code Snippets
- Save code with syntax highlighting
- Uses: Programming reference, reusable functions
- Data structure: Array of snippet objects with title, code, language, description, tags, createdAt

### Meal Planning
- Store recipes and plan meals
- Uses: Weekly meal planning, recipe collection
- Data structure: Array of recipe objects with title, ingredients, instructions, prepTime, cookTime, servings, category, tags

### Workout Tracker
- Log exercises, duration, calories
- Uses: Fitness tracking, exercise routines
- Data structure: Array of workout objects with date, exercises, duration, calories, notes

### Countdown Timers
- Track important dates
- Uses: Event planning, deadlines
- Data structure: Array of timer objects with title, targetDate, description, color

### Flashcards
- Create study cards with front/back
- Uses: Language learning, exam prep
- Data structure: Array of flashcard objects with front, back, deckId

### Assignment Tracker
- Track academic work with due dates
- Uses: Homework management, research papers
- Data structure: Array of assignment objects with title, dueDate, description, course, priority, completed, attachments

### Calendar
- Schedule events with recurring options
- Uses: Appointments, time blocking
- Data structure: Array of planner objects with title, date, startTime, endTime, description, category, isRecurring, recurringPattern, color, completed

### Gantt Chart
- Visual project planning with dependencies
- Uses: Project management, timelines
- Data structure: Complex object with projects, tasks, sections, and links arrays

### Citation Manager
- Track academic references
- Uses: Research papers, academic writing
- Data structure: Array of citation objects with title, source, authors, date, url, journal, volume, issue, pages, publisher, doi, notes, tags

### Spotify Integration
- Connect to Spotify, control playback
- Uses: Background music while working
- Data structure: Spotify tokens and preferences stored in localStorage

## FEATURE RELATIONSHIPS

1. Tasks → Calendar: High priority tasks can create countdown timers
2. Assignments → Gantt Chart: Assignments can be visualized in the Gantt chart
3. Meetings → Calendar: Meetings automatically create calendar events
4. Projects → Gantt Chart: Projects are synchronized with the Gantt chart
5. Tasks → Projects: Tasks can be associated with projects

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
- Data structure: Array of task objects with title, description, dueDate, completed, priority, tags, category

### Notes
- Create formatted notes with titles
- Organize with tags, categories, colors
- Uses: Meeting notes, ideas, journal entries
- Data structure: Array of note objects with title, content, tags, category, color, createdAt

### Bookmarks
- Save URLs with titles, descriptions, tags
- Uses: Research resources, reading lists
- Data structure: Array of bookmark objects with title, url, description, tags, category, favicon

### Password Manager
- Store credentials securely
- Uses: Website logins, account info
- Data structure: Array of password objects with title, username, password, website, notes, category, lastUpdated

### Knowledge Base
- Store structured information
- Uses: Study notes, research, documentation
- Data structure: Array of knowledge objects with title, content, tags, category, source, createdAt

### Code Snippets
- Save code with syntax highlighting
- Uses: Programming reference, reusable functions
- Data structure: Array of snippet objects with title, code, language, description, tags, createdAt

### Meal Planning
- Store recipes and plan meals
- Uses: Weekly meal planning, recipe collection
- Data structure: Array of recipe objects with title, ingredients, instructions, prepTime, cookTime, servings, category, tags

### Workout Tracker
- Log exercises, duration, calories
- Uses: Fitness tracking, exercise routines
- Data structure: Array of workout objects with date, exercises, duration, calories, notes

### Contacts Manager
- Store contact details
- Uses: Address book, client directory
- Data structure: Array of contact objects with firstName, lastName, email, phone, address, company, notes, tags, category

### Finance Dashboard
- Track income/expenses, accounts, goals
- Uses: Budgeting, expense tracking
- Data structure: Complex object with transactions, accounts, goals, and categories

### Markdown Editor
- Create formatted documents
- Uses: Documentation, blog posts, notes
- Data structure: Array of document objects with title, content, tags, createdAt, lastUpdated, category

### Countdown Timers
- Track important dates
- Uses: Event planning, deadlines
- Data structure: Array of timer objects with title, targetDate, description, color

### Project Tracker
- Manage complex projects with team members
- Uses: Work projects, renovations, events
- Data structure: Array of project objects with title, description, startDate, endDate, status, members, tasks, category

### Meeting Notes
- Schedule meetings, prepare agendas
- Uses: Work meetings, interviews
- Data structure: Array of meeting objects with title, date, startTime, endTime, location, participants, agenda, notes

### Client Manager
- Track client information
- Uses: Freelance work, consulting
- Data structure: Array of client objects with name, email, phone, company, address, notes, projects

### Time Billing
- Track billable time and invoices
- Uses: Freelancers, consultants
- Data structure: Array of billing objects with client, amount, date, description, status (paid/unpaid/partial), dueDate, invoiceNumber, paymentMethod

### Calendar
- Schedule events with recurring options
- Uses: Appointments, time blocking
- Data structure: Array of planner objects with title, date, startTime, endTime, description, category, isRecurring, recurringPattern, color, completed

### Gantt Chart
- Visual project planning with dependencies
- Uses: Project management, timelines
- Data structure: Complex object with projects, tasks, sections, and links arrays

## FEATURE RELATIONSHIPS

1. Projects → Tasks: Projects contain multiple tasks
2. Clients → Projects: Clients are associated with projects
3. Meetings → Calendar: Meetings automatically create calendar events
4. Projects → Gantt Chart: Projects are synchronized with the Gantt chart
5. Clients → Billing: Billing entries are associated with clients
6. Tasks → Projects: Tasks can be associated with projects

## COMMON WORKFLOWS

1. **Professional**: Tasks + Projects + Meetings + Clients + Billing + Gantt
2. **Personal**: Calendar + Tasks + Notes + Contacts + Finance
3. **Content Creation**: Markdown + Knowledge Base + Bookmarks + Code Snippets
4. **Health**: Meal Planning + Workout Tracker + Calendar`
  }

  // Always include data access information
  prompt += `\n\nYou have access to user data for personalized assistance. I will provide you with detailed information about the user's data in separate messages. Use this data to provide context-aware responses and suggestions.`

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
9. For dates, use YYYY-MM-DD format
10. For ISO dates, use proper ISO format (YYYY-MM-DDThh:mm:ss.sssZ)
11. For arrays, use proper JSON array format with square brackets
12. For nested objects, use proper JSON object format with curly braces

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

    // Process contacts
    if (allData.contacts && allData.contacts.length > 0) {
      const contactsContext = processContactsData(allData.contacts)
      if (contactsContext) contexts.push(contactsContext)
    }

    // Process finance data
    if (allData.financeData) {
      const financeContext = processFinanceData(allData.financeData)
      if (financeContext) contexts.push(financeContext)
    }

    // Process meetings
    if (allData.meetings && allData.meetings.length > 0) {
      const meetingsContext = processMeetingsData(allData.meetings)
      if (meetingsContext) contexts.push(meetingsContext)
    }

    // Process clients
    if (allData.clients && allData.clients.length > 0) {
      const clientsContext = processClientsData(allData.clients)
      if (clientsContext) contexts.push(clientsContext)
    }

    // Process assignments
    if (allData.assignments && allData.assignments.length > 0) {
      const assignmentsContext = processAssignmentsData(allData.assignments)
      if (assignmentsContext) contexts.push(assignmentsContext)
    }

    // Process flashcards
    if (allData.flashcards && allData.flashcards.length > 0) {
      const flashcardsContext = processFlashcardsData(allData.flashcards)
      if (flashcardsContext) contexts.push(flashcardsContext)
    }

    // Process code snippets
    if (allData.codeSnippets && allData.codeSnippets.length > 0) {
      const snippetsContext = processCodeSnippetsData(allData.codeSnippets)
      if (snippetsContext) contexts.push(snippetsContext)
    }

    // Process markdown documents
    if (allData.markdownDocuments && allData.markdownDocuments.length > 0) {
      const markdownContext = processMarkdownData(allData.markdownDocuments)
      if (markdownContext) contexts.push(markdownContext)
    }

    // Process countdown timers
    if (allData.countdownTimers && allData.countdownTimers.length > 0) {
      const timersContext = processCountdownTimersData(allData.countdownTimers)
      if (timersContext) contexts.push(timersContext)
    }

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

// Process contacts data
function processContactsData(contacts: any[]): string {
  try {
    // Group contacts by category
    const categories: Record<string, number> = {}
    contacts.forEach((contact) => {
      const category = contact.category || "Uncategorized"
      categories[category] = (categories[category] || 0) + 1
    })

    // Get unique tags
    const allTags = new Set<string>()
    contacts.forEach((contact) => {
      if (contact.tags && Array.isArray(contact.tags)) {
        contact.tags.forEach((tag: string) => allTags.add(tag))
      }
    })

    // Get recent contacts
    const recentContacts = contacts
      .slice(-5) // Get 5 most recent contacts
      .map((contact) => ({
        id: contact.id,
        name: contact.firstName + (contact.lastName ? ` ${contact.lastName}` : ""),
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        category: contact.category,
        tags: contact.tags,
      }))

    return `User's contacts: ${JSON.stringify({
      total: contacts.length,
      categories,
      tags: Array.from(allTags),
      recentContacts,
    })}`
  } catch (error) {
    console.error("Error processing contacts data:", error)
    return ""
  }
}

// Process finance data
function processFinanceData(financeData: any): string {
  try {
    // If financeData is an array, process it as transactions
    if (Array.isArray(financeData)) {
      // Group by type
      const income = financeData.filter((item) => item.type === "income")
      const expenses = financeData.filter((item) => item.type === "expense")
      const transfers = financeData.filter((item) => item.type === "transfer")

      // Group by category
      const categories: Record<string, { count: number; total: number }> = {}
      financeData.forEach((item) => {
        const category = item.category || "Uncategorized"
        if (!categories[category]) {
          categories[category] = { count: 0, total: 0 }
        }
        categories[category].count++
        categories[category].total += item.amount || 0
      })

      // Get recent transactions
      const recentTransactions = financeData
        .slice(-5) // Get 5 most recent transactions
        .map((item) => ({
          id: item.id,
          type: item.type,
          amount: item.amount,
          category: item.category,
          description: item.description,
          date: item.date,
          account: item.account,
        }))

      return `User's finance data: ${JSON.stringify({
        total: financeData.length,
        income: income.length,
        expenses: expenses.length,
        transfers: transfers.length,
        categories,
        recentTransactions,
      })}`
    } else if (typeof financeData === "object" && financeData !== null) {
      // Process as a complex finance object
      const summary = {
        accounts: financeData.accounts?.length || 0,
        transactions: financeData.transactions?.length || 0,
        goals: financeData.goals?.length || 0,
        categories: financeData.categories?.length || 0,
      }

      // Get account summaries
      const accounts =
        financeData.accounts?.map((account: any) => ({
          id: account.id,
          name: account.name,
          balance: account.balance,
          type: account.type,
        })) || []

      // Get recent transactions
      const recentTransactions = (financeData.transactions || [])
        .slice(-5) // Get 5 most recent transactions
        .map((item: any) => ({
          id: item.id,
          type: item.type,
          amount: item.amount,
          category: item.category,
          description: item.description,
          date: item.date,
          account: item.account,
        }))

      return `User's finance data: ${JSON.stringify({
        summary,
        accounts,
        recentTransactions,
      })}`
    }

    return `User's finance data: ${JSON.stringify(financeData)}`
  } catch (error) {
    console.error("Error processing finance data:", error)
    return ""
  }
}

// Process meetings data
function processMeetingsData(meetings: any[]): string {
  try {
    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get upcoming meetings
    const upcomingMeetings = meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.date)
      meetingDate.setHours(0, 0, 0, 0)
      return meetingDate >= today
    })

    // Get past meetings
    const pastMeetings = meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.date)
      meetingDate.setHours(0, 0, 0, 0)
      return meetingDate < today
    })

    // Format meetings
    const formatMeetings = (meetings: any[]) =>
      meetings.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        participants: meeting.participants,
        agenda: meeting.agenda?.substring(0, 100) + (meeting.agenda?.length > 100 ? "..." : ""),
      }))

    return `User's meetings: ${JSON.stringify({
      total: meetings.length,
      upcoming: formatMeetings(upcomingMeetings.slice(0, 5)),
      past: formatMeetings(pastMeetings.slice(-3)),
    })}`
  } catch (error) {
    console.error("Error processing meetings data:", error)
    return ""
  }
}

// Process clients data
function processClientsData(clients: any[]): string {
  try {
    // Get recent clients
    const recentClients = clients
      .slice(-5) // Get 5 most recent clients
      .map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        projectCount: client.projects?.length || 0,
      }))

    return `User's clients: ${JSON.stringify({
      total: clients.length,
      recentClients,
    })}`
  } catch (error) {
    console.error("Error processing clients data:", error)
    return ""
  }
}

// Process assignments data
function processAssignmentsData(assignments: any[]): string {
  try {
    // Group assignments by status (completed/not completed)
    const completed = assignments.filter((assignment) => assignment.completed)
    const pending = assignments.filter((assignment) => !assignment.completed)

    // Group pending assignments by due date
    const overdue = pending.filter((assignment) => {
      if (!assignment.dueDate) return false
      const dueDate = new Date(assignment.dueDate)
      return dueDate < new Date()
    })

    const dueSoon = pending.filter((assignment) => {
      if (!assignment.dueDate) return false
      const dueDate = new Date(assignment.dueDate)
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)
      return dueDate >= today && dueDate <= nextWeek
    })

    // Group by course
    const courses: Record<string, number> = {}
    assignments.forEach((assignment) => {
      const course = assignment.course || "Uncategorized"
      courses[course] = (courses[course] || 0) + 1
    })

    // Create a summary
    const summary = {
      total: assignments.length,
      completed: completed.length,
      pending: pending.length,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      courses,
    }

    // Include details of important assignments
    const importantAssignments = [...overdue, ...dueSoon]
      .filter((assignment, index, self) => index === self.findIndex((a) => a.id === assignment.id))
      .slice(0, 5) // Limit to 5 important assignments
      .map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        course: assignment.course,
        priority: assignment.priority,
      }))

    return `User's assignments: ${JSON.stringify({
      summary,
      importantAssignments,
    })}`
  } catch (error) {
    console.error("Error processing assignments data:", error)
    return ""
  }
}

// Process flashcards data
function processFlashcardsData(flashcards: any[]): string {
  try {
    // Group by deck
    const decks: Record<string, number> = {}
    flashcards.forEach((card) => {
      const deck = card.deckId || "Default"
      decks[deck] = (decks[deck] || 0) + 1
    })

    // Get sample cards
    const sampleCards = flashcards
      .slice(0, 5) // Get 5 sample cards
      .map((card) => ({
        id: card.id,
        front: card.front?.substring(0, 50) + (card.front?.length > 50 ? "..." : ""),
        back: card.back?.substring(0, 50) + (card.back?.length > 50 ? "..." : ""),
        deckId: card.deckId,
      }))

    return `User's flashcards: ${JSON.stringify({
      total: flashcards.length,
      decks,
      sampleCards,
    })}`
  } catch (error) {
    console.error("Error processing flashcards data:", error)
    return ""
  }
}

// Process code snippets data
function processCodeSnippetsData(snippets: any[]): string {
  try {
    // Group by language
    const languages: Record<string, number> = {}
    snippets.forEach((snippet) => {
      const language = snippet.language || "Unknown"
      languages[language] = (languages[language] || 0) + 1
    })

    // Get unique tags
    const allTags = new Set<string>()
    snippets.forEach((snippet) => {
      if (snippet.tags && Array.isArray(snippet.tags)) {
        snippet.tags.forEach((tag: string) => allTags.add(tag))
      }
    })

    // Get recent snippets
    const recentSnippets = snippets
      .slice(-5) // Get 5 most recent snippets
      .map((snippet) => ({
        id: snippet.id,
        title: snippet.title,
        language: snippet.language,
        description: snippet.description,
        code: snippet.code?.substring(0, 50) + (snippet.code?.length > 50 ? "..." : ""),
        tags: snippet.tags,
      }))

    return `User's code snippets: ${JSON.stringify({
      total: snippets.length,
      languages,
      tags: Array.from(allTags),
      recentSnippets,
    })}`
  } catch (error) {
    console.error("Error processing code snippets data:", error)
    return ""
  }
}

// Process markdown documents data
function processMarkdownData(documents: any[]): string {
  try {
    // Group by category
    const categories: Record<string, number> = {}
    documents.forEach((doc) => {
      const category = doc.category || "Uncategorized"
      categories[category] = (categories[category] || 0) + 1
    })

    // Get unique tags
    const allTags = new Set<string>()
    documents.forEach((doc) => {
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach((tag: string) => allTags.add(tag))
      }
    })

    // Get recent documents
    const recentDocuments = documents
      .sort((a, b) => {
        const dateA = new Date(a.lastUpdated || a.createdAt || 0)
        const dateB = new Date(b.lastUpdated || b.createdAt || 0)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 5) // Get 5 most recent documents
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content?.substring(0, 100) + (doc.content?.length > 100 ? "..." : ""),
        category: doc.category,
        tags: doc.tags,
        lastUpdated: doc.lastUpdated || doc.createdAt,
      }))

    return `User's markdown documents: ${JSON.stringify({
      total: documents.length,
      categories,
      tags: Array.from(allTags),
      recentDocuments,
    })}`
  } catch (error) {
    console.error("Error processing markdown data:", error)
    return ""
  }
}

// Process countdown timers data
function processCountdownTimersData(timers: any[]): string {
  try {
    // Get today's date
    const today = new Date()

    // Sort timers by target date
    const sortedTimers = [...timers].sort((a, b) => {
      const dateA = new Date(a.targetDate)
      const dateB = new Date(b.targetDate)
      return dateA.getTime() - dateB.getTime()
    })

    // Get upcoming timers
    const upcomingTimers = sortedTimers.filter((timer) => {
      const targetDate = new Date(timer.targetDate)
      return targetDate > today
    })

    // Get expired timers
    const expiredTimers = sortedTimers.filter((timer) => {
      const targetDate = new Date(timer.targetDate)
      return targetDate <= today
    })

    // Format timers
    const formatTimers = (timers: any[]) =>
      timers.map((timer) => ({
        id: timer.id,
        title: timer.title,
        targetDate: timer.targetDate,
        description: timer.description,
        color: timer.color,
      }))

    return `User's countdown timers: ${JSON.stringify({
      total: timers.length,
      upcoming: formatTimers(upcomingTimers.slice(0, 5)),
      expired: formatTimers(expiredTimers.slice(-3)),
    })}`
  } catch (error) {
    console.error("Error processing countdown timers data:", error)
    return ""
  }
}

// Process remaining data types
function processRemainingData(data: AppData): string {
  try {
    const processedTypes = [
      "tasks",
      "notes",
      "bookmarks",
      "knowledgeItems",
      "plannerData",
      "projects",
      "ganttData",
      "contacts",
      "financeData",
      "meetings",
      "clients",
      "assignments",
      "flashcards",
      "codeSnippets",
      "markdownDocuments",
      "countdownTimers",
    ]

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
            } else if (key === "workoutHistory") {
              if ("date" in item) essentialItem.date = item.date
              if ("duration" in item) essentialItem.duration = item.duration
              if ("calories" in item) essentialItem.calories = item.calories
              // Include a summary of exercises
              if ("exercises" in item && Array.isArray(item.exercises)) {
                essentialItem.exerciseCount = item.exercises.length
                essentialItem.exerciseTypes = item.exercises.map((ex: any) => ex.name).slice(0, 3)
              }
            } else if (key === "billingData") {
              if ("client" in item) essentialItem.client = item.client
              if ("amount" in item) essentialItem.amount = item.amount
              if ("date" in item) essentialItem.date = item.date
              if ("status" in item) essentialItem.status = item.status
              if ("dueDate" in item) essentialItem.dueDate = item.dueDate
            } else if (key === "citations") {
              if ("title" in item) essentialItem.title = item.title
              if ("source" in item) essentialItem.source = item.source
              if ("authors" in item) essentialItem.authors = item.authors
              if ("date" in item) essentialItem.date = item.date
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

// Generate context about the user profile
function generateUserProfileContext(userProfile: any): string {
  if (!userProfile) return ""

  try {
    const now = new Date()
    const lastInteraction = userProfile.interactions?.lastInteraction
      ? new Date(userProfile.interactions.lastInteraction)
      : null

    let context = `## USER PROFILE
This user has interacted with you ${userProfile.interactions?.count || 0} times.`

    // Add time since last interaction
    if (lastInteraction) {
      const timeSince = formatTimeSince(lastInteraction, now)
      context += ` Their last interaction was ${timeSince}.`
    }

    // Add traits if they exist
    if (userProfile.traits && Object.keys(userProfile.traits).length > 0) {
      context += `\n\n### User Traits:\n`
      Object.entries(userProfile.traits).forEach(([trait, value]) => {
        context += `- ${formatTraitName(trait)}: ${value}\n`
      })
    }

    // Add preferences if they exist
    if (userProfile.preferences && Object.keys(userProfile.preferences).length > 0) {
      context += `\n### User Preferences:\n`
      Object.entries(userProfile.preferences).forEach(([pref, value]) => {
        context += `- ${formatTraitName(pref)}: ${value}\n`
      })
    }

    // Add knowledge areas if they exist
    if (userProfile.knowledgeAreas && userProfile.knowledgeAreas.length > 0) {
      context += `\n### Knowledge Areas:\n`
      userProfile.knowledgeAreas.forEach((area: string) => {
        context += `- ${area}\n`
      })
    }

    // Add recent conversations for context
    if (userProfile.interactions?.recentQueries && userProfile.interactions.recentQueries.length > 0) {
      context += `\n### Recent Topics:\n`
      userProfile.interactions.recentQueries.slice(0, 5).forEach((query: any) => {
        const queryTime = new Date(query.timestamp)
        const timeSince = formatTimeSince(queryTime, now)
        context += `- ${timeSince}: "${query.content}"\n`
      })
    }

    // Add common topics if they exist
    if (userProfile.interactions?.commonTopics && userProfile.interactions.commonTopics.length > 0) {
      context += `\n### Common Topics:\n`
      userProfile.interactions.commonTopics.forEach((topic: string) => {
        context += `- ${topic}\n`
      })
    }

    context += `\nUse this information to provide more personalized assistance. However, only reference this information when relevant to the current conversation. Don't explicitly mention that you know these details about them unless they ask.`

    return context
  } catch (error) {
    console.error("Error generating user profile context:", error)
    return "" // Return empty string if error
  }
}

// Helper function to format trait names for display
function formatTraitName(trait: string): string {
  return trait
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

// Helper function to format time since
function formatTimeSince(past: Date, now: Date): string {
  const diffMs = now.getTime() - past.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return diffDays === 1 ? "yesterday" : `${diffDays} days ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
  } else {
    return "just now"
  }
}
