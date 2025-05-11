import type { TutorialStep } from "@/components/onboarding/tutorial-system"

export interface Tutorial {
  id: string
  title: string
  description: string
  category: "getting-started" | "features" | "advanced"
  estimatedTime?: string
  steps: TutorialStep[]
  completionReward?: string
}

// Update the tutorials array to better match the actual site functionality and UI elements

// First, let's update the selectors to match actual elements in the site
const updateStepsWithIcons = (steps: TutorialStep[]): TutorialStep[] => {
  return steps.map((step, index) => {
    // Assign icons based on step content or position
    let icon: "info" | "lightbulb" | "sparkles" | "zap" | null = null

    if (index === 0) {
      icon = "sparkles" // First step gets sparkles
    } else if (step.action) {
      icon = "lightbulb" // Steps with actions get lightbulb
    } else if (step.content.includes("tip") || step.content.includes("hint")) {
      icon = "info" // Tips get info icon
    } else if (index === steps.length - 1) {
      icon = "zap" // Last step gets zap
    }

    return {
      ...step,
      icon,
    }
  })
}

// Add data attributes to common elements to make them easier to target
const addDataAttributes = () => {
  if (typeof window === "undefined") return

  // Add data attributes to common elements that might be targeted in tutorials
  setTimeout(() => {
    try {
      // Navigation
      document.querySelectorAll(".app-sidebar, nav, .navigation").forEach((el) => {
        el.setAttribute("data-tutorial", "sidebar-nav")
      })

      // Settings button
      document.querySelectorAll('.settings-button, [aria-label="Settings"]').forEach((el) => {
        el.setAttribute("data-tutorial", "settings-button")
      })

      // Search input
      document.querySelectorAll('.search-input, input[type="search"]').forEach((el) => {
        el.setAttribute("data-tutorial", "search-input")
      })

      // Global save button
      document.querySelectorAll(".global-save-button").forEach((el) => {
        el.setAttribute("data-tutorial", "global-save-button")
      })

      // Also try to find buttons that might be add task buttons by looking at their text content
      document.querySelectorAll("button").forEach((el) => {
        if (el.textContent && el.textContent.toLowerCase().includes("add task")) {
          el.setAttribute("data-tutorial", "add-task-button")
        }
      })

      // Add more common elements with standard selectors
      const commonSelectors = {
        "calendar-view": ".calendar-view",
        "task-list": ".task-list",
        "spotify-player": ".spotify-player",
        "bookmark-list": ".bookmark-list",
        "code-editor": ".code-editor",
        "finance-dashboard": ".finance-dashboard",
        "gantt-chart": ".gantt-chart",
        "knowledge-base": ".knowledge-base",
        "theme-toggle": ".theme-toggle",
        "data-backup": ".data-backup",
        "mobile-navigation": ".mobile-navigation",
      }

      // Apply all common selectors
      Object.entries(commonSelectors).forEach(([key, selector]) => {
        try {
          document.querySelectorAll(selector).forEach((el) => {
            el.setAttribute("data-tutorial", key)
          })
        } catch (e) {
          // Ignore errors for individual selectors
          console.warn(`Error applying selector ${selector}:`, e)
        }
      })
    } catch (error) {
      console.error("Error adding data attributes for tutorials:", error)
    }
  }, 1000)
}

