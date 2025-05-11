"use client"

import { useState } from "react"
import type { Task } from "@/lib/gantt-types"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface MobileTaskCardProps {
  task: Task
  onTaskClick: (task: Task) => void
  onStatusChange?: (taskId: string, status: string) => void
}

export function MobileTaskCard({ task, onTaskClick, onStatusChange }: MobileTaskCardProps) {
  const [expanded, setExpanded] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <PlayCircle className="h-4 w-4 text-blue-500" />
      case "on-hold":
        return <PauseCircle className="h-4 w-4 text-amber-500" />
      case "not-started":
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
      default:
        return "bg-blue-500"
    }
  }

  const isOverdue = task.endDate && new Date(task.endDate) < new Date() && task.status !== "completed"

  return (
    <Card
      className={`mb-2 overflow-hidden border ${isOverdue ? "border-red-300 dark:border-red-800" : ""}`}
      onClick={() => onTaskClick(task)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 flex-1">
            <div className="mt-0.5">{getStatusIcon(task.status)}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{task.name}</h3>
              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                <span className="truncate">{task.project || "No project"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <div
              className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
              aria-label={`Priority: ${task.priority}`}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t text-sm">
            {task.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}

            <div className="grid grid-cols-2 gap-2 mb-2">
              {task.startDate && (
                <div className="flex items-center text-xs">
                  <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span>Start: {formatDate(new Date(task.startDate))}</span>
                </div>
              )}

              {task.endDate && (
                <div className="flex items-center text-xs">
                  <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className={isOverdue ? "text-red-500" : ""}>Due: {formatDate(new Date(task.endDate))}</span>
                </div>
              )}
            </div>

            {task.progress !== undefined && (
              <div className="mb-2">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-1.5" />
              </div>
            )}

            <div className="flex justify-between items-center">
              {task.assignee ? (
                <div className="flex items-center">
                  <Avatar className="h-5 w-5 mr-1">
                    <div className="bg-primary text-[10px] text-primary-foreground flex items-center justify-center h-full w-full">
                      {task.assignee.substring(0, 2).toUpperCase()}
                    </div>
                  </Avatar>
                  <span className="text-xs">{task.assignee}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Unassigned</span>
              )}

              {onStatusChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(task.id, "not-started")
                      }}
                    >
                      <Circle className="h-4 w-4 mr-2 text-gray-400" />
                      Not Started
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(task.id, "in-progress")
                      }}
                    >
                      <PlayCircle className="h-4 w-4 mr-2 text-blue-500" />
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(task.id, "completed")
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(task.id, "on-hold")
                      }}
                    >
                      <PauseCircle className="h-4 w-4 mr-2 text-amber-500" />
                      On Hold
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
