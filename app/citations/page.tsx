"use client"

import { useState } from "react"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  Quote,
  Book,
  FileText,
  Globe,
  Newspaper,
  Video,
  Music,
  Database,
  Save,
  Check,
  X,
  Trash2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type CitationStyle = "apa" | "mla" | "chicago" | "harvard"
type SourceType = "book" | "website" | "journal" | "newspaper" | "video" | "podcast" | "database"

interface Author {
  firstName: string
  lastName: string
}

interface Citation {
  id: string
  sourceType: SourceType
  title: string
  authors: Author[]
  date: string
  url?: string
  publisher?: string
  publisherLocation?: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  accessDate?: string
  doi?: string
  style: CitationStyle
}

interface SavedCitation {
  id: string
  formattedCitation: string
  sourceData: Citation
}

export default function CitationsPage() {
  const [activeTab, setActiveTab] = useState<CitationStyle>("apa")
  const [sourceType, setSourceType] = useState<SourceType>("book")
  const [savedCitations, setSavedCitations] = useState<SavedCitation[]>(() => {
    return getLocalStorage<SavedCitation[]>("savedCitations", [])
  })

  const [citation, setCitation] = useState<Omit<Citation, "id" | "style">>({
    sourceType: "book",
    title: "",
    authors: [{ firstName: "", lastName: "" }],
    date: "",
    url: "",
    publisher: "",
    publisherLocation: "",
    journal: "",
    volume: "",
    issue: "",
    pages: "",
    accessDate: new Date().toISOString().split("T")[0],
    doi: "",
  })

  const [formattedCitation, setFormattedCitation] = useState("")
  const [copied, setCopied] = useState(false)

  const { toast } = useToast()

  const handleAddAuthor = () => {
    setCitation({
      ...citation,
      authors: [...citation.authors, { firstName: "", lastName: "" }],
    })
  }

  const handleRemoveAuthor = (index: number) => {
    const newAuthors = [...citation.authors]
    newAuthors.splice(index, 1)
    setCitation({
      ...citation,
      authors: newAuthors,
    })
  }

  const handleAuthorChange = (index: number, field: keyof Author, value: string) => {
    const newAuthors = [...citation.authors]
    newAuthors[index] = { ...newAuthors[index], [field]: value }
    setCitation({
      ...citation,
      authors: newAuthors,
    })
  }

  const handleSourceTypeChange = (type: SourceType) => {
    setSourceType(type)
    setCitation({
      ...citation,
      sourceType: type,
    })
  }

  const formatAuthorsAPA = (authors: Author[]) => {
    if (authors.length === 0 || (authors.length === 1 && !authors[0].lastName)) {
      return ""
    }

    if (authors.length === 1) {
      return `${authors[0].lastName}, ${authors[0].firstName.charAt(0)}.`
    }

    if (authors.length === 2) {
      return `${authors[0].lastName}, ${authors[0].firstName.charAt(0)}., & ${authors[1].lastName}, ${authors[1].firstName.charAt(0)}.`
    }

    if (authors.length > 7) {
      return `${authors
        .slice(0, 6)
        .map((a) => `${a.lastName}, ${a.firstName.charAt(0)}.`)
        .join(", ")}, ... ${authors[authors.length - 1].lastName}, ${authors[authors.length - 1].firstName.charAt(0)}.`
    }

    const lastAuthor = authors[authors.length - 1]
    return `${authors
      .slice(0, -1)
      .map((a) => `${a.lastName}, ${a.firstName.charAt(0)}.`)
      .join(", ")}, & ${lastAuthor.lastName}, ${lastAuthor.firstName.charAt(0)}.`
  }

  const formatAuthorsMLA = (authors: Author[]) => {
    if (authors.length === 0 || (authors.length === 1 && !authors[0].lastName)) {
      return ""
    }

    if (authors.length === 1) {
      return `${authors[0].lastName}, ${authors[0].firstName}.`
    }

    if (authors.length === 2) {
      return `${authors[0].lastName}, ${authors[0].firstName}, and ${authors[1].firstName} ${authors[1].lastName}.`
    }

    if (authors.length === 3) {
      return `${authors[0].lastName}, ${authors[0].firstName}, ${authors[1].firstName} ${authors[1].lastName}, and ${authors[2].firstName} ${authors[2].lastName}.`
    }

    return `${authors[0].lastName}, ${authors[0].firstName}, et al.`
  }

  const formatAuthorsChicago = (authors: Author[]) => {
    if (authors.length === 0 || (authors.length === 1 && !authors[0].lastName)) {
      return ""
    }

    if (authors.length === 1) {
      return `${authors[0].lastName}, ${authors[0].firstName}.`
    }

    if (authors.length === 2) {
      return `${authors[0].lastName}, ${authors[0].firstName}, and ${authors[1].firstName} ${authors[1].lastName}.`
    }

    if (authors.length === 3) {
      return `${authors[0].lastName}, ${authors[0].firstName}, ${authors[1].firstName} ${authors[1].lastName}, and ${authors[2].firstName} ${authors[2].lastName}.`
    }

    return `${authors[0].lastName}, ${authors[0].firstName}, et al.`
  }

  const formatAuthorsHarvard = (authors: Author[]) => {
    if (authors.length === 0 || (authors.length === 1 && !authors[0].lastName)) {
      return ""
    }

    if (authors.length === 1) {
      return `${authors[0].lastName}, ${authors[0].firstName.charAt(0)}.`
    }

    if (authors.length === 2) {
      return `${authors[0].lastName}, ${authors[0].firstName.charAt(0)}. and ${authors[1].lastName}, ${authors[1].firstName.charAt(0)}.`
    }

    if (authors.length === 3) {
      return `${authors[0].lastName}, ${authors[0].firstName.charAt(0)}., ${authors[1].lastName}, ${authors[1].firstName.charAt(0)}. and ${authors[2].lastName}, ${authors[2].firstName.charAt(0)}.`
    }

    return `${authors[0].lastName}, ${authors[0].firstName.charAt(0)}. et al.`
  }

  const formatDate = (date: string, style: CitationStyle) => {
    if (!date) return ""

    const dateObj = new Date(date)
    const year = dateObj.getFullYear()

    if (style === "apa" || style === "harvard") {
      return `(${year})`
    }

    if (style === "mla") {
      return year.toString()
    }

    if (style === "chicago") {
      return year.toString()
    }

    return year.toString()
  }

  const generateCitation = () => {
    let result = ""

    // Basic validation
    if (!citation.title) {
      toast({
        title: "Missing information",
        description: "Please enter at least a title for your citation.",
        variant: "destructive",
      })
      return
    }

    switch (activeTab) {
      case "apa":
        result = generateAPACitation()
        break
      case "mla":
        result = generateMLACitation()
        break
      case "chicago":
        result = generateChicagoCitation()
        break
      case "harvard":
        result = generateHarvardCitation()
        break
    }

    setFormattedCitation(result)
  }

  const generateAPACitation = () => {
    let result = ""

    // Authors
    const authors = formatAuthorsAPA(citation.authors)
    if (authors) {
      result += authors + " "
    }

    // Date
    if (citation.date) {
      result += `(${new Date(citation.date).getFullYear()}). `
    }

    // Title
    switch (citation.sourceType) {
      case "book":
        result += `${citation.title}. `
        break
      case "website":
      case "journal":
      case "newspaper":
      case "video":
      case "podcast":
      case "database":
        result += `${citation.title}. `
        break
    }

    // Source-specific information
    switch (citation.sourceType) {
      case "book":
        if (citation.publisherLocation && citation.publisher) {
          result += `${citation.publisherLocation}: ${citation.publisher}.`
        } else if (citation.publisher) {
          result += `${citation.publisher}.`
        }
        break
      case "journal":
        if (citation.journal) {
          result += `${citation.journal}`
          if (citation.volume) {
            result += `, ${citation.volume}`
            if (citation.issue) {
              result += `(${citation.issue})`
            }
          }
          if (citation.pages) {
            result += `, ${citation.pages}`
          }
          result += "."
        }
        if (citation.doi) {
          result += ` https://doi.org/${citation.doi}`
        } else if (citation.url) {
          result += ` ${citation.url}`
        }
        break
      case "website":
        if (citation.publisher) {
          result += `${citation.publisher}. `
        }
        if (citation.url) {
          result += `${citation.url}`
        }
        break
      case "newspaper":
        if (citation.journal) {
          result += `${citation.journal}. `
        }
        if (citation.url) {
          result += `${citation.url}`
        }
        break
      case "video":
        if (citation.publisher) {
          result += `${citation.publisher}. `
        }
        if (citation.url) {
          result += `${citation.url}`
        }
        break
      case "podcast":
        if (citation.publisher) {
          result += `${citation.publisher}. `
        }
        if (citation.url) {
          result += `${citation.url}`
        }
        break
      case "database":
        if (citation.publisher) {
          result += `${citation.publisher}. `
        }
        if (citation.url) {
          result += `${citation.url}`
        }
        break
    }

    return result
  }

  const generateMLACitation = () => {
    let result = ""

    // Authors
    const authors = formatAuthorsMLA(citation.authors)
    if (authors) {
      result += authors + " "
    }

    // Title
    switch (citation.sourceType) {
      case "book":
        result += `"${citation.title}." `
        break
      case "website":
      case "journal":
      case "newspaper":
      case "video":
      case "podcast":
      case "database":
        result += `"${citation.title}." `
        break
    }

    // Source-specific information
    switch (citation.sourceType) {
      case "book":
        if (citation.publisher) {
          result += `${citation.publisher}, `
        }
        if (citation.date) {
          result += `${new Date(citation.date).getFullYear()}.`
        }
        break
      case "journal":
        if (citation.journal) {
          result += `${citation.journal}, `
          if (citation.volume) {
            result += `vol. ${citation.volume}, `
            if (citation.issue) {
              result += `no. ${citation.issue}, `
            }
          }
          if (citation.date) {
            result += `${new Date(citation.date).getFullYear()}, `
          }
          if (citation.pages) {
            result += `pp. ${citation.pages}.`
          }
        }
        if (citation.doi) {
          result += ` DOI: ${citation.doi}`
        } else if (citation.url) {
          result += ` ${citation.url}`
        }
        break
      case "website":
        if (citation.publisher) {
          result += `${citation.publisher}, `
        }
        if (citation.date) {
          result += `${new Date(citation.date).getFullYear()}, `
        }
        if (citation.url) {
          result += `${citation.url}.`
        }
        if (citation.accessDate) {
          result += ` Accessed ${new Date(citation.accessDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}.`
        }
        break
      case "newspaper":
        if (citation.journal) {
          result += `${citation.journal}, `
        }
        if (citation.date) {
          result += `${new Date(citation.date).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}, `
        }
        if (citation.url) {
          result += `${citation.url}.`
        }
        break
      case "video":
      case "podcast":
      case "database":
        if (citation.publisher) {
          result += `${citation.publisher}, `
        }
        if (citation.date) {
          result += `${new Date(citation.date).getFullYear()}, `
        }
        if (citation.url) {
          result += `${citation.url}.`
        }
        break
    }

    return result
  }

  const generateChicagoCitation = () => {
    let result = ""

    // Authors
    const authors = formatAuthorsChicago(citation.authors)
    if (authors) {
      result += authors + " "
    }

    // Title
    switch (citation.sourceType) {
      case "book":
        result += `${citation.title}. `
        break
      case "website":
      case "journal":
      case "newspaper":
      case "video":
      case "podcast":
      case "database":
        result += `"${citation.title}." `
        break
    }

    // Source-specific information
    switch (citation.sourceType) {
      case "book":
        if (citation.publisherLocation) {
          result += `${citation.publisherLocation}: `
        }
        if (citation.publisher) {
          result += `${citation.publisher}, `
        }
        if (citation.date) {
          result += `${new Date(citation.date).getFullYear()}.`
        }
        break
      case "journal":
        if (citation.journal) {
          result += `${citation.journal} `
          if (citation.volume) {
            result += `${citation.volume}, `
            if (citation.issue) {
              result += `no. ${citation.issue} `
            }
          }
          if (citation.date) {
            result += `(${new Date(citation.date).getFullYear()}): `
          }
          if (citation.pages) {
            result += `${citation.pages}.`
          }
        }
        if (citation.doi) {
          result += ` https://doi.org/${citation.doi}`
        } else if (citation.url) {
          result += ` ${citation.url}`
        }
        break
      case "website":
        if (citation.publisher) {
          result += `${citation.publisher}. `
        }
        if (citation.date) {
          result += `${new Date(citation.date).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}. `
        }
        if (citation.url) {
          result += `${citation.url}.`
        }
        break
      case "newspaper":
      case "video":
      case "podcast":
      case "database":
        if (citation.publisher || citation.journal) {
          result += `${citation.publisher || citation.journal}. `
        }
        if (citation.date) {
          result += `${new Date(citation.date).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}. `
        }
        if (citation.url) {
          result += `${citation.url}.`
        }
        break
    }

    return result
  }

  const generateHarvardCitation = () => {
    let result = ""

    // Authors
    const authors = formatAuthorsHarvard(citation.authors)
    if (authors) {
      result += authors + " "
    }

    // Date
    if (citation.date) {
      result += `${new Date(citation.date).getFullYear()}. `
    }

    // Title
    switch (citation.sourceType) {
      case "book":
        result += `${citation.title}. `
        break
      case "website":
      case "journal":
      case "newspaper":
      case "video":
      case "podcast":
      case "database":
        result += `'${citation.title}', `
        break
    }

    // Source-specific information
    switch (citation.sourceType) {
      case "book":
        if (citation.publisherLocation) {
          result += `${citation.publisherLocation}: `
        }
        if (citation.publisher) {
          result += `${citation.publisher}.`
        }
        break
      case "journal":
        if (citation.journal) {
          result += `${citation.journal}, `
          if (citation.volume) {
            result += `vol. ${citation.volume}, `
            if (citation.issue) {
              result += `no. ${citation.issue}, `
            }
          }
          if (citation.pages) {
            result += `pp. ${citation.pages}.`
          }
        }
        if (citation.doi) {
          result += ` DOI: ${citation.doi}`
        } else if (citation.url) {
          result += ` Available at: ${citation.url}`
          if (citation.accessDate) {
            result += ` (Accessed: ${new Date(citation.accessDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}).`
          }
        }
        break
      case "website":
        if (citation.publisher) {
          result += `${citation.publisher}. `
        }
        if (citation.url) {
          result += `Available at: ${citation.url}`
          if (citation.accessDate) {
            result += ` (Accessed: ${new Date(citation.accessDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}).`
          }
        }
        break
      case "newspaper":
      case "video":
      case "podcast":
      case "database":
        if (citation.publisher || citation.journal) {
          result += `${citation.publisher || citation.journal}. `
        }
        if (citation.url) {
          result += `Available at: ${citation.url}`
          if (citation.accessDate) {
            result += ` (Accessed: ${new Date(citation.accessDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}).`
          }
        }
        break
    }

    return result
  }

  const handleCopyCitation = () => {
    if (!formattedCitation) return

    navigator.clipboard.writeText(formattedCitation)
    setCopied(true)

    toast({
      title: "Citation copied",
      description: "The citation has been copied to your clipboard.",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveCitation = () => {
    if (!formattedCitation) return

    const newCitation: SavedCitation = {
      id: Date.now().toString(),
      formattedCitation,
      sourceData: {
        ...citation,
        id: Date.now().toString(),
        style: activeTab,
      },
    }

    const updatedCitations = [...savedCitations, newCitation]
    setSavedCitations(updatedCitations)
    setLocalStorage("savedCitations", updatedCitations)

    toast({
      title: "Citation saved",
      description: "The citation has been saved to your library.",
    })
  }

  const handleDeleteSavedCitation = (id: string) => {
    const updatedCitations = savedCitations.filter((c) => c.id !== id)
    setSavedCitations(updatedCitations)
    setLocalStorage("savedCitations", updatedCitations)

    toast({
      title: "Citation deleted",
      description: "The citation has been removed from your library.",
    })
  }

  const getSourceTypeIcon = (type: SourceType) => {
    switch (type) {
      case "book":
        return <Book className="h-4 w-4" />
      case "website":
        return <Globe className="h-4 w-4" />
      case "journal":
        return <FileText className="h-4 w-4" />
      case "newspaper":
        return <Newspaper className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "podcast":
        return <Music className="h-4 w-4" />
      case "database":
        return <Database className="h-4 w-4" />
    }
  }

  return (
    <RoleGuard allowedRoles={["student"]}>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Citation Generator</h1>
        <p className="text-muted-foreground mb-6">Generate citations in various formats for your academic papers</p>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Citation</CardTitle>
                <CardDescription>Fill in the source details to generate a citation</CardDescription>
                <Tabs
                  defaultValue="apa"
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as CitationStyle)}
                >
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="apa">APA</TabsTrigger>
                    <TabsTrigger value="mla">MLA</TabsTrigger>
                    <TabsTrigger value="chicago">Chicago</TabsTrigger>
                    <TabsTrigger value="harvard">Harvard</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sourceType">Source Type</Label>
                    <Select value={sourceType} onValueChange={(value) => handleSourceTypeChange(value as SourceType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="book">Book</SelectItem>
                        <SelectItem value="journal">Journal Article</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="newspaper">Newspaper</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="podcast">Podcast</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={citation.title}
                      onChange={(e) => setCitation({ ...citation, title: e.target.value })}
                      placeholder={`${sourceType === "book" ? "Book" : sourceType === "journal" ? "Article" : "Source"} title`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Authors</Label>
                      <Button variant="outline" size="sm" onClick={handleAddAuthor}>
                        Add Author
                      </Button>
                    </div>
                    {citation.authors.map((author, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <Input
                          placeholder="First name"
                          value={author.firstName}
                          onChange={(e) => handleAuthorChange(index, "firstName", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Last name"
                          value={author.lastName}
                          onChange={(e) => handleAuthorChange(index, "lastName", e.target.value)}
                          className="flex-1"
                        />
                        {citation.authors.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveAuthor(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label htmlFor="date">Publication Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={citation.date}
                      onChange={(e) => setCitation({ ...citation, date: e.target.value })}
                    />
                  </div>

                  {/* Source-specific fields */}
                  {sourceType === "book" && (
                    <>
                      <div>
                        <Label htmlFor="publisher">Publisher</Label>
                        <Input
                          id="publisher"
                          value={citation.publisher || ""}
                          onChange={(e) => setCitation({ ...citation, publisher: e.target.value })}
                          placeholder="Publisher name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="publisherLocation">Publisher Location</Label>
                        <Input
                          id="publisherLocation"
                          value={citation.publisherLocation || ""}
                          onChange={(e) => setCitation({ ...citation, publisherLocation: e.target.value })}
                          placeholder="City, State/Country"
                        />
                      </div>
                    </>
                  )}

                  {sourceType === "journal" && (
                    <>
                      <div>
                        <Label htmlFor="journal">Journal Name</Label>
                        <Input
                          id="journal"
                          value={citation.journal || ""}
                          onChange={(e) => setCitation({ ...citation, journal: e.target.value })}
                          placeholder="Journal name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="volume">Volume</Label>
                          <Input
                            id="volume"
                            value={citation.volume || ""}
                            onChange={(e) => setCitation({ ...citation, volume: e.target.value })}
                            placeholder="Volume number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="issue">Issue</Label>
                          <Input
                            id="issue"
                            value={citation.issue || ""}
                            onChange={(e) => setCitation({ ...citation, issue: e.target.value })}
                            placeholder="Issue number"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="pages">Pages</Label>
                        <Input
                          id="pages"
                          value={citation.pages || ""}
                          onChange={(e) => setCitation({ ...citation, pages: e.target.value })}
                          placeholder="e.g., 123-145"
                        />
                      </div>
                      <div>
                        <Label htmlFor="doi">DOI (Digital Object Identifier)</Label>
                        <Input
                          id="doi"
                          value={citation.doi || ""}
                          onChange={(e) => setCitation({ ...citation, doi: e.target.value })}
                          placeholder="e.g., 10.1000/xyz123"
                        />
                      </div>
                    </>
                  )}

                  {(sourceType === "website" ||
                    sourceType === "newspaper" ||
                    sourceType === "video" ||
                    sourceType === "podcast" ||
                    sourceType === "database") && (
                    <>
                      <div>
                        <Label htmlFor="publisher">
                          {sourceType === "newspaper" ? "Newspaper Name" : "Publisher/Organization"}
                        </Label>
                        <Input
                          id="publisher"
                          value={citation.publisher || ""}
                          onChange={(e) => setCitation({ ...citation, publisher: e.target.value })}
                          placeholder={sourceType === "newspaper" ? "Newspaper name" : "Publisher or organization name"}
                        />
                      </div>
                    </>
                  )}

                  {(sourceType === "website" ||
                    sourceType === "journal" ||
                    sourceType === "newspaper" ||
                    sourceType === "video" ||
                    sourceType === "podcast" ||
                    sourceType === "database") && (
                    <>
                      <div>
                        <Label htmlFor="url">URL</Label>
                        <Input
                          id="url"
                          value={citation.url || ""}
                          onChange={(e) => setCitation({ ...citation, url: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="accessDate">Access Date</Label>
                        <Input
                          id="accessDate"
                          type="date"
                          value={citation.accessDate || ""}
                          onChange={(e) => setCitation({ ...citation, accessDate: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={generateCitation}>Generate Citation</Button>
              </CardFooter>
            </Card>

            {formattedCitation && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Citation</CardTitle>
                  <CardDescription>{activeTab.toUpperCase()} format</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="whitespace-pre-wrap">{formattedCitation}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleCopyCitation}>
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button onClick={handleSaveCitation}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Citation
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Saved Citations</CardTitle>
                <CardDescription>Your citation library</CardDescription>
              </CardHeader>
              <CardContent>
                {savedCitations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Quote className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No saved citations</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate and save citations to build your library
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {savedCitations.map((saved) => (
                        <div key={saved.id} className="border rounded-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getSourceTypeIcon(saved.sourceData.sourceType)}
                              {saved.sourceData.sourceType.charAt(0).toUpperCase() +
                                saved.sourceData.sourceType.slice(1)}
                            </Badge>
                            <Badge>{saved.sourceData.style.toUpperCase()}</Badge>
                          </div>
                          <p className="text-sm mb-2 font-medium">{saved.sourceData.title}</p>
                          <p className="text-xs text-muted-foreground mb-3">{saved.formattedCitation}</p>
                          <div className="flex justify-between">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(saved.formattedCitation)
                                      toast({
                                        title: "Citation copied",
                                        description: "The citation has been copied to your clipboard.",
                                      })
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy citation</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSavedCitation(saved.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete citation</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