// Call this function when the module loads
if (typeof window !== "undefined") {
  addDataAttributes()
  // Also set up a mutation observer to handle dynamically added elements
  const observer = new MutationObserver(() => {
    addDataAttributes()
  })

  // Start observing once the DOM is loaded
  window.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

// Define comprehensive tutorials for all features
export const tutorials = [
  {
    id: "welcome",
    title: "Welcome to Utility Hub",
    description: "Get started with the basics of Utility Hub",
    category: "getting-started",
    estimatedTime: "2 min",
    steps: [
      {
        id: "welcome-1",
        title: "Welcome to Utility Hub",
        content:
          "This tutorial will guide you through the basics of using Utility Hub. You can interact with the app while following this tutorial.",
        position: "center",
        icon: "sparkles",
        image: "/utility-hub-dashboard.png",
      },
      {
        id: "welcome-2",
        title: "Navigation",
        content:
          "Use the sidebar to navigate between different tools and features. Try clicking on a sidebar item now.",
        targetSelector: ".app-sidebar",
        position: "right",
        icon: "info",
        action: "Click on any item in the sidebar to navigate to that section.",
        completionCriteria: {
          event: "click",
          selector: ".app-sidebar a, .app-sidebar button",
        },
      },
      {
        id: "welcome-3",
        title: "Settings",
        content: "You can customize your experience through the settings panel. Click the settings button to open it.",
        targetSelector: ".settings-button",
        position: "left",
        icon: "lightbulb",
        action: "Click the settings button to explore your options.",
        completionCriteria: {
          event: "click",
          selector: ".settings-button",
        },
      },
      {
        id: "welcome-4",
        title: "Search",
        content: "Use the search feature to quickly find what you need. Try clicking on the search button.",
        targetSelector: ".search-input",
        position: "bottom",
        icon: "zap",
        action: "Click the search icon to start searching.",
        completionCriteria: {
          event: "click",
          selector: ".search-input",
        },
      },
      {
        id: "welcome-5",
        title: "You're all set!",
        content:
          "You've completed the basic introduction to Utility Hub. Feel free to explore more features or check out other tutorials.",
        position: "center",
        icon: "sparkles",
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "Learn how to use the main dashboard effectively",
    category: "getting-started",
    estimatedTime: "5 min",
    steps: [
      {
        id: "dashboard-1",
        title: "Dashboard Overview",
        content: "The dashboard provides a quick overview of all your important information and tools.",
        position: "center",
        icon: "sparkles",
        route: "/",
      },
      {
        id: "dashboard-2",
        title: "Navigation Sidebar",
        content: "Use the sidebar to access different features and tools in Utility Hub.",
        targetSelector: ".app-sidebar",
        position: "right",
        icon: "info",
        action: "Explore the different sections available in the sidebar.",
      },
      {
        id: "dashboard-3",
        title: "Global Settings",
        content: "Access global settings to customize your experience across the entire application.",
        targetSelector: ".settings-button",
        position: "left",
        icon: "lightbulb",
        action: "Try opening the global settings panel.",
        completionCriteria: {
          event: "click",
          selector: ".settings-button",
        },
      },
      {
        id: "dashboard-4",
        title: "Save Your Data",
        content: "Use the global save button to ensure your data is saved securely.",
        targetSelector: ".global-save-button",
        position: "bottom",
        icon: "zap",
        action: "Try clicking the save button to save your data.",
      },
      {
        id: "dashboard-5",
        title: "Dashboard Complete!",
        content: "You now understand how to navigate and use the dashboard for maximum productivity.",
        position: "center",
        icon: "sparkles",
      },
    ],
  },
  // Task Management Tutorial
  {
    id: "tasks",
    title: "Task Management",
    description: "Learn how to create, organize, and track your tasks",
    category: "features",
    estimatedTime: "8 min",
    steps: updateStepsWithIcons([
      {
        id: "tasks-1",
        title: "Task Management",
        content: "This tutorial will show you how to effectively manage your tasks in Utility Hub.",
        position: "center",
        route: "/tasks",
      },
      {
        id: "tasks-2",
        title: "Task List",
        content: "View all your tasks in one place. You can sort, filter, and organize them as needed.",
        targetSelector: ".task-list",
        position: "bottom",
        action: "Explore your task list to see existing tasks.",
      },
      {
        id: "tasks-3",
        title: "Creating Tasks",
        content: "Add new tasks by clicking the 'Add Task' button.",
        targetSelector: "[data-tutorial='add-task-button']",
        position: "right",
        action: "Try clicking the 'Add Task' button to create a new task.",
      },
      {
        id: "tasks-4",
        title: "Task Details",
        content: "Each task can have a title, description, due date, and priority level.",
        targetSelector: ".task-item",
        position: "bottom",
        action: "Click on a task to view or edit its details.",
      },
      {
        id: "tasks-5",
        title: "Completing Tasks",
        content: "Mark tasks as complete by clicking the checkbox next to them.",
        targetSelector: ".task-checkbox",
        position: "right",
        action: "Try marking a task as complete.",
      },
    ]),
    completionReward: "Congratulations! You now know how to effectively manage your tasks in Utility Hub.",
  },

  // Calendar Tutorial
  {
    id: "calendar",
    title: "Calendar Management",
    description: "Learn how to use the calendar to manage your schedule",
    category: "features",
    estimatedTime: "7 min",
    steps: updateStepsWithIcons([
      {
        id: "calendar-1",
        title: "Calendar Overview",
        content: "This tutorial will show you how to use the calendar to manage your schedule.",
        position: "center",
        route: "/calendar",
      },
      {
        id: "calendar-2",
        title: "Calendar View",
        content: "The calendar displays your events and appointments in an organized timeline.",
        targetSelector: ".calendar-view",
        position: "top",
        action: "Explore the calendar to see your scheduled events.",
      },
      {
        id: "calendar-3",
        title: "Adding Events",
        content: "Create new events by clicking on a date or time slot in the calendar.",
        targetSelector: ".calendar-day",
        position: "bottom",
        action: "Try clicking on a date to add a new event.",
      },
      {
        id: "calendar-4",
        title: "Event Details",
        content: "Each event can have a title, description, location, and time.",
        targetSelector: ".event-item",
        position: "right",
        action: "Click on an event to view or edit its details.",
      },
      {
        id: "calendar-5",
        title: "Calendar Navigation",
        content: "Navigate between different months and views using the calendar controls.",
        targetSelector: ".calendar-navigation",
        position: "top",
        action: "Try navigating to different months or views.",
      },
    ]),
    completionReward: "Great job! You now know how to effectively manage your schedule with the calendar.",
  },

  // Knowledge Base Tutorial
  {
    id: "knowledge",
    title: "Knowledge Base",
    description: "Learn how to organize and access your notes and information",
    category: "features",
    estimatedTime: "10 min",
    steps: updateStepsWithIcons([
      {
        id: "kb-1",
        title: "Knowledge Base Overview",
        content: "This tutorial will show you how to use the Knowledge Base to organize your notes and information.",
        position: "center",
        route: "/knowledge-base",
      },
      {
        id: "kb-2",
        title: "Knowledge Organization",
        content: "The Knowledge Base helps you organize and store important information for easy access.",
        targetSelector: ".knowledge-base",
        position: "bottom",
        action: "Explore the Knowledge Base to see how information is organized.",
      },
      {
        id: "kb-3",
        title: "Adding Notes",
        content: "Add new notes by clicking the 'Add Note' button.",
        targetSelector: ".add-note-button",
        position: "right",
        action: "Try clicking the 'Add Note' button to create a new note.",
      },
      {
        id: "kb-4",
        title: "Note Editor",
        content: "Use the editor to create and format your notes with text, lists, and more.",
        targetSelector: ".note-editor",
        position: "bottom",
        action: "Try creating or editing a note in the editor.",
      },
      {
        id: "kb-5",
        title: "Searching Notes",
        content: "Find specific notes quickly using the search feature.",
        targetSelector: ".knowledge-search",
        position: "top",
        action: "Try searching for a specific note or keyword.",
      },
    ]),
    completionReward: "Excellent! You now know how to use the Knowledge Base to organize your information.",
  },

  // Finance Tutorial
  {
    id: "finance",
    title: "Finance Tracker",
    description: "Learn how to track your expenses and manage your budget",
    category: "features",
    estimatedTime: "12 min",
    steps: updateStepsWithIcons([
      {
        id: "finance-1",
        title: "Finance Tracker Overview",
        content: "This tutorial will show you how to use the Finance Tracker to manage your finances.",
        position: "center",
        route: "/finance",
      },
      {
        id: "finance-2",
        title: "Finance Dashboard",
        content: "The Finance Dashboard gives you an overview of your financial situation.",
        targetSelector: ".finance-dashboard",
        position: "bottom",
        action: "Explore the Finance Dashboard to see your financial overview.",
      },
      {
        id: "finance-3",
        title: "Adding Transactions",
        content: "Record new expenses or income by adding transactions.",
        targetSelector: ".add-transaction-button",
        position: "right",
        action: "Try adding a new transaction to record an expense or income.",
      },
      {
        id: "finance-4",
        title: "Budget Overview",
        content: "View your budget and spending patterns to help manage your finances.",
        targetSelector: ".budget-overview",
        position: "bottom",
        action: "Explore your budget overview to see your spending patterns.",
      },
      {
        id: "finance-5",
        title: "Financial Reports",
        content: "Generate reports to analyze your financial data over time.",
        targetSelector: ".financial-reports",
        position: "right",
        action: "Try generating a financial report to analyze your data.",
      },
    ]),
    completionReward: "Congratulations! You now know how to effectively manage your finances with the Finance Tracker.",
  },

  // Gantt Chart Tutorial
  {
    id: "gantt-chart",
    title: "Gantt Chart",
    description: "Learn how to visualize and manage project timelines",
    category: "features",
    estimatedTime: "15 min",
    steps: [
      {
        id: "gantt-1",
        title: "Gantt Chart Overview",
        content: "This tutorial will show you how to use the Gantt Chart to manage project timelines.",
        position: "center",
        icon: "sparkles",
        route: "/gantt",
      },
      {
        id: "gantt-2",
        title: "Gantt View",
        content: "The Gantt Chart visualizes your projects and tasks on a timeline.",
        targetSelector: ".gantt-chart",
        position: "bottom",
        icon: "info",
        action: "Explore the Gantt Chart to see your project timeline.",
      },
      {
        id: "gantt-3",
        title: "Adding Projects",
        content: "Create new projects to organize your tasks and timelines.",
        targetSelector: ".add-project-button",
        position: "right",
        icon: "lightbulb",
        action: "Try adding a new project to the Gantt Chart.",
      },
      {
        id: "gantt-4",
        title: "Adding Tasks",
        content: "Add tasks to your projects and set their start and end dates.",
        targetSelector: ".add-task-button",
        position: "bottom",
        icon: "zap",
        action: "Try adding a task to your project.",
      },
      {
        id: "gantt-5",
        title: "Different Views",
        content: "Switch between different views to see your projects in various formats.",
        targetSelector: ".view-selector",
        position: "top",
        icon: "info",
        action: "Try switching between different views of your projects.",
      },
    ],
    completionReward: "Excellent! You now know how to use the Gantt Chart to manage project timelines effectively.",
  },

  // Spotify Integration Tutorial
  {
    id: "spotify",
    title: "Spotify Integration",
    description: "Learn how to control your Spotify music from within the app",
    category: "features",
    estimatedTime: "5 min",
    steps: updateStepsWithIcons([
      {
        id: "spotify-1",
        title: "Spotify Integration Overview",
        content: "This tutorial will show you how to use the Spotify integration to control your music.",
        position: "center",
        route: "/spotify",
      },
      {
        id: "spotify-2",
        title: "Spotify Player",
        content: "The Spotify player allows you to control your music directly from Utility Hub.",
        targetSelector: ".spotify-player",
        position: "bottom",
        action: "Explore the Spotify player to see how it works.",
      },
      {
        id: "spotify-3",
        title: "Connecting Your Account",
        content: "Connect your Spotify account to enable music control within the app.",
        targetSelector: ".spotify-connect-button",
        position: "right",
        action: "If not already connected, try connecting your Spotify account.",
      },
      {
        id: "spotify-4",
        title: "Playback Controls",
        content: "Use the playback controls to play, pause, skip, and adjust volume.",
        targetSelector: ".playback-controls",
        position: "bottom",
        action: "Try using the playback controls to control your music.",
      },
      {
        id: "spotify-5",
        title: "Searching for Music",
        content: "Search for songs, albums, and playlists directly within the app.",
        targetSelector: ".spotify-search",
        position: "top",
        action: "Try searching for a song or artist using the search feature.",
      },
    ]),
    completionReward: "Great job! You now know how to use the Spotify integration to control your music.",
  },

  // Bookmarks Tutorial
  {
    id: "bookmarks",
    title: "Bookmarks Manager",
    description: "Learn how to save and organize your favorite websites",
    category: "features",
    estimatedTime: "6 min",
    steps: updateStepsWithIcons([
      {
        id: "bookmarks-1",
        title: "Bookmarks Manager Overview",
        content:
          "This tutorial will show you how to use the Bookmarks Manager to save and organize your favorite websites.",
        position: "center",
        route: "/bookmarks",
      },
      {
        id: "bookmarks-2",
        title: "Bookmark List",
        content: "View all your saved bookmarks in one place.",
        targetSelector: ".bookmark-list",
        position: "bottom",
        action: "Explore your bookmark list to see your saved websites.",
      },
      {
        id: "bookmarks-3",
        title: "Adding Bookmarks",
        content: "Add new bookmarks by clicking the 'Add Bookmark' button.",
        targetSelector: ".add-bookmark-button",
        position: "right",
        action: "Try adding a new bookmark to save a website.",
      },
      {
        id: "bookmarks-4",
        title: "Bookmark Details",
        content: "Each bookmark can have a title, URL, description, and tags.",
        targetSelector: ".bookmark-item",
        position: "bottom",
        action: "Click on a bookmark to view or edit its details.",
      },
      {
        id: "bookmarks-5",
        title: "Organizing Bookmarks",
        content: "Organize your bookmarks with folders and tags for easy access.",
        targetSelector: ".bookmark-organization",
        position: "left",
        action: "Try organizing your bookmarks using folders or tags.",
      },
    ]),
    completionReward: "Well done! You now know how to effectively manage your bookmarks.",
  },

  // Code Snippets Tutorial
  {
    id: "code-snippets",
    title: "Code Snippets",
    description: "Learn how to save and organize code snippets with syntax highlighting",
    category: "features",
    estimatedTime: "8 min",
    steps: updateStepsWithIcons([
      {
        id: "code-1",
        title: "Code Snippets Overview",
        content: "This tutorial will show you how to use the Code Snippets feature to save and organize your code.",
        position: "center",
        route: "/code-snippets",
      },
      {
        id: "code-2",
        title: "Code Snippet List",
        content: "View all your saved code snippets in one place.",
        targetSelector: ".snippet-list",
        position: "bottom",
        action: "Explore your snippet list to see your saved code.",
      },
      {
        id: "code-3",
        title: "Adding Snippets",
        content: "Add new code snippets by clicking the 'Add Snippet' button.",
        targetSelector: ".add-snippet-button",
        position: "right",
        action: "Try adding a new code snippet.",
      },
      {
        id: "code-4",
        title: "Code Editor",
        content: "Use the code editor to write and format your code with syntax highlighting.",
        targetSelector: ".code-editor",
        position: "bottom",
        action: "Try writing or editing code in the editor.",
      },
      {
        id: "code-5",
        title: "Language Selection",
        content: "Select the programming language for proper syntax highlighting.",
        targetSelector: ".language-selector",
        position: "top",
        action: "Try selecting a different programming language for your snippet.",
      },
    ]),
    completionReward: "Excellent! You now know how to effectively manage your code snippets.",
  },

  // Assignments Tutorial - Removed

  // Advanced Features - Removed

  // Customization Tutorial
  {
    id: "customization",
    title: "Customizing Your Experience",
    description: "Learn how to personalize the app to suit your preferences",
    category: "advanced",
    estimatedTime: "7 min",
    steps: updateStepsWithIcons([
      {
        id: "custom-1",
        title: "Customization Overview",
        content: "This tutorial will show you how to personalize Utility Hub to suit your preferences.",
        position: "center",
        route: "/settings",
      },
      {
        id: "custom-2",
        title: "Theme Selection",
        content: "Choose between light and dark themes for your preferred visual experience.",
        targetSelector: ".theme-toggle",
        position: "right",
        action: "Try switching between light and dark themes.",
      },
      {
        id: "custom-3",
        title: "Global Settings",
        content: "Customize global settings that apply across the entire application.",
        targetSelector: ".settings-button",
        position: "bottom",
        action: "Explore the global settings to customize your experience.",
      },
      {
        id: "custom-4",
        title: "Feature Settings",
        content: "Each feature may have its own settings that you can customize.",
        targetSelector: ".feature-settings",
        position: "left",
        action: "Explore feature-specific settings in different sections of the app.",
      },
      {
        id: "custom-5",
        title: "User Preferences",
        content: "Set your user preferences to personalize how the app works for you.",
        targetSelector: ".user-preferences",
        position: "right",
        action: "Explore user preference options to customize your experience.",
      },
    ]),
    completionReward: "Great job! You now know how to personalize Utility Hub to suit your preferences.",
  },

  // Mobile Experience Tutorial
  {
    id: "mobile",
    title: "Mobile Experience",
    description: "Learn how to use Utility Hub effectively on mobile devices",
    category: "advanced",
    estimatedTime: "5 min",
    steps: [
      {
        id: "mobile-1",
        title: "Mobile Experience",
        content:
          "Utility Hub is fully responsive and works great on mobile devices. This tutorial will show you how to make the most of the mobile experience.",
        position: "center",
        icon: "sparkles",
      },
      {
        id: "mobile-2",
        title: "Mobile Navigation",
        content: "On mobile, the navigation is optimized for smaller screens.",
        targetSelector: ".mobile-navigation",
        position: "right",
        icon: "info",
        action: "Explore the mobile navigation to access different features.",
      },
      {
        id: "mobile-3",
        title: "Touch Interactions",
        content: "Use touch gestures like tap, swipe, and pinch to interact with the app on mobile.",
        targetSelector: ".mobile-content",
        position: "bottom",
        icon: "lightbulb",
        action: "Try using touch gestures to interact with the content.",
      },
      {
        id: "mobile-4",
        title: "Mobile Settings",
        content: "Access settings and customize your experience on mobile devices.",
        targetSelector: ".mobile-settings",
        position: "left",
        icon: "zap",
        action: "Explore how to access settings on mobile devices.",
      },
      {
        id: "mobile-5",
        title: "Mobile Experience Complete!",
        content: "You now know how to effectively use Utility Hub on mobile devices.",
        position: "center",
        icon: "sparkles",
      },
    ],
  },

  // Data Security Tutorial
  {
    id: "data-security",
    title: "Data Backup & Security",
    description: "Learn how to keep your data safe and secure",
    category: "advanced",
    estimatedTime: "7 min",
    steps: [
      {
        id: "security-1",
        title: "Data Security Overview",
        content:
          "Keeping your data safe is important. This tutorial will show you how to back up and secure your information.",
        position: "center",
        icon: "sparkles",
        route: "/settings",
        image: "/data-backup-security.png",
      },
      {
        id: "security-2",
        title: "Data Backup",
        content: "Regularly backing up your data ensures you won't lose important information.",
        targetSelector: ".data-backup",
        position: "bottom",
        icon: "info",
        action: "Explore the data backup options available in Utility Hub.",
      },
      {
        id: "security-3",
        title: "Export Data",
        content: "Export your data to create manual backups that you can store safely.",
        targetSelector: ".export-data-button",
        position: "right",
        icon: "lightbulb",
        action: "Learn how to export your data for safekeeping.",
      },
      {
        id: "security-4",
        title: "Import Data",
        content: "Import previously exported data to restore your information if needed.",
        targetSelector: ".import-data-button",
        position: "bottom",
        icon: "zap",
        action: "Learn how to import data from a backup.",
      },
      {
        id: "security-5",
        title: "Account Security",
        content: "Secure your account with a strong password and authentication methods.",
        targetSelector: ".account-security",
        position: "left",
        icon: "info",
        action: "Explore account security options if you have an account.",
      },
    ],
  },
]
