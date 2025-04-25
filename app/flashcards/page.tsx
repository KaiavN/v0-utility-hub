"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle, Edit, Trash2, Shuffle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { generateFlashcards } from "@/app/actions/generate-flashcards"

// Types
interface Flashcard {
  id: string
  front: string
  back: string
  deckId: string
}

interface FlashcardDeck {
  id: string
  name: string
  description: string
  isAIGenerated?: boolean
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [newFlashcard, setNewFlashcard] = useState({ front: "", back: "" })
  const [isFlashcardDialogOpen, setIsFlashcardDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingFlashcardId, setEditingFlashcardId] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isShuffled, setIsShuffled] = useState<boolean>(false)
  const [shuffledFlashcards, setShuffledFlashcards] = useState<Flashcard[]>([])
  const [isAddDeckOpen, setIsAddDeckOpen] = useState(false)
  const [newDeck, setNewDeck] = useState({ name: "", description: "" })
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null)
  const [isEditDeckOpen, setIsEditDeckOpen] = useState(false)
  const [showReviewMode, setShowReviewMode] = useState(false)
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([])
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)

  const { toast } = useToast()

  // Load data from localStorage
  useEffect(() => {
    const savedFlashcards = getLocalStorage<Flashcard[]>("flashcards", [])
    const savedDecks = getLocalStorage<FlashcardDeck[]>("flashcardDecks", [])

    setFlashcards(savedFlashcards)
    setDecks(savedDecks)

    // Check if we're coming from the knowledge base page
    const urlParams = new URLSearchParams(window.location.search)
    const fromKnowledgeBase = urlParams.get("fromKnowledgeBase")
    const deckId = urlParams.get("deckId")

    if (savedDecks.length > 0) {
      // If we have a specific deck ID from knowledge base, select it
      if (deckId && savedDecks.some((deck) => deck.id === deckId)) {
        setSelectedDeckId(deckId)

        // If we're coming from knowledge base, show a toast
        if (fromKnowledgeBase === "true") {
          toast({
            title: "Flashcards loaded",
            description: "Your AI-generated flashcards have been loaded.",
          })
        }
      } else {
        // Otherwise select the first deck
        setSelectedDeckId(savedDecks[0].id)
      }
    }
  }, [toast])

  // Check for newly created AI decks
  useEffect(() => {
    // Only run this once when the component mounts
    const hasShownToast = sessionStorage.getItem("hasShownFlashcardToast")

    if (!hasShownToast && decks.length > 0) {
      // Look for AI-generated decks
      const aiGeneratedDecks = decks.filter((deck) => deck.isAIGenerated)

      if (aiGeneratedDecks.length > 0) {
        // Find the most recently created deck (assuming it's at the beginning of the array)
        const latestDeck = aiGeneratedDecks[0]

        // Select this deck
        setSelectedDeckId(latestDeck.id)

        // Show a toast notification
        toast({
          title: "AI-Generated Flashcards",
          description: `Your flashcards from "${latestDeck.name}" have been created and are ready to use.`,
        })

        // Set flag in session storage to prevent showing the toast again on page refresh
        sessionStorage.setItem("hasShownFlashcardToast", "true")
      }
    }
  }, [decks, toast])

  // Save data to localStorage
  const saveFlashcards = (updatedFlashcards: Flashcard[]) => {
    setFlashcards(updatedFlashcards)
    setLocalStorage("flashcards", updatedFlashcards)
  }

  const saveDecks = (updatedDecks: FlashcardDeck[]) => {
    setDecks(updatedDecks)
    setLocalStorage("flashcardDecks", updatedDecks)
  }

  // Add a new flashcard
  const addOrUpdateFlashcard = () => {
    if (!newFlashcard.front || !newFlashcard.back || !selectedDeckId) {
      toast({
        title: "Missing information",
        description: "Please fill in both sides of the flashcard and select a deck.",
        variant: "destructive",
      })
      return
    }

    const flashcard: Flashcard = {
      ...newFlashcard,
      id: editingFlashcardId || crypto.randomUUID(),
      deckId: selectedDeckId,
    }

    if (editingFlashcardId) {
      // Update existing flashcard
      const updatedFlashcards = flashcards.map((fc) => (fc.id === editingFlashcardId ? flashcard : fc))
      saveFlashcards(updatedFlashcards)
      toast({
        title: "Flashcard updated",
        description: "Your flashcard has been updated.",
      })
      setEditingFlashcardId(null)
      setIsEditMode(false)
    } else {
      // Add new flashcard
      const updatedFlashcards = [...flashcards, flashcard]
      saveFlashcards(updatedFlashcards)
      toast({
        title: "Flashcard added",
        description: "Your flashcard has been added to the deck.",
      })
    }

    setNewFlashcard({ front: "", back: "" })
    setIsFlashcardDialogOpen(false)
  }

  // Delete a flashcard
  const deleteFlashcard = (id: string) => {
    const updatedFlashcards = flashcards.filter((flashcard) => flashcard.id !== id)
    saveFlashcards(updatedFlashcards)

    toast({
      title: "Flashcard deleted",
      description: "The flashcard has been removed from the deck.",
    })
  }

  // Edit a flashcard
  const editFlashcard = (id: string) => {
    const flashcard = flashcards.find((fc) => fc.id === id)
    if (!flashcard) return

    setNewFlashcard({ front: flashcard.front, back: flashcard.back })
    setEditingFlashcardId(id)
    setIsFlashcardDialogOpen(true)
    setIsEditMode(true)
  }

  // Add a new deck
  const addOrUpdateDeck = () => {
    if (!newDeck.name) {
      toast({
        title: "Missing information",
        description: "Please provide a name for the deck.",
        variant: "destructive",
      })
      return
    }

    const deck: FlashcardDeck = {
      ...newDeck,
      id: editingDeck?.id || crypto.randomUUID(),
    }

    if (editingDeck) {
      // Update existing deck
      const updatedDecks = decks.map((d) => (d.id === editingDeck.id ? deck : d))
      saveDecks(updatedDecks)
      toast({
        title: "Deck updated",
        description: "Your deck has been updated.",
      })
      setEditingDeck(null)
      setIsEditDeckOpen(false)
    } else {
      // Add new deck
      const deck: FlashcardDeck = {
        ...newDeck,
        id: Date.now().toString(),
      }

      const updatedDecks = [...decks, deck]
      saveDecks(updatedDecks)
      setSelectedDeckId(deck.id)
      toast({
        title: "Deck added",
        description: "Your new deck has been created.",
      })
    }

    setNewDeck({ name: "", description: "" })
    setIsAddDeckOpen(false)
  }

  // Delete a deck
  const deleteDeck = (id: string) => {
    // Check if deck has flashcards
    const deckHasFlashcards = flashcards.some((flashcard) => flashcard.deckId === id)
    if (deckHasFlashcards) {
      toast({
        title: "Deck not empty",
        description: "Please move or delete all flashcards before deleting the deck.",
        variant: "destructive",
      })
      return
    }

    const updatedDecks = decks.filter((deck) => deck.id !== id)
    saveDecks(updatedDecks)

    // If this was the selected deck, clear it
    if (selectedDeckId === id) {
      setSelectedDeckId(null)
    }

    toast({
      title: "Deck deleted",
      description: "The deck has been deleted.",
    })
  }

  // Get flashcards for the selected deck
  const getFlashcardsForSelectedDeck = () => {
    if (!selectedDeckId) return []
    return flashcards.filter((flashcard) => flashcard.deckId === selectedDeckId)
  }

  // Shuffle flashcards
  const shuffleFlashcards = () => {
    const cards = getFlashcardsForSelectedDeck()
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setShuffledFlashcards(shuffled)
    setIsShuffled(true)
    setCurrentCardIndex(0)
  }

  // Reset shuffle
  const resetShuffle = () => {
    setIsShuffled(false)
    setCurrentCardIndex(0)
  }

  // Get the current flashcard
  const getCurrentFlashcard = () => {
    const cards = isShuffled ? shuffledFlashcards : getFlashcardsForSelectedDeck()
    return cards[currentCardIndex]
  }

  // Go to the next flashcard
  const nextCard = () => {
    const cards = isShuffled ? shuffledFlashcards : getFlashcardsForSelectedDeck()
    setCurrentCardIndex((prev) => (prev + 1) % cards.length)
    setShowAnswer(false)
  }

  // Go to the previous flashcard
  const prevCard = () => {
    const cards = isShuffled ? shuffledFlashcards : getFlashcardsForSelectedDeck()
    setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length)
    setShowAnswer(false)
  }

  // Get the current deck
  const getCurrentDeck = () => {
    return decks.find((deck) => deck.id === selectedDeckId)
  }

  const editDeck = () => {
    if (!editingDeck) return

    const updatedDecks = decks.map((deck) => (deck.id === editingDeck.id ? editingDeck : deck))
    saveDecks(updatedDecks)
    setDecks(updatedDecks)
    setEditingDeck(null)
    setIsEditDeckOpen(false)

    toast({
      title: "Deck updated",
      description: "Deck has been successfully updated.",
    })
  }

  // Import flashcards from another source (like AI-generated ones)
  const importFlashcards = (newDeck: FlashcardDeck, newFlashcards: Flashcard[]) => {
    // Add the new deck
    const updatedDecks = [newDeck, ...decks]
    saveDecks(updatedDecks)

    // Add the new flashcards
    const updatedFlashcards = [...flashcards, ...newFlashcards]
    saveFlashcards(updatedFlashcards)

    // Select the new deck
    setSelectedDeckId(newDeck.id)

    toast({
      title: "Flashcards imported",
      description: `Imported ${newFlashcards.length} flashcards into deck "${newDeck.name}"`,
    })
  }

  const handleCreateFlashcardsFromNote = async () => {
    if (!getCurrentDeck) return

    // Use the hook's setter to set this to True while the API is generating flashcards
    setIsGeneratingFlashcards(true)

    // Show loading toast
    toast({
      title: "Generating flashcards",
      description: "Creating flashcards from your note...",
    })

    try {
      // Call the API to generate flashcards
      const response = await generateFlashcards("test", "test")

      if (!response.success) {
        throw new Error(response.error)
      }

      // Load existing flashcard data
      const savedFlashcards = getLocalStorage("flashcards", [])
      const savedDecks = getLocalStorage("flashcardDecks", [])

      // Create a new deck with a unique ID
      const deckId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
      const newDeck = {
        id: deckId,
        name: "test",
        description: `Generated from "test" note`,
        isAIGenerated: true,
      }

      // Create flashcards and add them to the new deck
      const newFlashcards = response.flashcards.map((card) => ({
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
        description: `Created ${newFlashcards.length} flashcards from this note.`,
      })
    } catch (error) {
      console.error("Error generating flashcards:", error)
      toast({
        title: "Failed to generate flashcards",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      // Set this back to False when flashcards are done generating
      setIsGeneratingFlashcards(false)
    }
  }

  const toggleFlipped = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isAddDeckOpen} onOpenChange={setIsAddDeckOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Deck
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Deck</DialogTitle>
                <DialogDescription>Create a new deck to organize your flashcards.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="deckName">Deck Name</Label>
                  <Input
                    id="deckName"
                    value={newDeck.name}
                    onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                    placeholder="e.g., History, Vocabulary"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deckDescription">Description (optional)</Label>
                  <Input
                    id="deckDescription"
                    value={newDeck.description}
                    onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
                    placeholder="A brief description of the deck"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDeckOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addOrUpdateDeck}>Create Deck</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Decks</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setIsAddDeckOpen(true)}>
                  <PlusCircle className="mr-2 h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {decks.length === 0 ? (
                <p className="text-muted-foreground">No decks created yet</p>
              ) : (
                decks.map((deck) => (
                  <div
                    key={deck.id}
                    className={`flex items-center justify-between rounded-md p-2 hover:bg-muted cursor-pointer ${
                      selectedDeckId === deck.id ? "bg-secondary" : ""
                    }`}
                    onClick={() => {
                      setSelectedDeckId(deck.id)
                      resetShuffle()
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">{deck.name}</span>
                      {(deck.isAIGenerated || deck.description?.includes("Generated")) && (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingDeck(deck)
                          setIsEditDeckOpen(true)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteDeck(deck.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Flashcard Area */}
        <div className="md:col-span-3">
          {selectedDeckId ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{getCurrentDeck()?.name || "Selected Deck"}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={shuffleFlashcards} disabled={isShuffled}>
                        <Shuffle className="mr-2 h-3 w-3" />
                        Shuffle
                      </Button>
                      <Button variant="outline" size="sm" onClick={resetShuffle} disabled={!isShuffled}>
                        Reset
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsFlashcardDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-3 w-3" />
                        Add Card
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{getCurrentDeck()?.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  {getFlashcardsForSelectedDeck().length === 0 ? (
                    <div className="flex h-48 items-center justify-center text-center">
                      <p className="text-muted-foreground">No flashcards in this deck yet</p>
                    </div>
                  ) : (
                    <>
                      <div className="absolute top-2 right-2 text-sm text-muted-foreground">
                        {currentCardIndex + 1} / {getFlashcardsForSelectedDeck().length}
                      </div>
                      <div
                        className={`flip-card min-h-[200px] flex items-center justify-center rounded-md border p-4 text-center cursor-pointer ${isFlipped ? "flipped" : ""}`}
                        onClick={toggleFlipped}
                      >
                        <div className="flip-card-inner">
                          <div className="flip-card-front">{getCurrentFlashcard()?.front}</div>
                          <div className="flip-card-back">{getCurrentFlashcard()?.back}</div>
                        </div>
                      </div>
                      <div className="flex justify-between mt-4">
                        <Button variant="ghost" size="sm" onClick={prevCard}>
                          Previous
                        </Button>
                        <Button variant="ghost" size="sm" onClick={nextCard}>
                          Next
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full transition-transform duration-300 transform-style-preserve-3d">
              <CardContent className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium">Select a Deck</h3>
                <p className="text-sm text-muted-foreground">Choose a deck to view flashcards</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Flashcard Dialog */}
      <Dialog open={isFlashcardDialogOpen} onOpenChange={setIsFlashcardDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Flashcard</DialogTitle>
            <DialogDescription>Create a new flashcard for the selected deck.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="front">Front</Label>
              <Textarea
                id="front"
                value={newFlashcard.front}
                onChange={(e) => setNewFlashcard({ ...newFlashcard, front: e.target.value })}
                placeholder="Front side of the flashcard"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="back">Back</Label>
              <Textarea
                id="back"
                value={newFlashcard.back}
                onChange={(e) => setNewFlashcard({ ...newFlashcard, back: e.target.value })}
                placeholder="Back side of the flashcard"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFlashcardDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addOrUpdateFlashcard}>Add Flashcard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deck Dialog */}
      <Dialog open={isEditDeckOpen} onOpenChange={(open) => !open && setEditingDeck(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Deck</DialogTitle>
            <DialogDescription>Update the details of your deck.</DialogDescription>
          </DialogHeader>
          {editingDeck && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-deckName">Deck Name</Label>
                <Input
                  id="edit-deckName"
                  value={editingDeck.name}
                  onChange={(e) => setEditingDeck({ ...editingDeck, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-deckDescription">Description (optional)</Label>
                <Input
                  id="edit-deckDescription"
                  value={editingDeck.description}
                  onChange={(e) => setEditingDeck({ ...editingDeck, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDeck(null)}>
              Cancel
            </Button>
            <Button onClick={addOrUpdateDeck}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
