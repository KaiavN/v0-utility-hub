"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, BookOpen, Star, Sparkles, ArrowRight, CheckCircle } from "lucide-react"
import { tutorials, type Tutorial } from "@/lib/tutorial-data"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { useRouter } from "next/navigation"

interface TutorialManagerProps {
  onClose?: () => void
}

export function TutorialManager({ onClose }: TutorialManagerProps) {
  const [open, setOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([])
  const [showInteractiveTutorial, setShowInteractiveTutorial] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Load completed tutorials from local storage
    const completed = getLocalStorage<string[]>("completed-tutorials", [])
    setCompletedTutorials(completed)
  }, [])

  // Handle dialog close
  useEffect(() => {
    if (!open && onClose && !showInteractiveTutorial) {
      onClose()
    }
  }, [open, onClose, showInteractiveTutorial])

  const handleClose = () => {
    setOpen(false)
  }

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesSearch =
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "completed") return matchesSearch && completedTutorials.includes(tutorial.id)
    if (activeTab === "incomplete") return matchesSearch && !completedTutorials.includes(tutorial.id)
    return matchesSearch && tutorial.category === activeTab
  })

  const startTutorial = (tutorial: Tutorial) => {
    // Dispatch a custom event to start the tutorial
    // This allows the tutorial to be started from anywhere in the app
    const event = new CustomEvent("start-tutorial", {
      detail: { tutorialId: tutorial.id },
    })
    window.dispatchEvent(event)

    // Close the dialog
    setOpen(false)

    // Call onClose if provided
    if (onClose) {
      onClose()
    }
  }

  const handleTutorialComplete = () => {
    if (selectedTutorial) {
      // Mark tutorial as completed
      const newCompleted = [...completedTutorials]
      if (!newCompleted.includes(selectedTutorial.id)) {
        newCompleted.push(selectedTutorial.id)
        setLocalStorage("completed-tutorials", newCompleted)
        setCompletedTutorials(newCompleted)
      }
    }
    setShowInteractiveTutorial(false)
    setSelectedTutorial(null)

    // If onClose exists, call it after the tutorial is completed
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Tutorial Browser
            </DialogTitle>
            <DialogDescription>
              Browse and start interactive tutorials to learn how to use all features of the application.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search tutorials..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 mt-4">
              <ScrollArea className="h-[50vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                  {filteredTutorials.length > 0 ? (
                    filteredTutorials.map((tutorial) => (
                      <Card key={tutorial.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                            {completedTutorials.includes(tutorial.id) && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <CardDescription>{tutorial.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            <span>{tutorial.steps.length} steps</span>
                            {tutorial.estimatedTime && (
                              <>
                                <span>•</span>
                                <span>{tutorial.estimatedTime}</span>
                              </>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            onClick={() => startTutorial(tutorial)}
                            className="w-full"
                            variant={completedTutorials.includes(tutorial.id) ? "outline" : "default"}
                          >
                            {completedTutorials.includes(tutorial.id) ? "Review Tutorial" : "Start Tutorial"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <Star className="h-12 w-12 mb-4 opacity-20" />
                      <h3 className="text-lg font-medium">No tutorials found</h3>
                      <p className="max-w-md">Try adjusting your search or filter to find tutorials.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
