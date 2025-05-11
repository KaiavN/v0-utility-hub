"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  LinkIcon,
  Plus,
  FileText,
  Calendar,
  User,
  DollarSign,
  Code,
  CheckSquare,
  Briefcase,
} from "lucide-react"
import type { ItemType, LinkableItem } from "@/lib/linked-items-types"
import { getLinkableItems, addLinkedItem } from "@/lib/linked-items-service"
import { useToast } from "@/hooks/use-toast"

interface LinkItemDialogProps {
  sourceId: string
  sourceType: ItemType
  onLinkAdded?: () => void
  trigger?: React.ReactNode
}

const ITEM_TYPES: { value: ItemType; label: string; icon: React.ReactNode }[] = [
  { value: "task", label: "Tasks", icon: <CheckSquare className="h-4 w-4 mr-2" /> },
  { value: "project", label: "Projects", icon: <Briefcase className="h-4 w-4 mr-2" /> },
  { value: "ganttTask", label: "Gantt Tasks", icon: <CheckSquare className="h-4 w-4 mr-2" /> },
  { value: "ganttProject", label: "Gantt Projects", icon: <Briefcase className="h-4 w-4 mr-2" /> },
  { value: "client", label: "Clients", icon: <User className="h-4 w-4 mr-2" /> },
  { value: "note", label: "Notes", icon: <FileText className="h-4 w-4 mr-2" /> },
  { value: "meeting", label: "Meetings", icon: <Calendar className="h-4 w-4 mr-2" /> },
  { value: "billing", label: "Invoices", icon: <DollarSign className="h-4 w-4 mr-2" /> },
  { value: "contact", label: "Contacts", icon: <User className="h-4 w-4 mr-2" /> },
  { value: "document", label: "Documents", icon: <FileText className="h-4 w-4 mr-2" /> },
  { value: "assignment", label: "Assignments", icon: <FileText className="h-4 w-4 mr-2" /> },
  { value: "event", label: "Events", icon: <Calendar className="h-4 w-4 mr-2" /> },
  { value: "codeSnippet", label: "Code Snippets", icon: <Code className="h-4 w-4 mr-2" /> },
  { value: "finance", label: "Finance", icon: <DollarSign className="h-4 w-4 mr-2" /> },
]

export function LinkItemDialog({ sourceId, sourceType, onLinkAdded, trigger }: LinkItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ItemType>("task")
  const [items, setItems] = useState<LinkableItem[]>([])
  const [filteredItems, setFilteredItems] = useState<LinkableItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadItems(activeTab)
    }
  }, [open, activeTab])

  useEffect(() => {
    if (searchQuery) {
      setFilteredItems(
        items.filter(
          (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())),
        ),
      )
    } else {
      setFilteredItems(items)
    }
  }, [searchQuery, items])

  const loadItems = async (type: ItemType) => {
    setIsLoading(true)
    try {
      const linkableItems = getLinkableItems(type)

      // Filter out the current item to prevent self-linking
      const filteredItems = linkableItems.filter((item) => !(item.type === sourceType && item.id === sourceId))

      setItems(filteredItems)
      setFilteredItems(filteredItems)
    } catch (error) {
      console.error("Error loading linkable items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkItem = (item: LinkableItem) => {
    try {
      addLinkedItem({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        date: item.date,
        sourceId,
        sourceType,
      })

      toast({
        title: "Item linked successfully",
        description: `${item.title} has been linked to this ${sourceType}.`,
      })

      if (onLinkAdded) {
        onLinkAdded()
      }

      setOpen(false)
    } catch (error) {
      console.error("Error linking item:", error)
      toast({
        title: "Error linking item",
        description: "There was an error linking this item. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <LinkIcon className="mr-2 h-4 w-4" />
            Link Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Link Item</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="task" value={activeTab} onValueChange={(value) => setActiveTab(value as ItemType)}>
          <TabsList className="flex flex-wrap h-auto mb-4">
            {ITEM_TYPES.map((type) => (
              <TabsTrigger key={type.value} value={type.value} className="mb-1 flex items-center">
                {type.icon}
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {ITEM_TYPES.map((type) => (
            <TabsContent key={type.value} value={type.value} className="mt-0">
              <ScrollArea className="h-[300px] rounded-md border p-2">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center p-2 rounded-md">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No items found</p>
                    <Button variant="link" onClick={() => setSearchQuery("")}>
                      Clear search
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => handleLinkItem(item)}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.title}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                          )}
                          {item.date && (
                            <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
