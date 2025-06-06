// Define schemas for different data types
export interface DataSchema {
  required: string[]
  optional: string[]
  format?: Record<string, string>
  example?: Record<string, any>
}

export type DataSchemas = Record<string, DataSchema>

// Get schemas for all data types
export function getDataSchema(): DataSchemas {
  return {
    tasks: {
      required: ["title"],
      optional: ["description", "dueDate", "completed", "priority", "tags", "category"],
      format: {
        dueDate: "YYYY-MM-DD",
        completed: "boolean",
        priority: "string (low/medium/high) or number (1-3)",
        tags: "string[]",
      },
      example: {
        id: "task-123",
        title: "Complete project report",
        description: "Finish the quarterly report for the marketing team",
        dueDate: "2023-12-15",
        completed: false,
        priority: "medium",
        tags: ["work", "report"],
        category: "Work",
      },
    },
    notes: {
      required: ["title", "content"],
      optional: ["tags", "color", "createdAt", "category"],
      format: {
        tags: "string[]",
        createdAt: "ISO date string",
      },
      example: {
        id: "note-123",
        title: "Meeting Notes",
        content: "Discussed project timeline and resource allocation",
        tags: ["meeting", "project"],
        color: "#f5dd42",
        createdAt: "2023-11-10T14:30:00Z",
        category: "Work",
      },
    },
    bookmarks: {
      required: ["title", "url"],
      optional: ["description", "tags", "category", "favicon"],
      format: {
        tags: "string[]",
        url: "valid URL string",
      },
      example: {
        id: "bookmark-123",
        title: "MDN Web Docs",
        url: "https://developer.mozilla.org",
        description: "Resources for web developers",
        tags: ["development", "reference"],
        category: "Development",
        favicon: "https://developer.mozilla.org/favicon.ico",
      },
    },
    passwordEntries: {
      required: ["title", "username", "password"],
      optional: ["website", "notes", "category", "lastUpdated"],
      format: {
        lastUpdated: "ISO date string",
      },
      example: {
        id: "pwd-123",
        title: "Work Email",
        username: "john.doe@company.com",
        password: "securePassword123",
        website: "https://mail.company.com",
        notes: "Changed password on Nov 15",
        category: "Work",
        lastUpdated: "2023-11-15T10:00:00Z",
      },
    },
    knowledgeItems: {
      required: ["title", "content"],
      optional: ["tags", "category", "source", "createdAt"],
      format: {
        tags: "string[]",
        createdAt: "ISO date string",
      },
      example: {
        id: "knowledge-123",
        title: "JavaScript Promises",
        content: "Promises are objects representing the eventual completion or failure of an asynchronous operation.",
        tags: ["javascript", "async"],
        category: "Programming",
        source: "MDN Web Docs",
        createdAt: "2023-10-05T09:15:00Z",
      },
    },
    codeSnippets: {
      required: ["title", "code", "language"],
      optional: ["description", "tags", "createdAt"],
      format: {
        tags: "string[]",
        createdAt: "ISO date string",
      },
      example: {
        id: "code-123",
        title: "Fetch API Example",
        code: "fetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data))",
        language: "javascript",
        description: "Basic fetch API usage with promises",
        tags: ["javascript", "api"],
        createdAt: "2023-09-20T16:45:00Z",
      },
    },
    mealPlannerData: {
      required: ["title"],
      optional: ["ingredients", "instructions", "prepTime", "cookTime", "servings", "category", "tags"],
      format: {
        ingredients: "string[]",
        tags: "string[]",
        prepTime: "number (minutes)",
        cookTime: "number (minutes)",
        servings: "number",
      },
      example: {
        id: "recipe-123",
        title: "Vegetable Stir Fry",
        ingredients: ["2 bell peppers", "1 onion", "2 tbsp soy sauce"],
        instructions: "1. Chop vegetables\n2. Heat oil in pan\n3. Stir fry vegetables\n4. Add sauce",
        prepTime: 15,
        cookTime: 10,
        servings: 2,
        category: "Dinner",
        tags: ["vegetarian", "quick"],
      },
    },
    workoutHistory: {
      required: ["date", "exercises"],
      optional: ["duration", "calories", "notes"],
      format: {
        date: "YYYY-MM-DD",
        exercises: "array of exercise objects",
        duration: "number (minutes)",
        calories: "number",
      },
      example: {
        id: "workout-123",
        date: "2023-11-20",
        exercises: [
          { name: "Push-ups", sets: 3, reps: 15 },
          { name: "Squats", sets: 3, reps: 20 },
        ],
        duration: 45,
        calories: 320,
        notes: "Felt good, increased reps on second exercise",
      },
    },
    contacts: {
      required: ["firstName"],
      optional: ["lastName", "email", "phone", "address", "company", "notes", "tags", "category"],
      format: {
        email: "email",
        phone: "string",
        createdAt: "ISO date string",
        tags: "string[]",
        phone: "string (formatted phone number)",
      },
      example: {
        id: "contact-123",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "555-123-4567",
        address: "123 Main St, Anytown, USA",
        company: "Acme Corporation",
        notes: "Met at conference in September",
        tags: ["work", "conference"],
        category: "Business",
      },
    },
    financeData: {
      required: ["type"],
      optional: ["date", "amount", "category", "description", "account", "recurring"],
      format: {
        type: "string (income/expense/transfer)",
        date: "YYYY-MM-DD",
        amount: "number",
        recurring: "boolean",
      },
      example: {
        id: "transaction-123",
        type: "expense",
        date: "2023-11-25",
        amount: 45.99,
        category: "Groceries",
        description: "Weekly grocery shopping",
        account: "Checking Account",
        recurring: false,
      },
    },
    markdownDocuments: {
      required: ["title", "content"],
      optional: ["tags", "createdAt", "lastUpdated", "category"],
      format: {
        tags: "string[]",
        createdAt: "ISO date string",
        lastUpdated: "ISO date string",
      },
      example: {
        id: "doc-123",
        title: "Project Roadmap",
        content: "# Project Roadmap\n\n## Phase 1\n- Research\n- Planning\n\n## Phase 2\n- Development\n- Testing",
        tags: ["project", "planning"],
        createdAt: "2023-10-10T11:30:00Z",
        lastUpdated: "2023-11-05T14:20:00Z",
        category: "Work",
      },
    },
    countdownTimers: {
      required: ["title", "targetDate"],
      optional: ["description", "color"],
      format: {
        targetDate: "ISO date string",
      },
      example: {
        id: "timer-123",
        title: "Project Deadline",
        targetDate: "2023-12-31T23:59:59Z",
        description: "Final submission deadline for Q4 project",
        color: "#e74c3c",
      },
    },
    assignments: {
      required: ["title", "dueDate"],
      optional: ["description", "course", "priority", "completed", "attachments"],
      format: {
        dueDate: "YYYY-MM-DD",
        priority: "string (low/medium/high)",
        completed: "boolean",
        attachments: "string[]",
      },
      example: {
        id: "assignment-123",
        title: "Research Paper",
        dueDate: "2023-12-10",
        description: "5-page research paper on renewable energy",
        course: "Environmental Science",
        priority: 3,
        completed: false,
        attachments: ["requirements.pdf", "notes.docx"],
      },
    },
    projects: {
      required: ["title"],
      optional: ["description", "startDate", "endDate", "status", "members", "tasks", "category"],
      format: {
        startDate: "YYYY-MM-DD",
        endDate: "YYYY-MM-DD",
        status: "string (planning/in-progress/completed/cancelled)",
        priority: "string (low/medium/high/urgent)",
        members: "string[]",
        tasks: "string[] (task IDs)",
      },
      example: {
        id: "project-123",
        title: "Website Redesign",
        description: "Redesign company website with new branding",
        startDate: "2023-10-01",
        endDate: "2023-12-15",
        status: "in-progress",
        members: ["John", "Sarah", "Mike"],
        tasks: ["task-1", "task-2", "task-3"],
        category: "Marketing",
      },
    },
    meetings: {
      required: ["title", "date", "startTime", "endTime"],
      optional: ["location", "participants", "agenda", "notes"],
      format: {
        date: "YYYY-MM-DD",
        startTime: "HH:MM",
        endTime: "HH:MM",
        participants: "string[]",
      },
      example: {
        id: "meeting-123",
        title: "Weekly Team Sync",
        date: "2023-11-30",
        startTime: "14:00",
        endTime: "15:00",
        location: "Conference Room A",
        participants: ["John", "Sarah", "Mike", "Lisa"],
        agenda: "1. Project updates\n2. Blockers\n3. Next steps",
        notes: "Sarah will present the Q4 results",
      },
    },
    clients: {
      required: ["name"],
      optional: ["email", "phone", "company", "address", "notes", "projects"],
      format: {
        projects: "string[] (project IDs)",
      },
      example: {
        id: "client-123",
        name: "John Doe",
        email: "john.doe@company.com",
        phone: "555-987-6543",
        company: "Acme Corporation",
        address: "456 Business Ave, Commerce City, USA",
        notes: "Prefers communication via email",
        projects: ["project-1", "project-2"],
      },
    },
    billingData: {
      required: ["client", "amount", "date"],
      optional: ["description", "status", "dueDate", "invoiceNumber", "paymentMethod"],
      format: {
        date: "YYYY-MM-DD",
        amount: "number",
        status: "string (paid/unpaid/partial)",
        dueDate: "YYYY-MM-DD",
      },
      example: {
        id: "invoice-123",
        client: "client-123",
        amount: 1500.0,
        date: "2023-11-15",
        description: "Website development services",
        status: "unpaid",
        dueDate: "2023-12-15",
        invoiceNumber: "INV-2023-42",
        paymentMethod: "Bank Transfer",
      },
    },
    plannerData: {
      required: ["title", "date", "startTime", "endTime"],
      optional: ["description", "category", "isRecurring", "recurringPattern", "color", "completed"],
      format: {
        date: "YYYY-MM-DD",
        startTime: "HH:MM",
        endTime: "HH:MM",
        isRecurring: "boolean",
        recurringPattern: "string (daily/weekly/monthly/weekdays/weekends)",
        completed: "boolean",
      },
      example: {
        id: "block-123",
        title: "Work Session",
        date: "2025-04-22",
        startTime: "09:00",
        endTime: "12:00",
        description: "Focus on project tasks",
        category: "Work",
        isRecurring: false,
        color: "bg-blue-500",
        completed: false,
      },
    },
    ganttData: {
      required: ["projects", "tasks"],
      optional: ["sections", "links", "lastUpdated"],
      format: {
        lastUpdated: "ISO date string",
      },
      example: {
        projects: [
          {
            id: "project-1",
            name: "Website Redesign",
            description: "Complete overhaul of the company website",
            color: "#4f46e5",
            status: "active",
          },
        ],
        tasks: [
          {
            id: "task-1",
            name: "Research & Planning",
            description: "Initial research and planning phase",
            start: "2023-04-01T00:00:00.000Z",
            end: "2023-04-15T00:00:00.000Z",
            progress: 100,
            status: "done",
            priority: "high",
            projectId: "project-1",
          },
        ],
        sections: [
          {
            id: "section-1",
            name: "Planning",
            projectId: "project-1",
            color: "#8b5cf6",
          },
        ],
        links: [
          {
            id: "link-1",
            source: "task-1",
            target: "task-2",
            type: "finish_to_start",
          },
        ],
        lastUpdated: "2023-04-22T14:30:00.000Z",
      },
    },
    citations: {
      required: ["title", "source"],
      optional: ["authors", "date", "url", "journal", "volume", "issue", "pages", "publisher", "doi", "notes", "tags"],
      format: {
        authors: "string[]",
        date: "YYYY-MM-DD",
        tags: "string[]",
      },
      example: {
        id: "cite-123",
        title: "The Impact of Climate Change on Global Ecosystems",
        source: "Journal of Environmental Science",
        authors: ["Smith, J.", "Johnson, A."],
        date: "2023-06-15",
        journal: "Journal of Environmental Science",
        volume: "42",
        issue: "3",
        pages: "112-128",
        doi: "10.1234/jes.2023.42.3.112",
        tags: ["climate", "research", "environment"],
      },
    },
  }
}
