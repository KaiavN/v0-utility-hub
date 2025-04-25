"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Search, Trash2, Copy, Check, Code, Tag, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface CodeSnippet {
  id: string
  title: string
  code: string
  language: string
  tags: string[]
  description: string
  createdAt: string
  updatedAt: string
}

const languages = [
  "JavaScript",
  "TypeScript",
  "HTML",
  "CSS",
  "Python",
  "Java",
  "C#",
  "PHP",
  "Ruby",
  "Go",
  "Swift",
  "Kotlin",
  "SQL",
  "Bash",
  "JSON",
  "Markdown",
  "Other",
]

export default function CodeSnippetsPage() {
  const { toast } = useToast()
  const [snippets, setSnippets] = useState<CodeSnippet[]>([])
  const [activeSnippet, setActiveSnippet] = useState<CodeSnippet | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeLanguage, setActiveLanguage] = useState("All")
  const [copied, setCopied] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [showTagDialog, setShowTagDialog] = useState(false)

  useEffect(() => {
    const savedSnippets = getLocalStorage<CodeSnippet[]>("code-snippets", [])
    setSnippets(savedSnippets)
  }, [])

  const saveSnippets = (updatedSnippets: CodeSnippet[]) => {
    setSnippets(updatedSnippets)
    setLocalStorage("code-snippets", updatedSnippets)
  }

  const createNewSnippet = () => {
    const newSnippet: CodeSnippet = {
      id: Date.now().toString(),
      title: "Untitled Snippet",
      code: "",
      language: "JavaScript",
      tags: [],
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedSnippets = [newSnippet, ...snippets]
    saveSnippets(updatedSnippets)
    setActiveSnippet(newSnippet)

    toast({
      title: "Snippet created",
      description: "Your new code snippet has been created.",
    })
  }

  const updateSnippet = (updatedSnippet: CodeSnippet) => {
    updatedSnippet.updatedAt = new Date().toISOString()
    const updatedSnippets = snippets.map((snippet) => (snippet.id === updatedSnippet.id ? updatedSnippet : snippet))
    saveSnippets(updatedSnippets)
    setActiveSnippet(updatedSnippet)
  }

  const deleteSnippet = (id: string) => {
    const updatedSnippets = snippets.filter((snippet) => snippet.id !== id)
    saveSnippets(updatedSnippets)

    if (activeSnippet && activeSnippet.id === id) {
      setActiveSnippet(updatedSnippets.length > 0 ? updatedSnippets[0] : null)
    }

    toast({
      title: "Snippet deleted",
      description: "Your code snippet has been deleted.",
    })
  }

  const copyToClipboard = () => {
    if (activeSnippet) {
      navigator.clipboard.writeText(activeSnippet.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "Copied to clipboard",
        description: "Your code snippet has been copied to clipboard.",
      })
    }
  }

  const addTag = () => {
    if (activeSnippet && newTagName.trim() !== "") {
      if (!activeSnippet.tags.includes(newTagName.trim())) {
        const updatedSnippet = {
          ...activeSnippet,
          tags: [...activeSnippet.tags, newTagName.trim()],
        }
        updateSnippet(updatedSnippet)
        setNewTagName("")
        setShowTagDialog(false)
      } else {
        toast({
          title: "Tag already exists",
          description: "This tag is already added to the snippet.",
          variant: "destructive",
        })
      }
    }
  }

  const removeTag = (tag: string) => {
    if (activeSnippet) {
      const updatedSnippet = {
        ...activeSnippet,
        tags: activeSnippet.tags.filter((t) => t !== tag),
      }
      updateSnippet(updatedSnippet)
    }
  }

  const toggleFilterTag = (tag: string) => {
    if (filterTags.includes(tag)) {
      setFilterTags(filterTags.filter((t) => t !== tag))
    } else {
      setFilterTags([...filterTags, tag])
    }
  }

  // Get all unique tags from all snippets
  const allTags = Array.from(new Set(snippets.flatMap((snippet) => snippet.tags))).sort()

  const filteredSnippets = snippets.filter((snippet) => {
    const matchesSearch =
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLanguage = activeLanguage === "All" || snippet.language === activeLanguage

    const matchesTags = filterTags.length === 0 || filterTags.every((tag) => snippet.tags.includes(tag))

    return matchesSearch && matchesLanguage && matchesTags
  })

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Code Snippets</h1>
        <Button onClick={createNewSnippet}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Snippet
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative col-span-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search snippets..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={activeLanguage} onValueChange={setActiveLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Languages</SelectItem>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter by Tags</DialogTitle>
                <DialogDescription>Select tags to filter your code snippets</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 py-4">
                {allTags.length > 0 ? (
                  allTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filterTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFilterTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tags available</p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setFilterTags([])}>Clear Filters</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="space-y-4">
            {filteredSnippets.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">No snippets found</p>
                </CardContent>
              </Card>
            ) : (
              filteredSnippets.map((snippet) => (
                <Card
                  key={snippet.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    activeSnippet?.id === snippet.id ? "border-primary" : ""
                  }`}
                  onClick={() => setActiveSnippet(snippet)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="line-clamp-1 text-base">{snippet.title}</CardTitle>
                    <CardDescription className="flex items-center justify-between">
                      <Badge variant="outline">{snippet.language}</Badge>
                      <span className="text-xs">{new Date(snippet.updatedAt).toLocaleDateString()}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {snippet.description || "No description"}
                    </p>
                    {snippet.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {snippet.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {snippet.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{snippet.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          {activeSnippet ? (
            <Card className="h-full">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                  <Input
                    value={activeSnippet.title}
                    onChange={(e) => updateSnippet({ ...activeSnippet, title: e.target.value })}
                    className="mb-2 border-none bg-transparent p-0 text-xl font-bold focus-visible:ring-0"
                  />
                  <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={activeSnippet.language}
                    onValueChange={(value) => updateSnippet({ ...activeSnippet, language: value })}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-1">
                    {activeSnippet.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeTag(tag)
                          }}
                          className="ml-1 rounded-full hover:bg-muted"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}

                    <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6">
                          <Tag className="mr-1 h-3 w-3" />
                          Add Tag
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Tag</DialogTitle>
                          <DialogDescription>Add a new tag to organize your code snippet</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="tagName">Tag Name</Label>
                          <Input
                            id="tagName"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="mt-2"
                            placeholder="Enter tag name"
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={addTag}>Add Tag</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="ml-auto">
                    <Button variant="destructive" size="sm" onClick={() => deleteSnippet(activeSnippet.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                <Input
                  value={activeSnippet.description}
                  onChange={(e) => updateSnippet({ ...activeSnippet, description: e.target.value })}
                  className="mt-2"
                  placeholder="Add a description..."
                />
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="relative">
                  <pre className="rounded-md bg-muted p-4">
                    <code className="block overflow-x-auto whitespace-pre text-sm">
                      <textarea
                        value={activeSnippet.code}
                        onChange={(e) => updateSnippet({ ...activeSnippet, code: e.target.value })}
                        className="h-[calc(100vh-450px)] w-full resize-none bg-transparent font-mono focus:outline-none"
                        placeholder="// Enter your code here"
                        spellCheck="false"
                      />
                    </code>
                  </pre>
                </div>
              </CardContent>
              <CardFooter className="border-t p-6 text-sm text-muted-foreground">
                Last updated: {new Date(activeSnippet.updatedAt).toLocaleString()}
              </CardFooter>
            </Card>
          ) : (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <Code className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No snippet selected</h3>
                <p className="mb-4 text-sm text-muted-foreground">Select a snippet from the list or create a new one</p>
                <Button onClick={createNewSnippet}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Snippet
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
