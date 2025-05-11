"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, BarChart2, Calendar, List, Kanban, Users, Plus, Filter } from "lucide-react"
import { useWindowSize } from "@/hooks/use-window-size"

interface MobileNavigationProps {
  currentView: string
  onViewChange: (view: string) => void
  onAddTask: () => void
  onShowFilters: () => void
}

export function MobileNavigation({ currentView, onViewChange, onAddTask, onShowFilters }: MobileNavigationProps) {
  const [open, setOpen] = useState(false)
  const { width } = useWindowSize()
  const isMobile = width ? width < 768 : false

  if (!isMobile) return null

  const views = [
    { id: "gantt", label: "Gantt", icon: BarChart2 },
    { id: "board", label: "Board", icon: Kanban },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "list", label: "List", icon: List },
  ]

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 px-2 py-2 flex justify-between items-center">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] sm:w-[350px] p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Views</h2>
              </div>
              <div className="flex-1 overflow-auto p-2">
                {views.map((view) => {
                  const Icon = view.icon
                  return (
                    <Button
                      key={view.id}
                      variant={currentView === view.id ? "default" : "ghost"}
                      className="w-full justify-start mb-1"
                      onClick={() => {
                        onViewChange(view.id)
                        setOpen(false)
                      }}
                    >
                      <Icon className="mr-2 h-5 w-5" />
                      {view.label}
                    </Button>
                  )
                })}
                <div className="border-t my-4"></div>
                <Button
                  variant="ghost"
                  className="w-full justify-start mb-1"
                  onClick={() => {
                    setOpen(false)
                    // Add team members dialog logic here
                  }}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Team Members
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" className="h-10" onClick={onShowFilters}>
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <Button size="sm" className="h-10" onClick={onAddTask}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>
      </div>
      <div className="pb-16"></div> {/* Spacer to prevent content from being hidden behind the navigation */}
    </>
  )
}
