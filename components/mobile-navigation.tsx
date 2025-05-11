"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useWindowSize } from "@/hooks/use-window-size"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Home,
  Calendar,
  Settings,
  Search,
  Menu,
  Music,
  Bookmark,
  FileText,
  Dumbbell,
  Database,
  Clock,
  Pizza,
  Lock,
  Users,
  MessageSquare,
  Wallet,
  GanttChartSquare,
  BookOpen,
  ClipboardList,
  Quote,
  Briefcase,
  UserCheck,
  DollarSign,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUserPreferences } from "@/contexts/user-preferences-context"

export function MobileNavigation() {
  const pathname = usePathname()
  const { width } = useWindowSize()
  const isMobile = width ? width < 768 : false
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { isStudent, isProfessional } = useUserPreferences()

  if (!isMobile) return null

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
      <div className="flex items-center justify-around h-16">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            isActive("/") ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link
          href="/calendar"
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            isActive("/calendar") ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs mt-1">Calendar</span>
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
              <Menu className="h-5 w-5" />
              <span className="text-xs mt-1">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96 p-0">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">All Tools</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-5rem)]">
              <div className="p-4 space-y-6">
                {/* Common tools */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">COMMON TOOLS</h3>
                  <div className="space-y-1">
                    <MobileNavLink href="/spotify" icon={Music} label="Spotify Music" isNew />
                    <MobileNavLink href="/messages" icon={MessageSquare} label="Messages" isNew />
                    <MobileNavLink href="/code-snippets" icon={FileText} label="Code Snippets" />
                    <MobileNavLink href="/calendar" icon={Calendar} label="Daily Planner" />
                    <MobileNavLink href="/passwords" icon={Lock} label="Password Manager" />
                    <MobileNavLink href="/recipes" icon={FileText} label="Recipe Manager" />
                    <MobileNavLink href="/pomodoro" icon={Clock} label="Pomodoro Timer" />
                    <MobileNavLink href="/bookmarks" icon={Bookmark} label="Bookmarks" />
                    <MobileNavLink href="/meals" icon={Pizza} label="Meal Planner" />
                    <MobileNavLink href="/markdown" icon={FileText} label="Markdown Editor" />
                    <MobileNavLink href="/knowledge-base" icon={Database} label="Knowledge Base" />
                    <MobileNavLink href="/contacts" icon={Users} label="Contacts Manager" />
                    <MobileNavLink href="/workout" icon={Dumbbell} label="Workout Tracker" />
                    <MobileNavLink href="/flashcards" icon={BookOpen} label="Flashcards" isNew />
                    <MobileNavLink href="/gantt" icon={GanttChartSquare} label="Gantt Chart" isNew />
                  </div>
                </div>

                {/* Student tools */}
                {isStudent && isStudent() && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">STUDENT TOOLS</h3>
                    <div className="space-y-1">
                      <MobileNavLink href="/assignments" icon={ClipboardList} label="Assignment Tracker" isNew />
                      <MobileNavLink href="/citations" icon={Quote} label="Citation Generator" isNew />
                    </div>
                  </div>
                )}

                {/* Professional tools */}
                {isProfessional && isProfessional() && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">PROFESSIONAL TOOLS</h3>
                    <div className="space-y-1">
                      <MobileNavLink href="/finance" icon={Wallet} label="Finance Dashboard" />
                      <MobileNavLink href="/projects" icon={Briefcase} label="Project Tracker" isNew />
                      <MobileNavLink href="/clients" icon={UserCheck} label="Client Manager" isNew />
                      <MobileNavLink href="/billing" icon={DollarSign} label="Time Billing" isNew />
                      <MobileNavLink href="/meetings" icon={FileText} label="Meeting Notes" isNew />
                    </div>
                  </div>
                )}

                {/* Settings */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">SETTINGS</h3>
                  <div className="space-y-1">
                    <MobileNavLink href="/settings" icon={Settings} label="Settings" />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full text-muted-foreground"
        >
          <Search className="h-5 w-5" />
          <span className="text-xs mt-1">Search</span>
        </button>

        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center justify-center w-full h-full",
            isActive("/settings") ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs mt-1">Settings</span>
        </Link>
      </div>
    </div>
  )
}

// Helper component for mobile navigation links
function MobileNavLink({
  href,
  icon: Icon,
  label,
  isNew,
}: {
  href: string
  icon: React.ElementType
  label: string
  isNew?: boolean
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center py-2 px-3 rounded-md transition-colors",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted",
      )}
    >
      <Icon className="h-5 w-5 mr-3" />
      <span>{label}</span>
      {isNew && (
        <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">New</span>
      )}
    </Link>
  )
}
