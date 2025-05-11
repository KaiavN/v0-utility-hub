"use client"

import { useMemo } from "react"
import {
  Database,
  Dumbbell,
  FileText,
  HomeIcon,
  LayoutDashboard,
  Lock,
  Pizza,
  Timer,
  Users,
  Wallet,
  Utensils,
  CalendarClock,
  GraduationCap,
  BookOpen,
  Briefcase,
  ClipboardList,
  UserCheck,
  DollarSign,
  FileEdit,
  Quote,
  Music,
  GanttChartSquare,
  MessageSquare,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import React from "react"
import { useWindowSize } from "@/hooks/use-window-size"

// Memoize the component to prevent unnecessary re-renders
export const AppSidebar = React.memo(function AppSidebar() {
  const pathname = usePathname()
  const { isStudent, isProfessional, isLoading, preferences } = useUserPreferences()
  const { width } = useWindowSize()
  const isMobile = width ? width < 768 : false

  // Common menu items for both roles - memoized to prevent recreating on each render
  const commonMenuItems = useMemo(
    () => [
      {
        title: "Dashboard",
        icon: HomeIcon,
        href: "/",
      },
      {
        title: "Spotify Music",
        icon: Music,
        href: "/spotify",
        badge: "New",
      },
      {
        title: "Messages",
        icon: MessageSquare,
        href: "/messages",
        badge: "New",
      },
      {
        title: "Code Snippets",
        icon: FileText,
        href: "/code-snippets",
      },
      {
        title: "Daily Planner",
        icon: CalendarClock,
        href: "/calendar",
      },
      {
        title: "Password Manager",
        icon: Lock,
        href: "/passwords",
      },
      {
        title: "Recipe Manager",
        icon: Utensils,
        href: "/recipes",
      },
      {
        title: "Pomodoro Timer",
        icon: Timer,
        href: "/pomodoro",
      },
      {
        title: "Bookmarks",
        icon: LayoutDashboard,
        href: "/bookmarks",
      },
      {
        title: "Meal Planner",
        icon: Pizza,
        href: "/meals",
      },
      {
        title: "Markdown Editor",
        icon: FileText,
        href: "/markdown",
      },
      {
        title: "Personal Knowledge Base",
        icon: Database,
        href: "/knowledge-base",
      },
      {
        title: "Event Timers",
        icon: Timer,
        href: "/countdown",
      },
      {
        title: "Contacts Manager",
        icon: Users,
        href: "/contacts",
      },
      {
        title: "Workout Tracker",
        icon: Dumbbell,
        href: "/workout",
      },
      {
        title: "Flashcards",
        icon: BookOpen,
        href: "/flashcards",
        badge: "New",
      },
      {
        title: "Gantt Chart",
        icon: GanttChartSquare,
        href: "/gantt",
        badge: "New",
      },
    ],
    [],
  )

  // Student-specific menu items
  const studentMenuItems = useMemo(
    () => [
      {
        title: "Assignment Tracker",
        icon: ClipboardList,
        href: "/assignments",
        badge: "New",
      },
      {
        title: "Citation Generator",
        icon: Quote,
        href: "/citations",
        badge: "New",
      },
    ],
    [],
  )

  // Professional-specific menu items
  const professionalMenuItems = useMemo(
    () => [
      {
        title: "Finance Dashboard",
        icon: Wallet,
        href: "/finance",
      },
      {
        title: "Project Tracker",
        icon: Briefcase,
        href: "/projects",
        badge: "New",
      },
      {
        title: "Client Manager",
        icon: UserCheck,
        href: "/clients",
        badge: "New",
      },
      {
        title: "Time Billing",
        icon: DollarSign,
        href: "/billing",
        badge: "New",
      },
      {
        title: "Meeting Notes",
        icon: FileEdit,
        href: "/meetings",
        badge: "New",
      },
    ],
    [],
  )

  // Determine which role-specific items to show - memoized to prevent recalculation
  const roleSpecificItems = useMemo(() => {
    // Don't try to determine role-specific items if still loading or preferences is null
    if (isLoading || !preferences) {
      return []
    }

    try {
      // Safely check if isStudent is a function and call it
      if (typeof isStudent === "function") {
        return isStudent() ? studentMenuItems : professionalMenuItems
      }
      return [] // Fallback if isStudent is not a function
    } catch (error) {
      console.error("Error determining role-specific items:", error)
      return [] // Return empty array as fallback
    }
  }, [isLoading, isStudent, studentMenuItems, professionalMenuItems, preferences])

  // Combine common items with role-specific items - memoized to prevent recreation
  const menuItems = useMemo(() => {
    try {
      const filteredCommonMenuItems = commonMenuItems.filter((item) => item.title !== "Kanban Board")
      return [...filteredCommonMenuItems, ...roleSpecificItems]
    } catch (error) {
      console.error("Error combining menu items:", error)
      return commonMenuItems // Return common items as fallback
    }
  }, [commonMenuItems, roleSpecificItems])

  // Determine the icon to show in the header
  const headerIcon = useMemo(() => {
    if (isLoading || !preferences) {
      return <HomeIcon className="h-6 w-6" />
    }

    try {
      // Check if preferences exists before trying to determine role
      if (!preferences) {
        return <HomeIcon className="h-6 w-6" />
      }

      if (typeof isStudent === "function" && isStudent()) {
        return <GraduationCap className="h-6 w-6" />
      } else {
        return <Briefcase className="h-6 w-6" />
      }
    } catch (error) {
      console.error("Error determining header icon:", error)
      return <HomeIcon className="h-6 w-6" />
    }
  }, [isLoading, isStudent, preferences])

  // Determine the role text to show in the header
  const roleText = useMemo(() => {
    if (isLoading || !preferences) {
      return "Loading..."
    }

    try {
      // Check if preferences exists before trying to determine role
      if (!preferences) {
        return "Loading..."
      }

      if (typeof isStudent === "function" && isStudent()) {
        return "Student Mode"
      } else {
        return "Professional Mode"
      }
    } catch (error) {
      console.error("Error determining role text:", error)
      return "Loading..."
    }
  }, [isLoading, isStudent, preferences])

  // Hide sidebar completely on mobile as we're using bottom navigation
  if (isMobile) {
    return null
  }

  return (
    <Sidebar className="border-r z-50">
      <SidebarHeader className="border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            {headerIcon}
          </div>
          <div>
            <h1 className="text-xl font-bold">Utility Hub</h1>
            <p className="text-xs text-muted-foreground">{roleText}</p>
          </div>
          <SidebarTrigger className="ml-auto md:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-4 py-3">
          <h3 className="mb-3 px-4 text-sm font-semibold">Features</h3>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href} className="transition-colors duration-200">
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 hover:bg-muted/50 transition-colors duration-150 rounded-md p-2"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge variant="outline" className="ml-auto bg-primary text-primary-foreground">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">© 2025 Utility Hub</p>
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
})
