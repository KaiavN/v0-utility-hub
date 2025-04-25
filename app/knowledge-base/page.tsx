"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { CardTitle } from "@/components/ui/card"
import type React from "react"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import {
  Search,
  Plus,
  X,
  BookOpen,
  FolderOpenDot,
  List,
  Info,
  Filter,
  Check,
  Star,
  Download,
  Upload,
  Settings,
  FileText,
  Folder,
  Bold,
  Italic,
  Heading,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Link,
  Table,
  Lightbulb,
  Layers,
  Briefcase,
  Heart,
  Home,
  Coffee,
  Calendar,
  Globe,
  User,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { generateFlashcards } from "@/app/actions/generate-flashcards"
import { useRouter } from "next/navigation"

interface KnowledgeItem {
  id: string
  title: string
  content: string
  tags: string[]
  category: string
  createdAt: string
  updatedAt: string
  favorite: boolean
  archived: boolean
  relatedItems?: string[] // IDs of related items
}

interface TagItem {
  id: string
  name: string
  color: string
}

interface CategoryItem {
  id: string
  name: string
  icon?: string
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: uuidv4(), name: "General", icon: "FileText" },
  { id: uuidv4(), name: "Work", icon: "Briefcase" },
  { id: uuidv4(), name: "Personal", icon: "User" },
  { id: uuidv4(), name: "Reference", icon: "BookOpen" },
  { id: uuidv4(), name: "Ideas", icon: "Lightbulb" },
  { id: uuidv4(), name: "Projects", icon: "Layers" },
]

const DEFAULT_TAGS: TagItem[] = [
  { id: uuidv4(), name: "important", color: "red" },
  { id: uuidv4(), name: "reference", color: "blue" },
  { id: uuidv4(), name: "idea", color: "green" },
  { id: uuidv4(), name: "todo", color: "yellow" },
  { id: uuidv4(), name: "concept", color: "purple" },
  { id: uuidv4(), name: "question", color: "pink" },
  { id: uuidv4(), name: "insight", color: "indigo" },
  { id: uuidv4(), name: "resource", color: "gray" },
]

