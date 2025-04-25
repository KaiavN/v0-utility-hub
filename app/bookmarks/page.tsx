"use client"

import { useState, useEffect } from "react"
import { Bookmark, Edit, ExternalLink, Plus, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BookmarkItem {
  id: string
  title: string
  url: string
  description: string
  category: string
  tags: string[]
  createdAt: string
  favicon?: string
}

export default function BookmarksPage() {
  const { toast } = useToast()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [newBookmark, setNewBookmark] = useState<Partial<BookmarkItem>>({
    title: "",
    url: "",
    description: "",
    category: "Other",
    tags: [],
  })
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [newTag, setNewTag] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [activeTag, setActiveTag] = useState("")

  // Load bookmarks from local storage
  useEffect(() => {
    const savedBookmarks = getLocalStorage<BookmarkItem[]>("bookmarks", [])
    setBookmarks(savedBookmarks)
  }, [])

  // Save bookmarks to local storage
  const saveBookmarks = (updatedBookmarks: BookmarkItem[]) => {
    setBookmarks(updatedBookmarks)
    setLocalStorage("bookmarks", updatedBookmarks)
  }

  // Add a new bookmark
  const handleAddBookmark = () => {
    if (!newBookmark.title || !newBookmark.url) {
      toast({
        title: "Missing information",
        description: "Please provide at least a title and URL.",
        variant: "destructive",
      })
      return
    }

    // Ensure URL has protocol
    let url = newBookmark.url
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url
    }

    const bookmark: BookmarkItem = {
      id: Date.now().toString(),
      title: newBookmark.title,
      url: url,
      description: newBookmark.description || "",
      category: newBookmark.category || "Other",
      tags: newBookmark.tags || [],
      createdAt: new Date().toISOString(),
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`,
    }

    const updatedBookmarks = [...bookmarks, bookmark]
    saveBookmarks(updatedBookmarks)

    setNewBookmark({
      title: "",
      url: "",
      description: "",
      category: "Other",
      tags: [],
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Bookmark added",
      description: `"${bookmark.title}" has been added to your bookmarks.`,
    })
  }

  // Edit an existing bookmark
  const handleEditBookmark = () => {
    if (!editingBookmark || !editingBookmark.title || !editingBookmark.url) {
      toast({
        title: "Missing information",
        description: "Please provide at least a title and URL.",
        variant: "destructive",
      })
      return
    }

    // Ensure URL has protocol
    let url = editingBookmark.url
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url
    }

    const updatedBookmark = {
      ...editingBookmark,
      url,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`,
    }

    const updatedBookmarks = bookmarks.map((bookmark) =>
      bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark,
    )

    saveBookmarks(updatedBookmarks)
    setIsEditDialogOpen(false)
    setEditingBookmark(null)

    toast({
      title: "Bookmark updated",
      description: `"${updatedBookmark.title}" has been updated.`,
    })
  }

  // Delete a bookmark
  const handleDeleteBookmark = (id: string) => {
    const bookmarkToDelete = bookmarks.find((bookmark) => bookmark.id === id)
    const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.id !== id)
    saveBookmarks(updatedBookmarks)

    toast({
      title: "Bookmark deleted",
      description: bookmarkToDelete
        ? `"${bookmarkToDelete.title}" has been removed from your bookmarks.`
        : "Bookmark has been removed.",
    })
  }

  // Add a tag to a new or edited bookmark
  const handleAddTag = (isEditing: boolean) => {
    if (!newTag.trim()) return

    if (isEditing && editingBookmark) {
      if (!editingBookmark.tags.includes(newTag)) {
        setEditingBookmark({
          ...editingBookmark,
          tags: [...editingBookmark.tags, newTag],
        })
      }
    } else {
      if (!newBookmark.tags?.includes(newTag)) {
        setNewBookmark({
          ...newBookmark,
          tags: [...(newBookmark.tags || []), newTag],
        })
      }
    }
    setNewTag("")
  }

  // Remove a tag from a new or edited bookmark
  const handleRemoveTag = (tag: string, isEditing: boolean) => {
    if (isEditing && editingBookmark) {
      setEditingBookmark({
        ...editingBookmark,
        tags: editingBookmark.tags.filter((t) => t !== tag),
      })
    } else {
      setNewBookmark({
        ...newBookmark,
        tags: newBookmark.tags?.filter((t) => t !== tag) || [],
      })
    }
  }

  // Filter bookmarks based on search query, category, and tag
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesSearch =
      searchQuery === "" ||
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = activeCategory === "All" || bookmark.category === activeCategory

    const matchesTag = activeTag === "" || bookmark.tags.includes(activeTag)

    return matchesSearch && matchesCategory && matchesTag
  })

  // Get unique categories and count bookmarks in each
  const categories = ["All", ...new Set(bookmarks.map((bookmark) => bookmark.category))].map((category) => ({
    name: category,
    count: category === "All" ? bookmarks.length : bookmarks.filter((b) => b.category === category).length,
  }))

  // Get unique tags and count bookmarks with each tag
  const tags = Array.from(new Set(bookmarks.flatMap((bookmark) => bookmark.tags))).map((tag) => ({
    name: tag,
    count: bookmarks.filter((b) => b.tags.includes(tag)).length,
  }))

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookmarks</h1>
          <p className="text-muted-foreground">Save and organize your favorite websites</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bookmarks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Bookmark</DialogTitle>
                <DialogDescription>Enter the details of the website you want to bookmark.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newBookmark.title}
                    onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                    placeholder="Website Title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={newBookmark.url}
                    onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={newBookmark.description}
                    onChange={(e) => setNewBookmark({ ...newBookmark, description: e.target.value })}
                    placeholder="Brief description of the website"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newBookmark.category}
                    onChange={(e) => setNewBookmark({ ...newBookmark, category: e.target.value })}
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Learning">Learning</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="tags"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyDown={(e) => e.key === "Enter" && handleAddTag(false)}
                    />
                    <Button type="button" variant="outline" onClick={() => handleAddTag(false)}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {newBookmark.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag, false)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBookmark}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Categories and Tags Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className={`flex cursor-pointer items-center justify-between rounded-md p-2 ${
                      activeCategory === category.name ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                    onClick={() => setActiveCategory(category.name)}
                  >
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="secondary">{category.count}</Badge>
                  </div>
                ))}
              </div>

              {/* Fix for the overflow issue - Added proper spacing and a ScrollArea */}
              <div className="pt-4">
                <h3 className="mb-2 text-sm font-medium">Popular Tags</h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div
                        key={tag.name}
                        className={`flex cursor-pointer items-center justify-between rounded-md p-2 ${
                          activeTag === tag.name ? "bg-secondary" : "hover:bg-secondary/50"
                        }`}
                        onClick={() => setActiveTag(activeTag === tag.name ? "" : tag.name)}
                      >
                        <span className="font-medium">{tag.name}</span>
                        <Badge variant="secondary">{tag.count}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookmarks List */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="grid">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">
                  {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? "s" : ""}
                  {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
                  {activeTag ? ` tagged with "${activeTag}"` : ""}
                </span>
              </div>
              <TabsList>
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="grid" className="mt-0">
              {filteredBookmarks.length === 0 ? (
                <Card className="flex h-[300px] flex-col items-center justify-center text-center">
                  <Bookmark className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-xl font-semibold">No bookmarks found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || activeCategory !== "All" || activeTag
                      ? "Try changing your search or filters"
                      : "Add your first bookmark to get started"}
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBookmarks.map((bookmark) => (
                    <Card key={bookmark.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {bookmark.favicon && (
                              <img
                                src={bookmark.favicon || "/placeholder.svg"}
                                alt=""
                                className="h-5 w-5 rounded-sm"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            )}
                            <CardTitle className="line-clamp-1 text-lg">{bookmark.title}</CardTitle>
                          </div>
                          <Badge variant="outline">{bookmark.category}</Badge>
                        </div>
                        <CardDescription className="line-clamp-2 mt-1">
                          {bookmark.description || "No description provided"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex flex-wrap gap-1">
                          {bookmark.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditingBookmark(bookmark)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteBookmark(bookmark.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button asChild>
                          <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> Visit
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              {filteredBookmarks.length === 0 ? (
                <Card className="flex h-[300px] flex-col items-center justify-center text-center">
                  <Bookmark className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-xl font-semibold">No bookmarks found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || activeCategory !== "All" || activeTag
                      ? "Try changing your search or filters"
                      : "Add your first bookmark to get started"}
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredBookmarks.map((bookmark) => (
                    <Card key={bookmark.id}>
                      <div className="flex flex-col p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-4 sm:mb-0">
                          <div className="flex items-center gap-2">
                            {bookmark.favicon && (
                              <img
                                src={bookmark.favicon || "/placeholder.svg"}
                                alt=""
                                className="h-5 w-5 rounded-sm"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            )}
                            <h3 className="font-semibold">{bookmark.title}</h3>
                            <Badge variant="outline">{bookmark.category}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                            {bookmark.description || "No description provided"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {bookmark.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingBookmark(bookmark)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteBookmark(bookmark.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                          <Button asChild size="sm">
                            <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" /> Visit
                            </a>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Bookmark Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
            <DialogDescription>Update the details of your bookmark.</DialogDescription>
          </DialogHeader>
          {editingBookmark && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingBookmark.title}
                  onChange={(e) => setEditingBookmark({ ...editingBookmark, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-url">URL</Label>
                <Input
                  id="edit-url"
                  value={editingBookmark.url}
                  onChange={(e) => setEditingBookmark({ ...editingBookmark, url: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Input
                  id="edit-description"
                  value={editingBookmark.description}
                  onChange={(e) => setEditingBookmark({ ...editingBookmark, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingBookmark.category}
                  onChange={(e) => setEditingBookmark({ ...editingBookmark, category: e.target.value })}
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Learning">Learning</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tags">Tags</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag(true)}
                  />
                  <Button type="button" variant="outline" onClick={() => handleAddTag(true)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {editingBookmark.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag, true)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBookmark}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
