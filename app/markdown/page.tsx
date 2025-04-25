"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Save, FileText, Plus, Trash2, Eye, Edit, Download } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from "react-markdown"

interface MarkdownDocument {
  id: string
  title: string
  content: string
  lastModified: number
}

export default function MarkdownPage() {
  const [documents, setDocuments] = useState<MarkdownDocument[]>([])
  const [currentDocId, setCurrentDocId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSaved, setIsSaved] = useState(true)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const router = useRouter()
  const searchParams = useSearchParams()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialLoadRef = useRef(false)
  const isNavigatingRef = useRef(false)

  // Load documents from localStorage on component mount
  useEffect(() => {
    if (initialLoadRef.current) return

    const storedDocs = localStorage.getItem("markdownDocuments")
    if (storedDocs) {
      try {
        setDocuments(JSON.parse(storedDocs))
      } catch (e) {
        console.error("Failed to parse stored documents:", e)
        setDocuments([])
      }
    }

    initialLoadRef.current = true
  }, [])

  // Handle URL document ID changes
  useEffect(() => {
    if (!initialLoadRef.current) return

    const docId = searchParams.get("id")
    if (docId && docId !== currentDocId) {
      const doc = documents.find((d) => d.id === docId)
      if (doc) {
        setCurrentDocId(docId)
        setTitle(doc.title)
        setContent(doc.content)
        setIsSaved(true)
      }
    }
  }, [searchParams, documents, currentDocId])

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (!initialLoadRef.current) return

    localStorage.setItem("markdownDocuments", JSON.stringify(documents))
  }, [documents])

  // Set up beforeunload event to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSaved) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isSaved])

  // Load a document by ID
  const loadDocument = (id: string) => {
    if (isNavigatingRef.current) return

    const doc = documents.find((d) => d.id === id)
    if (doc) {
      isNavigatingRef.current = true
      setCurrentDocId(id)
      setTitle(doc.title)
      setContent(doc.content)
      setIsSaved(true)

      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        router.push(`/markdown?id=${id}`)
        isNavigatingRef.current = false
      }, 0)
    }
  }

  // Create a new document
  const createNewDocument = () => {
    if (isNavigatingRef.current) return

    if (!isSaved) {
      if (!confirm("You have unsaved changes. Create a new document anyway?")) {
        return
      }
    }

    const newId = uuidv4()
    const newDoc: MarkdownDocument = {
      id: newId,
      title: "Untitled Document",
      content: "",
      lastModified: Date.now(),
    }

    isNavigatingRef.current = true

    // Update state in a single batch to avoid multiple renders
    setDocuments((prev) => [...prev, newDoc])
    setCurrentDocId(newId)
    setTitle(newDoc.title)
    setContent(newDoc.content)
    setIsSaved(true)

    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
      router.push(`/markdown?id=${newId}`)
      isNavigatingRef.current = false
    }, 0)
  }

  // Save the current document
  const saveDocument = () => {
    if (!currentDocId) return

    try {
      const updatedDoc = {
        id: currentDocId,
        title,
        content,
        lastModified: Date.now(),
      }

      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === currentDocId) {
            return updatedDoc
          }
          return doc
        }),
      )

      // Ensure the updated documents are saved to localStorage immediately
      const updatedDocs = documents.map((doc) => (doc.id === currentDocId ? updatedDoc : doc))

      localStorage.setItem("markdownDocuments", JSON.stringify(updatedDocs))
      console.log("Saved document:", title, "Content length:", content?.length || 0)
      setIsSaved(true)
    } catch (error) {
      console.error("Error saving document:", error)
      alert("There was an error saving your document. Please try again.")
    }
  }

  // Delete the current document
  const deleteDocument = () => {
    if (!currentDocId || isNavigatingRef.current) return

    if (confirm("Are you sure you want to delete this document?")) {
      isNavigatingRef.current = true

      setDocuments((prev) => prev.filter((doc) => doc.id !== currentDocId))
      setCurrentDocId(null)
      setTitle("")
      setContent("")
      setIsSaved(true)

      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        router.push("/markdown")
        isNavigatingRef.current = false
      }, 0)
    }
  }

  // Handle content changes
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setIsSaved(false)
  }

  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    setIsSaved(false)
  }

  // Export markdown as .md file
  const exportMarkdown = () => {
    if (!currentDocId) return

    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/markdown" })
    element.href = URL.createObjectURL(file)
    element.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Insert markdown formatting
  const insertFormatting = (format: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    let newText = ""

    switch (format) {
      case "bold":
        newText = `**${selectedText || "bold text"}**`
        break
      case "italic":
        newText = `*${selectedText || "italic text"}*`
        break
      case "heading":
        newText = `\n## ${selectedText || "Heading"}\n`
        break
      case "link":
        newText = `[${selectedText || "link text"}](url)`
        break
      case "image":
        newText = `![${selectedText || "alt text"}](image-url)`
        break
      case "code":
        newText = selectedText.includes("\n")
          ? `\n\`\`\`\n${selectedText || "code block"}\n\`\`\`\n`
          : `\`${selectedText || "inline code"}\``
        break
      case "list":
        newText = `\n- ${selectedText || "List item"}\n- Another item\n- And another\n`
        break
      case "quote":
        newText = `\n> ${selectedText || "Blockquote"}\n`
        break
      case "hr":
        newText = `\n\n---\n\n`
        break
      default:
        return
    }

    const newContent = content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)
    setIsSaved(false)

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + newText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Markdown Editor</h1>
          <div className="flex space-x-2">
            <Button onClick={createNewDocument} size="sm" disabled={isNavigatingRef.current}>
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
            {currentDocId && (
              <>
                <Button onClick={saveDocument} size="sm" disabled={isSaved || isNavigatingRef.current}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={exportMarkdown} size="sm" variant="outline" disabled={!currentDocId}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={deleteDocument} size="sm" variant="destructive" disabled={isNavigatingRef.current}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Document List */}
          <Card className="md:col-span-1">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Documents</h2>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No documents yet</p>
                  ) : (
                    documents
                      .sort((a, b) => b.lastModified - a.lastModified)
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className={`p-2 rounded cursor-pointer flex items-center ${
                            currentDocId === doc.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          }`}
                          onClick={() => loadDocument(doc.id)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          <div className="truncate">{doc.title}</div>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Editor */}
          <Card className="md:col-span-3">
            <CardContent className="p-4">
              {currentDocId ? (
                <div className="space-y-4">
                  <Input
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Document Title"
                    className="text-lg font-semibold"
                  />

                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-md">
                    <Button variant="outline" size="sm" onClick={() => insertFormatting("bold")} title="Bold">
                      <strong>B</strong>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => insertFormatting("italic")} title="Italic">
                      <em>I</em>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => insertFormatting("heading")} title="Heading">
                      H
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => insertFormatting("link")} title="Link">
                      🔗
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => insertFormatting("image")} title="Image">
                      🖼️
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => insertFormatting("code")} title="Code">
                      {"</>"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => insertFormatting("list")} title="List">
                      •••
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => insertFormatting("quote")} title="Quote">
                      ""
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => insertFormatting("hr")} title="Horizontal Rule">
                      —
                    </Button>
                  </div>

                  {/* Edit/Preview Tabs */}
                  <Tabs defaultValue="edit" onValueChange={(value) => setActiveTab(value as "edit" | "preview")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="edit" className="flex items-center">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit" className="border rounded-md mt-2">
                      <Textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Write your markdown here..."
                        className="min-h-[calc(100vh-400px)] resize-none font-mono p-4"
                      />
                    </TabsContent>
                    <TabsContent value="preview" className="border rounded-md p-4 mt-2">
                      <ScrollArea className="min-h-[calc(100vh-400px)]">
                        <div className="prose dark:prose-invert max-w-none">
                          {content ? (
                            <ReactMarkdown>{content}</ReactMarkdown>
                          ) : (
                            <p className="text-muted-foreground">No content to preview</p>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)]">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No document selected</p>
                  <Button onClick={createNewDocument} disabled={isNavigatingRef.current}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
