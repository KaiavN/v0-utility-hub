"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useWindowSize } from "@/hooks/use-window-size"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PullToRefresh } from "@/components/ui/pull-to-refresh"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  Music,
  FileText,
  Bookmark,
  Dumbbell,
  ChevronRight,
  Star,
  Database,
  Lock,
  Pizza,
  Utensils,
  Users,
  Wallet,
  BookOpen,
  Briefcase,
  ClipboardList,
  UserCheck,
  DollarSign,
  Quote,
  GanttChartSquare,
  MessageSquare,
  LayoutDashboard,
  Timer,
  Settings,
  Search,
  Bell,
  Plus,
} from "lucide-react"
import Link from "next/link"

interface FeatureItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  isNew?: boolean
  isFavorite?: boolean
  category: "common" | "student" | "professional"
}

export function MobileDashboard() {
  const { width } = useWindowSize()
  const isMobile = width ? width < 768 : false
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [features, setFeatures] = useState<FeatureItem[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const { isStudent, isProfessional } = useUserPreferences()
  const router = useRouter()

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem("mobile-favorites")
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }
    } catch (error) {
      console.error("Error loading favorites:", error)
    }
  }, [])

  // Save favorites to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("mobile-favorites", JSON.stringify(favorites))
    } catch (error) {
      console.error("Error saving favorites:", error)
    }
  }, [favorites])

  // Generate all features
  useEffect(() => {
    const allFeatures: FeatureItem[] = [
      // Common features
      {
        id: "dashboard",
        title: "Dashboard",
        description: "Your personal dashboard",
        icon: LayoutDashboard,
        href: "/",
        color: "bg-blue-500",
        category: "common",
      },
      {
        id: "spotify",
        title: "Spotify Music",
        description: "Stream your favorite music",
        icon: Music,
        href: "/spotify",
        color: "bg-green-500",
        isNew: true,
        category: "common",
      },
      {
        id: "messages",
        title: "Messages",
        description: "Chat with your contacts",
        icon: MessageSquare,
        href: "/messages",
        color: "bg-indigo-500",
        isNew: true,
        category: "common",
      },
      {
        id: "code-snippets",
        title: "Code Snippets",
        description: "Save and organize code snippets",
        icon: FileText,
        href: "/code-snippets",
        color: "bg-purple-500",
        category: "common",
      },
      {
        id: "calendar",
        title: "Daily Planner",
        description: "Plan your day with time blocks",
        icon: Calendar,
        href: "/calendar",
        color: "bg-blue-500",
        category: "common",
      },
      {
        id: "passwords",
        title: "Password Manager",
        description: "Securely store your passwords",
        icon: Lock,
        href: "/passwords",
        color: "bg-gray-500",
        category: "common",
      },
      {
        id: "recipes",
        title: "Recipe Manager",
        description: "Store and organize recipes",
        icon: Utensils,
        href: "/recipes",
        color: "bg-red-500",
        category: "common",
      },
      {
        id: "pomodoro",
        title: "Pomodoro Timer",
        description: "Stay focused with timed sessions",
        icon: Clock,
        href: "/pomodoro",
        color: "bg-red-500",
        category: "common",
      },
      {
        id: "bookmarks",
        title: "Bookmarks",
        description: "Save and organize web links",
        icon: Bookmark,
        href: "/bookmarks",
        color: "bg-yellow-500",
        category: "common",
      },
      {
        id: "meals",
        title: "Meal Planner",
        description: "Plan your meals for the week",
        icon: Pizza,
        href: "/meals",
        color: "bg-orange-500",
        category: "common",
      },
      {
        id: "markdown",
        title: "Markdown Editor",
        description: "Create and edit markdown documents",
        icon: FileText,
        href: "/markdown",
        color: "bg-blue-500",
        category: "common",
      },
      {
        id: "knowledge-base",
        title: "Knowledge Base",
        description: "Your personal wiki",
        icon: Database,
        href: "/knowledge-base",
        color: "bg-purple-500",
        category: "common",
      },
      {
        id: "countdown",
        title: "Event Timers",
        description: "Countdown to important events",
        icon: Timer,
        href: "/countdown",
        color: "bg-blue-500",
        category: "common",
      },
      {
        id: "contacts",
        title: "Contacts Manager",
        description: "Manage your contacts",
        icon: Users,
        href: "/contacts",
        color: "bg-green-500",
        category: "common",
      },
      {
        id: "workout",
        title: "Workout Tracker",
        description: "Track your fitness progress",
        icon: Dumbbell,
        href: "/workout",
        color: "bg-orange-500",
        category: "common",
      },
      {
        id: "flashcards",
        title: "Flashcards",
        description: "Create and study flashcards",
        icon: BookOpen,
        href: "/flashcards",
        color: "bg-green-500",
        isNew: true,
        category: "common",
      },
      {
        id: "gantt",
        title: "Gantt Chart",
        description: "Visualize project timelines",
        icon: GanttChartSquare,
        href: "/gantt",
        color: "bg-blue-500",
        isNew: true,
        category: "common",
      },

      // Student-specific features
      {
        id: "assignments",
        title: "Assignment Tracker",
        description: "Track your assignments and deadlines",
        icon: ClipboardList,
        href: "/assignments",
        color: "bg-blue-500",
        isNew: true,
        category: "student",
      },
      {
        id: "citations",
        title: "Citation Generator",
        description: "Generate citations for your papers",
        icon: Quote,
        href: "/citations",
        color: "bg-purple-500",
        isNew: true,
        category: "student",
      },

      // Professional-specific features
      {
        id: "finance",
        title: "Finance Dashboard",
        description: "Track your finances",
        icon: Wallet,
        href: "/finance",
        color: "bg-green-500",
        category: "professional",
      },
      {
        id: "projects",
        title: "Project Tracker",
        description: "Manage your projects",
        icon: Briefcase,
        href: "/projects",
        color: "bg-blue-500",
        isNew: true,
        category: "professional",
      },
      {
        id: "clients",
        title: "Client Manager",
        description: "Manage your clients",
        icon: UserCheck,
        href: "/clients",
        color: "bg-purple-500",
        isNew: true,
        category: "professional",
      },
      {
        id: "billing",
        title: "Time Billing",
        description: "Track billable hours",
        icon: DollarSign,
        href: "/billing",
        color: "bg-green-500",
        isNew: true,
        category: "professional",
      },
      {
        id: "meetings",
        title: "Meeting Notes",
        description: "Take notes during meetings",
        icon: FileText,
        href: "/meetings",
        color: "bg-blue-500",
        isNew: true,
        category: "professional",
      },
    ]

    // Filter features based on user role
    let filteredFeatures = allFeatures.filter(
      (feature) =>
        feature.category === "common" ||
        (feature.category === "student" && isStudent && isStudent()) ||
        (feature.category === "professional" && isProfessional && isProfessional()),
    )

    // Mark favorites
    filteredFeatures = filteredFeatures.map((feature) => ({
      ...feature,
      isFavorite: favorites.includes(feature.id),
    }))

    setFeatures(filteredFeatures)
    setIsLoading(false)
  }, [favorites, isStudent, isProfessional])

  if (!isMobile) return null

  const handleRefresh = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const handleToggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((fav) => fav !== id))
    } else {
      setFavorites([...favorites, id])
    }

    // Update features with new favorite status
    setFeatures(
      features.map((feature) => (feature.id === id ? { ...feature, isFavorite: !feature.isFavorite } : feature)),
    )
  }

  const favoriteFeatures = features.filter((feature) => feature.isFavorite)
  const recentFeatures = [...features].sort(() => Math.random() - 0.5).slice(0, 6)
  const allFeatures = [...features].sort((a, b) => a.title.localeCompare(b.title))

  const renderFeatureCard = (feature: FeatureItem) => {
    const Icon = feature.icon
    return (
      <Link href={feature.href} key={feature.id} className="min-w-[140px] max-w-[140px]">
        <Card className="h-full">
          <CardContent className="p-4 flex flex-col items-center text-center h-full">
            <div className={`${feature.color} w-12 h-12 rounded-full flex items-center justify-center text-white mb-3`}>
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
            {feature.isNew && (
              <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full mt-1">New</span>
            )}
          </CardContent>
        </Card>
      </Link>
    )
  }

  const renderFeatureItem = (feature: FeatureItem) => {
    const Icon = feature.icon
    return (
      <Link href={feature.href} key={feature.id} className="block">
        <div className="p-4 border-b last:border-b-0">
          <div className="flex items-center">
            <div className={`${feature.color} w-10 h-10 rounded-full flex items-center justify-center text-white mr-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <h3 className="font-medium truncate">{feature.title}</h3>
                {feature.isNew && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    New
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{feature.description}</p>
            </div>
            <div className="ml-2 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleToggleFavorite(feature.id)
                }}
              >
                <Star
                  className={`h-5 w-5 ${feature.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                />
              </Button>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </Link>
    )
  }

  const emptyFavoritesState = (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="bg-muted rounded-full p-3 mb-4">
        <Star className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-1">No favorites yet</h3>
      <p className="text-sm text-muted-foreground text-center mb-4 px-4">
        Add favorites by tapping the star icon on any tool
      </p>
      <Button variant="outline" onClick={() => setActiveTab("all")}>
        Browse all tools
      </Button>
    </div>
  )

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 space-y-6 pb-20">
        {/* Header with action buttons */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Utility Hub</h1>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.push("/search")}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.push("/notifications")}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.push("/settings")}
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 p-2"
            onClick={() => router.push("/calendar/new")}
          >
            <Calendar className="h-6 w-6 mb-1" />
            <span className="text-xs text-center">New Event</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 p-2"
            onClick={() => router.push("/tasks/new")}
          >
            <ClipboardList className="h-6 w-6 mb-1" />
            <span className="text-xs text-center">New Task</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 p-2"
            onClick={() => router.push("/notes/new")}
          >
            <FileText className="h-6 w-6 mb-1" />
            <span className="text-xs text-center">New Note</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 p-2"
            onClick={() => router.push("/bookmarks/new")}
          >
            <Bookmark className="h-6 w-6 mb-1" />
            <span className="text-xs text-center">New Bookmark</span>
          </Button>
        </div>

        {/* Quick access cards */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Quick Access</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push("/settings/dashboard")}>
              Customize
            </Button>
          </div>
          <ScrollArea className="w-full pb-4" orientation="horizontal">
            <div className="flex space-x-3 pb-2">{recentFeatures.map(renderFeatureCard)}</div>
          </ScrollArea>
        </section>

        {/* Tabbed content */}
        <section>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="all" className="flex-1">
                All Tools
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1">
                Favorites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="p-4 border-b animate-pulse">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-muted mr-3"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">{allFeatures.map(renderFeatureItem)}</div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 border-b animate-pulse">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-muted mr-3"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : favoriteFeatures.length > 0 ? (
                <div className="border rounded-md overflow-hidden">{favoriteFeatures.map(renderFeatureItem)}</div>
              ) : (
                emptyFavoritesState
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>

      {/* Floating action button */}
      <Button
        size="icon"
        className="fixed right-4 bottom-20 z-40 rounded-full shadow-lg h-14 w-14"
        onClick={() => router.push("/create")}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </PullToRefresh>
  )
}
