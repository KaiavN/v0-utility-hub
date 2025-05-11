"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { LinkIcon } from "lucide-react"
import { getLinkedItems } from "@/lib/linked-items-service"
import type { ItemType } from "@/lib/linked-items-types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LinkedItemsBadgeProps {
  sourceId: string
  sourceType: ItemType
  className?: string
}

export function LinkedItemsBadge({ sourceId, sourceType, className = "" }: LinkedItemsBadgeProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!sourceId) return

    try {
      const linkedItems = getLinkedItems(sourceId, sourceType)
      setCount(linkedItems.length)
    } catch (error) {
      console.error("Error loading linked items count:", error)
    }
  }, [sourceId, sourceType])

  if (count === 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
            <LinkIcon className="h-3 w-3" />
            {count}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {count} linked {count === 1 ? "item" : "items"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
