"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface User {
  id: string
  name: string
  avatar?: string
  role: string
  color: string
}

interface TeamMembersListProps {
  users: User[]
  onManageTeam: () => void
  onSelectUser?: (userId: string) => void
  selectedUserId?: string
  className?: string
}

export default function TeamMembersList({
  users,
  onManageTeam,
  onSelectUser,
  selectedUserId,
  className = "",
}: TeamMembersListProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className={`border rounded-md ${className}`}>
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <Users className="h-4 w-4 mr-1.5 ml-1" />
          <span className="font-medium">Team Members</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onManageTeam}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && (
        <ScrollArea className="h-[200px]">
          <div className="p-2 space-y-1">
            {users.map((user) => (
              <TooltipProvider key={user.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                        selectedUserId === user.id ? "bg-muted" : ""
                      }`}
                      onClick={() => onSelectUser && onSelectUser(user.id)}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-medium truncate">{user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{user.role}</div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs">{user.role}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}

            {users.length === 0 && (
              <div className="text-center p-4 text-muted-foreground text-sm">No team members found.</div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
