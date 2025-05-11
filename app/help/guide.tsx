"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Calendar,
  BarChart,
  FileText,
  Utensils,
  Code,
  BookmarkPlus,
  Shield,
  Music,
  Settings,
  Download,
  Printer,
} from "lucide-react"

export function UserGuideContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            User Guide
          </CardTitle>
          <CardDescription>Comprehensive documentation for all Utility Hub features</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b px-6">
              <TabsList className="mb-0 justify-start w-auto h-auto bg-transparent p-0 gap-4">
                <TabsTrigger
                  value="overview"
                  className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="productivity"
                  className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  Productivity
                </TabsTrigger>
                <TabsTrigger
                  value="lifestyle"
                  className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  Lifestyle
                </TabsTrigger>
                <TabsTrigger
                  value="tools"
                  className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  Tools
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[500px]">
              <TabsContent value="overview" className="p-6 m-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Welcome to Utility Hub</h3>
                    <p className="text-muted-foreground mb-4">
                      Utility Hub is a comprehensive web application designed to enhance your productivity and
                      organization. This guide will help you understand how to use all the features available in the
                      app.
                    </p>

                    <h4 className="font-medium mb-2">Key Features</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Productivity Tools:</strong> Task management, calendar, project planning with Gantt
                        charts
                      </li>
                      <li>
                        <strong>Knowledge Management:</strong> Notes, knowledge base, code snippets
                      </li>
                      <li>
                        <strong>Financial Tools:</strong> Budget tracking, expense management
                      </li>
                      <li>
                        <strong>Lifestyle:</strong> Recipe manager, workout tracker
                      </li>
                      <li>
                        <strong>Utilities:</strong> Bookmark manager, password storage, Spotify integration
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Getting Started</h3>
                    <p className="text-muted-foreground mb-2">To get the most out of Utility Hub, we recommend:</p>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Explore the sidebar to discover all available features</li>
                      <li>Complete the interactive tutorials to learn how each feature works</li>
                      <li>Set up your profile and preferences in the Settings section</li>
                      <li>Regularly back up your data using the export function</li>
                    </ol>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Full Guide (PDF)
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      Print Guide
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="productivity" className="p-6 m-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <BarChart className="mr-2 h-5 w-5" />
                      Project Management & Gantt Charts
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      The Gantt chart feature allows you to visualize project timelines, dependencies, and progress.
                    </p>

                    <h4 className="font-medium mb-2">How to Use:</h4>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Navigate to the Gantt section from the sidebar</li>
                      <li>Create a new project using the "Add Project" button</li>
                      <li>Add tasks, set durations, and establish dependencies</li>
                      <li>Assign team members to specific tasks</li>
                      <li>Track progress by updating task completion percentages</li>
                      <li>Switch between different views: Gantt, Calendar, Board, and List</li>
                    </ol>

                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h5 className="font-medium mb-2">Pro Tip:</h5>
                      <p className="text-sm">
                        Use the drag-and-drop functionality to quickly adjust task durations and dependencies in the
                        Gantt view.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Calendar & Scheduling
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      The Calendar feature helps you manage your schedule, appointments, and deadlines.
                    </p>

                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Month, week, and day views</li>
                      <li>Create recurring events</li>
                      <li>Set reminders for important dates</li>
                      <li>Color-code different types of events</li>
                      <li>Link calendar events to projects and tasks</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Knowledge Base
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      The Knowledge Base allows you to organize notes, documents, and research in a structured format.
                    </p>

                    <h4 className="font-medium mb-2">Organization Tips:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Create categories for different subjects or projects</li>
                      <li>Use tags to cross-reference related content</li>
                      <li>Add rich formatting with the built-in markdown editor</li>
                      <li>Link knowledge base entries to calendar events or tasks</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="lifestyle" className="p-6 m-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Utensils className="mr-2 h-5 w-5" />
                      Recipe Manager
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Store and organize your favorite recipes, create meal plans, and generate shopping lists.
                    </p>

                    <h4 className="font-medium mb-2">Features:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Add recipes with ingredients, instructions, and photos</li>
                      <li>Categorize recipes by meal type, cuisine, or dietary restrictions</li>
                      <li>Scale recipes to adjust serving sizes</li>
                      <li>Create weekly meal plans</li>
                      <li>Generate shopping lists based on selected recipes</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Workout Tracker</h3>
                    <p className="text-muted-foreground mb-4">
                      Track your fitness activities, set goals, and monitor your progress over time.
                    </p>

                    <h4 className="font-medium mb-2">How to Use:</h4>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Create workout routines with specific exercises</li>
                      <li>Log your workouts including sets, reps, and weights</li>
                      <li>Track progress with visual charts</li>
                      <li>Set fitness goals and monitor achievements</li>
                      <li>Schedule workouts in the calendar</li>
                    </ol>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tools" className="p-6 m-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Code className="mr-2 h-5 w-5" />
                      Code Snippets
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Store and organize code snippets with syntax highlighting for various programming languages.
                    </p>

                    <h4 className="font-medium mb-2">Features:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Syntax highlighting for over 30 programming languages</li>
                      <li>Organize snippets by language, project, or category</li>
                      <li>Search functionality to quickly find snippets</li>
                      <li>Copy to clipboard with a single click</li>
                      <li>Add notes and descriptions to each snippet</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <BookmarkPlus className="mr-2 h-5 w-5" />
                      Bookmark Manager
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Save and organize your favorite websites with categories and tags.
                    </p>

                    <h4 className="font-medium mb-2">How to Use:</h4>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Add bookmarks with URL, title, and description</li>
                      <li>Organize bookmarks into folders</li>
                      <li>Add tags for better searchability</li>
                      <li>Preview websites without leaving the app</li>
                      <li>Import bookmarks from your browser</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Password Manager
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Securely store and manage your passwords with encryption.
                    </p>

                    <h4 className="font-medium mb-2">Security Features:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>AES-256 encryption for all stored passwords</li>
                      <li>Master password protection</li>
                      <li>Auto-generate strong passwords</li>
                      <li>Password strength analyzer</li>
                      <li>Secure notes for additional information</li>
                    </ul>

                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-900/50">
                      <h5 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">
                        Important Security Note:
                      </h5>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Your master password is not stored anywhere. If you forget it, you will not be able to recover
                        your passwords. Make sure to remember your master password or store it in a secure location.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Music className="mr-2 h-5 w-5" />
                      Spotify Integration
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Control your Spotify music directly from within Utility Hub.
                    </p>

                    <h4 className="font-medium mb-2">Features:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Connect your Spotify Premium account</li>
                      <li>Search for songs, albums, and playlists</li>
                      <li>Control playback (play, pause, skip)</li>
                      <li>Adjust volume and shuffle settings</li>
                      <li>View currently playing track information</li>
                      <li>Access your playlists and saved tracks</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="p-6 m-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      App Settings
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Customize Utility Hub to match your preferences and workflow.
                    </p>

                    <h4 className="font-medium mb-2">Available Settings:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Theme:</strong> Choose between light and dark mode
                      </li>
                      <li>
                        <strong>Role:</strong> Set your role (student or professional) to optimize the interface
                      </li>
                      <li>
                        <strong>Data Management:</strong> Export and import your data
                      </li>
                      <li>
                        <strong>Notifications:</strong> Configure reminder notifications
                      </li>
                      <li>
                        <strong>Display:</strong> Adjust layout and density preferences
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Data Management</h3>
                    <p className="text-muted-foreground mb-4">
                      Manage your data with backup, restore, and cleanup options.
                    </p>

                    <h4 className="font-medium mb-2">Important Data Operations:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Export Data:</strong> Create a backup of all your data
                      </li>
                      <li>
                        <strong>Import Data:</strong> Restore from a previous backup
                      </li>
                      <li>
                        <strong>Clear Data:</strong> Remove all data from the app (use with caution)
                      </li>
                      <li>
                        <strong>Storage Usage:</strong> View how much storage space your data is using
                      </li>
                    </ul>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/50">
                      <h5 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Backup Recommendation:</h5>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        We recommend exporting your data regularly as a backup. Your data is stored in your browser's
                        localStorage, which can be cleared if you clear your browser cache or cookies.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
