"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, ExternalLink, FileText, Calendar, User, DollarSign, Code, CheckSquare, Briefcase } from "lucide-react"
import { getLinkedItems, removeLinkedItem } from "@/lib/linked-items-service"
import type { ItemType } from "@/lib/linked-items-types"
import { getItemUrl, getItemTypeName } from "@/lib/navigation-utils"
import { useToast } from "@/hooks/use-toast"

interface LinkedItemsListProps {
  sourceId: string
  sourceType: ItemType
  showEmpty?: boolean
  maxItems?: number
  emptyMessage?: string
  className?: string
  onItemUpdated?: () => void // Add this prop
}

// Define the LinkedItem type
interface LinkedItem {
  id: string
  type: ItemType
  title: string
  date?: string
}

export function LinkedItemsList({
  sourceId,
  sourceType,
  showEmpty = true,
  maxItems,
  emptyMessage = "No linked items",
  className = "",
  onItemUpdated, // Use the new prop
}: LinkedItemsListProps) {
  const [items, setItems] = useState<LinkedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!sourceId) return

    try {
      const linkedItems = getLinkedItems(sourceId, sourceType)
      setItems(linkedItems)
    } catch (error) {
      console.error("Error loading linked items:", error)
    } finally {
      setIsLoading(false)
    }
  }, [sourceId, sourceType])

  const handleRemoveLink = (item: LinkedItem) => {
    try {
      const removed = removeLinkedItem(item.id, item.type, sourceId, sourceType)
      if (removed) {
        setItems(items.filter((i) => !(i.id === item.id && i.type === item.type)))
        toast({
          title: "Link removed",
          description: `${getItemTypeName(item.type)} has been unlinked.`,
        })
        if (onItemUpdated) {
          onItemUpdated() // Call the callback
        }
      }
    } catch (error) {
      console.error("Error removing link:", error)
      toast({
        title: "Error",
        description: "Failed to remove link. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleNavigate = (item: LinkedItem) => {
    const url = getItemUrl(item.type, item.id)
    router.push(url)
  }

  // Get icon based on item type
  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case "task":
      case "ganttTask":
        return <CheckSquare className="h-4 w-4" />
      case "project":
      case "ganttProject":
        return <Briefcase className="h-4 w-4" />
      case "client":
      case "contact":
        return <User className="h-4 w-4" />
      case "note":
      case "document":
        return <FileText className="h-4 w-4" />
      case "meeting":
      case "event":
        return <Calendar className="h-4 w-4" />
      case "billing":
        return <DollarSign className="h-4 w-4" />
      case "codeSnippet":
        return <Code className="h-4 w-4" />
      case "finance":
        return <DollarSign className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Display limited items if maxItems is set
  const displayedItems = maxItems ? items.slice(0, maxItems) : items

  if (isLoading) {
    return (
      <div className={`p-2 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (items.length === 0 && !showEmpty) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <>
          {displayedItems.map((item) => (
            <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="flex-shrink-0">{getItemIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getItemTypeName(item.type)}
                      {item.date && ` • ${new Date(item.date).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleNavigate(item)}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveLink(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {maxItems && items.length > maxItems && (
            <p className="text-xs text-muted-foreground text-center">
              +{items.length - maxItems} more linked {items.length - maxItems === 1 ? "item" : "items"}
            </p>
          )}
        </>
      )}
    </div>
  )
}
