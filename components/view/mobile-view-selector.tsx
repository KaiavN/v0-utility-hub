"use client"

import { useWindowSize } from "@/hooks/use-window-size"
import { Button } from "@/components/ui/button"
import { BarChart2, Calendar, List, Kanban } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileViewSelectorProps {
  currentView: string
  onViewChange: (view: string) => void
}

export function MobileViewSelector({ currentView, onViewChange }: MobileViewSelectorProps) {
  const { width } = useWindowSize()
  const isMobile = width ? width < 768 : false

  if (!isMobile) return null

  const views = [
    { id: "gantt", icon: BarChart2, label: "Gantt" },
    { id: "board", icon: Kanban, label: "Board" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "list", icon: List, label: "List" },
  ]

  return (
    <div className="flex items-center justify-between bg-background border rounded-lg p-1 mb-4">
      {views.map((view) => {
        const Icon = view.icon
        const isActive = currentView === view.id

        return (
          <Button
            key={view.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className={cn("flex-1 h-9", isActive ? "" : "text-muted-foreground")}
            onClick={() => onViewChange(view.id)}
          >
            <Icon className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{view.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