const TAG_COLORS = [
  { name: "red", value: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  { name: "blue", value: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { name: "green", value: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { name: "yellow", value: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { name: "purple", value: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { name: "pink", value: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  { name: "indigo", value: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { name: "gray", value: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
  { name: "orange", value: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { name: "teal", value: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300" },
  { name: "cyan", value: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" },
  { name: "lime", value: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300" },
]

const getIconByName = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    FileText: <FileText className="h-4 w-4" />,
    Briefcase: <Briefcase className="h-4 w-4" />,
    User: <User className="h-4 w-4" />,
    BookOpen: <BookOpen className="h-4 w-4" />,
    Lightbulb: <Lightbulb className="h-4 w-4" />,
    Layers: <Layers className="h-4 w-4" />,
    Folder: <Folder className="h-4 w-4" />,
    Calendar: <Calendar className="h-4 w-4" />,
    Globe: <Globe className="h-4 w-4" />,
    Heart: <Heart className="h-4 w-4" />,
    Home: <Home className="h-4 w-4" />,
    Coffee: <Coffee className="h-4 w-4" />,
    Settings: <Settings className="h-4 w-4" />,
  }

  return iconMap[iconName] || <FileText className="h-4 w-4" />
}

// Keyboard shortcuts component
const KeyboardShortcuts = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="col-span-2 font-medium text-muted-foreground">Navigation</div>
        <div className="flex items-center justify-between">
          <span>New note</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + N</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Search</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + F</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Save</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + S</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Toggle favorite</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + D</kbd>
        </div>
        <div className="col-span-2 font-medium text-muted-foreground mt-2">Editing</div>
        <div className="flex items-center justify-between">
          <span>Bold</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + B</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Italic</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + I</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Heading</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + H</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Link</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + K</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>List</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + L</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Code</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + `</kbd>
        </div>
      </div>
    </div>
  )
}

// Markdown toolbar component
const MarkdownToolbar = ({ onAction }: { onAction: (action: string, value?: string) => void }) => {
  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/50 rounded-md mb-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("heading", "1")}>
              <Heading className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Heading (Ctrl+H)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("bold")}>
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bold (Ctrl+B)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("italic")}>
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Italic (Ctrl+I)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Separator orientation="vertical" className="h-6" />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("list", "bullet")}>
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bullet List</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("list", "ordered")}>
              <ListOrdered className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Numbered List</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("list", "task")}>
              <ListChecks className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Task List</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Separator orientation="vertical" className="h-6" />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("quote")}>
              <Quote className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Blockquote</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("code")}>
              <Code className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Code (Ctrl+`)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("link")}>
              <Link className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Link (Ctrl+K)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("image")}>
              <Image className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Image</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAction("table")}>
              <Table className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Table</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// Related items component
const RelatedItems = ({
  currentItem,
  allItems,
  tags,
  onSelectItem,
}: {
  currentItem: KnowledgeItem
  allItems: KnowledgeItem[]
  tags: TagItem[]
  onSelectItem: (id: string) => void
}) => {
  // Get tag color class
  const getTagClass = useCallback(
    (tagName: string) => {
      const tag = tags.find((t) => t.name === tagName)
      const colorObj = TAG_COLORS.find((c) => c.name === tag?.color) || TAG_COLORS[0]
      return colorObj.value
    },
    [tags],
  )

  // Find items with shared tags
  const relatedItems = useMemo(() => {
    if (!currentItem) return []

    return allItems
      .filter(
        (item) =>
          item.id !== currentItem.id && !item.archived && item.tags.some((tag) => currentItem.tags.includes(tag)),
      )
      .sort((a, b) => {
        // Count matching tags
        const aMatchCount = a.tags.filter((tag) => currentItem.tags.includes(tag)).length
        const bMatchCount = b.tags.filter((tag) => currentItem.tags.includes(tag)).length

        // Sort by match count, then by favorite status, then by date
        if (aMatchCount !== bMatchCount) return bMatchCount - aMatchCount
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
      .slice(0, 5)
  }, [currentItem, allItems, tags])

  if (relatedItems.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>No related items found</p>
        <p className="text-sm">Add more tags to discover connections</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {relatedItems.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-2 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
          onClick={() => onSelectItem(item.id)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{item.title}</h4>
              {item.favorite && <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tags
                .filter((tag) => currentItem.tags.includes(tag))
                .map((tag) => (
                  <Badge key={tag} className={`text-xs ${getTagClass(tag)}`}>
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const KnowledgeBasePage = () => {
  const { toast } = useToast()
  const router = useRouter()
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<{
    tags: string[]
    categories: string[]
    favorite: boolean | null
    archived: boolean | null
  }>({
    tags: [],
    categories: [],
    favorite: null,
    archived: false,
  })
  const [viewType, setViewType] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [currentItem, setCurrentItem] = useState<KnowledgeItem | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedItem, setEditedItem] = useState<Partial<KnowledgeItem>>({})
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [newTag, setNewTag] = useState<Partial<TagItem>>({ name: "", color: "blue" })
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState<Partial<CategoryItem>>({ name: "", icon: "Folder" })
  const [newTagInput, setNewTagInput] = useState("")
  const [createNewOpen, setCreateNewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("notes")
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [userSettings, setUserSettings] = useState({
    autoSave: true,
    darkMode: false,
    fontSize: "medium",
    sortBy: "updated",
    defaultView: "grid",
  })
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load saved data on mount
  useEffect(() => {
    setIsLoading(true)

    const savedKnowledgeItems = getLocalStorage<KnowledgeItem[]>("knowledgeItems", [])
    const savedTags = getLocalStorage<TagItem[]>("knowledgeTags", [])
    const savedCategories = getLocalStorage<CategoryItem[]>("knowledgeCategories", [])
    const savedSettings = getLocalStorage("knowledgeSettings", userSettings)

    // Initialize with defaults if empty
    if (savedKnowledgeItems.length === 0) {
      setKnowledgeItems(SAMPLE_KNOWLEDGE_ITEMS)
      setLocalStorage("knowledgeItems", SAMPLE_KNOWLEDGE_ITEMS)
    } else {
      setKnowledgeItems(savedKnowledgeItems)
    }

    if (savedTags.length === 0) {
      setTags(DEFAULT_TAGS)
      setLocalStorage("knowledgeTags", DEFAULT_TAGS)
    } else {
      setTags(savedTags)
    }

    if (savedCategories.length === 0) {
      setCategories(DEFAULT_CATEGORIES)
      setLocalStorage("knowledgeCategories", DEFAULT_CATEGORIES)
    } else {
      setCategories(savedCategories)
    }

    // Load user settings
    setUserSettings(savedSettings)
    setViewType(savedSettings.defaultView as "grid" | "list")

    setIsLoading(false)
  }, [])

  // Save data when it changes
  useEffect(() => {
    if (!isLoading) {
      setLocalStorage("knowledgeItems", knowledgeItems)
    }
  }, [knowledgeItems, isLoading])

  useEffect(() => {
    if (!isLoading) {
      setLocalStorage("knowledgeTags", tags)
    }
  }, [tags, isLoading])

  useEffect(() => {
    if (!isLoading) {
      setLocalStorage("knowledgeCategories", categories)
    }
  }, [categories, isLoading])

  useEffect(() => {
    if (!isLoading) {
      setLocalStorage("knowledgeSettings", userSettings)
    }
  }, [userSettings, isLoading])

  // Add a function to remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setEditedItem((prevItem) => ({
      ...prevItem,
      tags: (prevItem?.tags || currentItem?.tags || []).filter((tag) => tag !== tagToRemove),
    }))
  }

  // Add a function to add a tag
  const handleAddTag = () => {
    if (!newTagInput) {
      toast({
        title: "Tag name required",
        description: "Please add a tag.",
        variant: "destructive",
      })
      return
    }
    const newTagToAdd = newTagInput.trim()
    if (editedItem && newTagInput && !editedItem.tags?.includes(newTagToAdd)) {
      setEditedItem((prevItem) => ({
        ...prevItem,
        tags: [...(prevItem?.tags || []), newTagToAdd],
      }))
    } else if (currentItem && newTagInput && !currentItem.tags?.includes(newTagToAdd)) {
      setCurrentItem((prevItem) => ({
        ...prevItem,
        tags: [...(prevItem?.tags || []), newTagToAdd],
      }))
    }

    setNewTagInput("")
  }

  // Export data
  const exportData = () => {
    const data = JSON.stringify(knowledgeItems)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "knowledge-base-export.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import data
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      const reader = new FileReader()

      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string) as KnowledgeItem[]
          setKnowledgeItems(jsonData)
          toast({
            title: "Import successful",
            description: "Data has been imported and loaded.",
          })
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid JSON file.",
            variant: "destructive",
          })
          console.error("Import error", error)
        }
      }

      reader.readAsText(file)
    }
  }

  // Handle selection changes

  const onSelectItem = (id: string) => {
    const item = knowledgeItems.find((item) => item.id === id)
    if (item) setCurrentItem(item)
  }

  // Get tag color class
  const getTagClass = useCallback(
    (tagName: string) => {
      const tag = tags.find((t) => t.name === tagName)
      const colorObj = TAG_COLORS.find((c) => c.name === tag?.color) || TAG_COLORS[0]
      return colorObj.value
    },
    [tags],
  )

  // Handle creating a category
  const handleCreateCategory = () => {
    if (!newCategory.name) {
      toast({
        title: "Category name required",
        description: "Please add a category name.",
        variant: "destructive",
      })
      return
    }

    const newCategoryItem: CategoryItem = {
      id: uuidv4(),
      name: newCategory.name,
      icon: newCategory.icon || "Folder",
    }

    setCategories([...categories, newCategoryItem])
    setNewCategory({ name: "", icon: "Folder" })
    setCategoryDialogOpen(false)
  }

  const handleCategoryFilter = (category: string) => {
    setActiveFilters((prevFilters) => {
      if (prevFilters.categories.includes(category)) {
        return {
          ...prevFilters,
          categories: prevFilters.categories.filter((c) => c !== category),
        }
      } else {
        return {
          ...prevFilters,
          categories: [...prevFilters.categories, category],
        }
      }
    })
  }

  const sortedItems = useMemo(() => {
    let filteredItems = [...knowledgeItems]

    if (activeFilters.favorite === true) {
      filteredItems = filteredItems.filter((item) => item.favorite)
    }

    if (activeFilters.archived === true) {
      filteredItems = filteredItems.filter((item) => item.archived)
    } else {
      filteredItems = filteredItems.filter((item) => !item.archived)
    }

    if (activeFilters.categories.length > 0) {
      filteredItems = filteredItems.filter((item) => activeFilters.categories.includes(item.category))
    }

    if (activeFilters.tags.length > 0) {
      filteredItems = filteredItems.filter((item) => item.tags.some((tag) => activeFilters.tags.includes(tag)))
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase()
      filteredItems = filteredItems.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerCaseQuery) || item.content.toLowerCase().includes(lowerCaseQuery),
      )
    }

    return filteredItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [knowledgeItems, activeFilters, searchQuery])

  const SAMPLE_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
    {
      id: uuidv4(),
      title: "Sample Note 1",
      content: "This is a sample note. You can edit or delete it.",
      tags: ["important", "reference"],
      category: "General",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorite: true,
      archived: false,
    },
    {
      id: uuidv4(),
      title: "Sample Note 2",
      content: "Another sample note with different tags and category.",
      tags: ["idea", "todo"],
      category: "Work",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorite: false,
      archived: false,
    },
  ]

  const handleCreateNew = () => {
    const newItem: KnowledgeItem = {
      id: uuidv4(),
      title: editedItem.title || "Untitled Note",
      content: editedItem.content || "",
      tags: editedItem.tags || [],
      category: editedItem.category || "General",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favorite: false,
      archived: false,
    }

    setKnowledgeItems([...knowledgeItems, newItem])
    setEditedItem({})
    setCreateNewOpen(false)
  }

  const handleEditItem = () => {
    if (!currentItem) return

    setEditedItem({
      id: currentItem.id,
      title: currentItem.title,
      content: currentItem.content,
      tags: [...currentItem.tags],
      category: currentItem.category,
    })

    setIsEditMode(true)
  }

  const handleSaveEdit = () => {
    if (!currentItem || !editedItem) return

    const updatedItem = {
      ...currentItem,
      title: editedItem.title || currentItem.title,
      content: editedItem.content || currentItem.content,
      tags: editedItem.tags || currentItem.tags,
      category: editedItem.category || currentItem.category,
      updatedAt: new Date().toISOString(),
    }

    setKnowledgeItems(knowledgeItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)))

    setCurrentItem(updatedItem)
    setIsEditMode(false)
    setEditedItem({})

    toast({
      title: "Note updated",
      description: "Your note has been updated successfully.",
    })
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditedItem({})
  }

  const handleFavoriteFilter = () => {
    setActiveFilters({
      ...activeFilters,
      favorite: activeFilters.favorite === true ? null : true,
    })
  }

  const handleArchivedFilter = () => {
    setActiveFilters({
      ...activeFilters,
      archived: !activeFilters.archived,
    })
  }

  const handleResetFilters = () => {
    setActiveFilters({
      tags: [],
      categories: [],
      favorite: null,
      archived: false,
    })
  }

  const handleTagFilter = (tag: string) => {
    setActiveFilters((prevFilters) => {
      if (prevFilters.tags.includes(tag)) {
        return {
          ...prevFilters,
          tags: prevFilters.tags.filter((t) => t !== tag),
        }
      } else {
        return {
          ...prevFilters,
          tags: [...prevFilters.tags, tag],
        }
      }
    })
  }

  const renderItemCard = (item: KnowledgeItem) => (
    <Card
      key={item.id}
      className="cursor-pointer transition-colors hover:bg-muted"
      onClick={() => onSelectItem(item.id)}
      onDoubleClick={() => onSelectItem(item.id)}
    >
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge key={tag} className={`text-xs ${getTagClass(tag)}`}>
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderItemRow = (item: KnowledgeItem) => (
    <Card
      key={item.id}
      className="cursor-pointer transition-colors hover:bg-muted"
      onClick={() => onSelectItem(item.id)}
      onDoubleClick={() => onSelectItem(item.id)}
    >
      <CardContent className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{item.title}</h4>
          <p className="text-sm text-muted-foreground">{item.content}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge key={tag} className={`text-xs ${getTagClass(tag)}`}>
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        {item.favorite && <Star className="h-4 w-4 text-yellow-500" />}
      </CardContent>
    </Card>
  )

  const handleCreateFlashcardsFromNote = async () => {
    if (!currentItem) {
      toast({
        title: "No note selected",
        description: "Please select a note to generate flashcards from.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingFlashcards(true)

    try {
      const flashcardsResult = await generateFlashcards(currentItem.title, currentItem.content)

      if (flashcardsResult?.success && flashcardsResult.flashcards.length > 0) {
        // Load existing flashcard data
        const savedFlashcards = getLocalStorage("flashcards", [])
        const savedDecks = getLocalStorage("flashcardDecks", [])

        // Create a new deck with a unique ID
        const deckId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
        const newDeck = {
          id: deckId,
          name: `${currentItem.title} Flashcards`,
          description: `Generated from "${currentItem.title}" note`,
          isAIGenerated: true,
        }

        // Create flashcards and add them to the new deck
        const newFlashcards = flashcardsResult.flashcards.map((card) => ({
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(),
          front: card.front,
          back: card.back,
          deckId: deckId,
        }))

        // Update local storage
        const updatedDecks = [newDeck, ...savedDecks]
        const updatedFlashcards = [...newFlashcards, ...savedFlashcards]

        setLocalStorage("flashcardDecks", updatedDecks)
        setLocalStorage("flashcards", updatedFlashcards)

        toast({
          title: "Flashcards created",
          description: `Created ${newFlashcards.length} flashcards from "${currentItem.title}". Navigate to the Flashcards page to view them.`,
        })

        // Navigate to the flashcards page
        router.push("/flashcards")
      } else {
        toast({
          title: "Flashcards generation failed",
          description: flashcardsResult?.error || "Could not generate flashcards from the selected note.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating flashcards:", error)
      toast({
        title: "Flashcards generation error",
        description: "An error occurred while generating flashcards.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingFlashcards(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Your personal information repository</p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={createNewOpen} onOpenChange={setCreateNewOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editedItem.title || ""}
                    onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
                    placeholder="Note title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={editedItem.category || "General"}
                    onValueChange={(value) => setEditedItem({ ...editedItem, category: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Categories</SelectLabel>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            <div className="flex items-center gap-2">
                              {category.icon && getIconByName(category.icon)}
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={editedItem.content || ""}
                    onChange={(e) => setEditedItem({ ...editedItem, content: e.target.value })}
                    placeholder="Start writing your note here..."
                    className="h-[200px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editedItem.tags || []).map((tag) => (
                      <Badge
                        key={tag}
                        className={`cursor-pointer ${getTagClass(tag)}`}
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select value={newTagInput} onValueChange={setNewTagInput}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Tags</SelectLabel>
                          {tags.map((tag) => (
                            <SelectItem key={tag.id} value={tag.name}>
                              <span className="flex items-center gap-2">
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    TAG_COLORS.find((color) => color.name === tag.color)?.value.split(" ")[0] || ""
                                  }`}
                                ></span>
                                {tag.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!newTagInput) return
                        setEditedItem({
                          ...editedItem,
                          tags: [...(editedItem.tags || []), newTagInput],
                        })
                        setNewTagInput("")
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateNewOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateNew}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search notes..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={handleFavoriteFilter} className="flex items-center justify-between">
                Favorites only
                {activeFilters.favorite === true && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchivedFilter} className="flex items-center justify-between">
                Archived
                {activeFilters.archived === true && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleResetFilters}>Reset all filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
        <div className="md:col-span-1">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="multiple" defaultValue={["categories", "tags"]}>
                  <AccordionItem value="categories">
                    <AccordionTrigger className="px-4 py-2">
                      <span className="flex items-center text-sm font-medium">
                        <FolderOpenDot className="mr-2 h-4 w-4" /> Categories
                        {activeFilters.categories.length > 0 && (
                          <Badge className="ml-2">{activeFilters.categories.length}</Badge>
                        )}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2 pt-0">
                      <div className="space-y-1 px-4">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={activeFilters.categories.includes(category.name)}
                              onCheckedChange={() => handleCategoryFilter(category.name)}
                            />
                            <label
                              htmlFor={`category-${category.id}`}
                              className="ml-2 cursor-pointer text-sm flex items-center"
                            >
                              {category.icon && getIconByName(category.icon)}
                              {category.name}
                            </label>
                          </div>
                        ))}

                        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-2 text-xs">
                              <Plus className="mr-2 h-3 w-3" /> Add Category
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create New Category</DialogTitle>
                              <DialogDescription>Add a new category to organize your notes</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Category Name</label>
                                <Input
                                  value={newCategory.name || ""}
                                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                  placeholder="e.g., Meetings, Exercise"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Category Icon</label>
                                <div className="grid grid-cols-6 gap-2">
                                  {[
                                    "FileText",
                                    "Briefcase",
                                    "User",
                                    "BookOpen",
                                    "Lightbulb",
                                    "Layers",
                                    "Folder",
                                    "Calendar",
                                    "Globe",
                                    "Heart",
                                    "Home",
                                    "Coffee",
                                    "Settings",
                                  ].map((icon) => (
                                    <div
                                      key={icon}
                                      className={cn(
                                        "h-8 w-8 rounded-full cursor-pointer border-2 border-transparent flex items-center justify-center",
                                        newCategory.icon === icon && "border-primary",
                                      )}
                                      onClick={() => setNewCategory({ ...newCategory, icon: icon })}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault()
                                          setNewCategory({ ...newCategory, icon: icon })
                                        }
                                      }}
                                    >
                                      {getIconByName(icon)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <DialogFooter>
                              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleCreateCategory}>Create</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <div className="flex items-center justify-between border-t p-4">
                    <span className="text-sm text-muted-foreground">
                      {sortedItems.length} items {activeFilters.archived ? "(archived)" : ""}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Info className="mr-2 h-4 w-4" />
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuItem onClick={exportData}>
                          <Download className="mr-2 h-4 w-4" />
                          Export data
                        </DropdownMenuItem>
                        <DropdownMenuItem className="relative">
                          <Upload className="mr-2 h-4 w-4" />
                          Import data
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept=".json"
                            onChange={handleImport}
                          />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="mb-4">
              <TabsTrigger value="notes" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Notes</span>
              </TabsTrigger>
              <TabsTrigger value="detail" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>Detail View</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="h-[calc(100vh-250px)] lg:h-auto">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-3/4" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="mb-2 h-4 w-full" />
                          <Skeleton className="mb-2 h-4 w-5/6" />
                          <Skeleton className="h-4 w-4/6" />
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : sortedItems.length === 0 ? (
                <Card className="flex h-[calc(100vh-250px)] flex-col items-center justify-center p-6 text-center">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No notes found</h3>
                  <p className="mb-6 text-muted-foreground">
                    Create your first note or adjust your filters to see more items
                  </p>
                  <Button onClick={() => setCreateNewOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Note
                  </Button>
                </Card>
              ) : (
                <ScrollArea className="h-[calc(100vh-250px)] lg:h-[calc(100vh-220px)]">
                  {viewType === "grid" ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {sortedItems.map((item) => (
                        <Card
                          key={item.id}
                          className="cursor-pointer transition-colors hover:bg-muted"
                          onClick={() => onSelectItem(item.id)}
                          onDoubleClick={() => onSelectItem(item.id)}
                        >
                          <CardHeader>
                            <CardTitle>{item.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.tags.map((tag) => (
                                <Badge key={tag} className={`text-xs ${getTagClass(tag)}`}>
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedItems.map((item) => (
                        <Card
                          key={item.id}
                          className="cursor-pointer transition-colors hover:bg-muted"
                          onClick={() => onSelectItem(item.id)}
                          onDoubleClick={() => onSelectItem(item.id)}
                        >
                          <CardContent className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{item.title}</h4>
                              <p className="text-sm text-muted-foreground">{item.content}</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.tags.map((tag) => (
                                  <Badge key={tag} className={`text-xs ${getTagClass(tag)}`}>
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {item.favorite && <Star className="h-4 w-4 text-yellow-500" />}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="detail" className="h-[calc(100vh-200px)]">
              <Card className="h-full overflow-hidden">
                {currentItem ? (
                  <ScrollArea className="h-full">
                    {isEditMode ? (
                      // Edit mode
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                              value={editedItem.title || ""}
                              onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
                              placeholder="Note title"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select
                              value={editedItem.category || currentItem.category}
                              onValueChange={(value) => setEditedItem({ ...editedItem, category: value })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Categories</SelectLabel>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.name}>
                                      <div className="flex items-center gap-2">
                                        {category.icon && getIconByName(category.icon)}
                                        {category.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Content</label>
                            <Textarea
                              value={editedItem.content || ""}
                              onChange={(e) => setEditedItem({ ...editedItem, content: e.target.value })}
                              placeholder="Start writing your note here..."
                              className="h-[200px] resize-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Tags</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(editedItem.tags || []).map((tag) => (
                                <Badge
                                  key={tag}
                                  className={`cursor-pointer ${getTagClass(tag)}`}
                                  onClick={() => handleRemoveTag(tag)}
                                >
                                  {tag}
                                  <X className="ml-1 h-3 w-3" />
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Select value={newTagInput} onValueChange={setNewTagInput}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a tag" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>Tags</SelectLabel>
                                    {tags.map((tag) => (
                                      <SelectItem key={tag.id} value={tag.name}>
                                        <span className="flex items-center gap-2">
                                          <span
                                            className={`h-2 w-2 rounded-full ${
                                              TAG_COLORS.find((color) => color.name === tag.color)?.value.split(
                                                " ",
                                              )[0] || ""
                                            }`}
                                          ></span>
                                          {tag.name}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              <Button variant="outline" onClick={handleAddTag}>
                                Add
                              </Button>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={handleCancelEdit}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveEdit}>Save Changes</Button>
                          </div>
                        </div>
                      </CardContent>
                    ) : (
                      // View mode
                      <>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle>{currentItem.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Created at {new Date(currentItem.createdAt).toLocaleDateString()} | Last updated at{" "}
                              {new Date(currentItem.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditItem()}>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updatedItem = { ...currentItem, favorite: !currentItem.favorite }
                                setKnowledgeItems(
                                  knowledgeItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
                                )
                                setCurrentItem(updatedItem)
                              }}
                            >
                              {currentItem.favorite ? (
                                <>
                                  <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" /> Favorited
                                </>
                              ) : (
                                <>
                                  <Star className="mr-1 h-4 w-4" /> Favorite
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p>{currentItem.content}</p>
                          {currentItem.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {currentItem.tags.map((tag) => (
                                <Badge key={tag} className={`text-xs ${getTagClass(tag)}`}>
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Separator />
                          <div>
                            <h4 className="text-sm font-medium">Related Notes</h4>
                            <RelatedItems
                              currentItem={currentItem}
                              allItems={knowledgeItems}
                              tags={tags}
                              onSelectItem={onSelectItem}
                            />
                          </div>
                          <Button onClick={handleCreateFlashcardsFromNote} disabled={isGeneratingFlashcards}>
                            {isGeneratingFlashcards ? "Generating Flashcards..." : "Generate Flashcards"}
                          </Button>
                        </CardContent>
                      </>
                    )}
                  </ScrollArea>
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center">
                    <div className="space-y-2">
                      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">No item selected</h3>
                      <p className="text-muted-foreground">Select an item to view details</p>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default KnowledgeBasePage
