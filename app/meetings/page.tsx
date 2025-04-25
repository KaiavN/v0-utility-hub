"use client"

import { useState, useEffect } from "react"
import { RoleGuard } from "@/components/role-guard"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { PlusCircle, Trash2, Edit, Calendar, Users, Search, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Types
interface ActionItem {
  id: string
  meetingId: string
  description: string
  assignee: string
  dueDate: string
  completed: boolean
  createdAt: string
}

interface Meeting {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  participants: string[]
  agenda: string
  notes: string
  actionItems: ActionItem[]
  createdAt: string
  updatedAt: string
}

// Ensure meeting object has all required properties with defaults
const ensureValidMeeting = (meeting: any): Meeting => {
  if (!meeting) return createEmptyMeeting()

  return {
    id: meeting.id || crypto.randomUUID(),
    title: meeting.title || "",
    date: meeting.date || new Date().toISOString().split("T")[0],
    startTime: meeting.startTime || "",
    endTime: meeting.endTime || "",
    location: meeting.location || "",
    participants: Array.isArray(meeting.participants) ? meeting.participants : [],
    agenda: meeting.agenda || "",
    notes: meeting.notes || "",
    actionItems: Array.isArray(meeting.actionItems) ? meeting.actionItems.map(ensureValidActionItem) : [],
    createdAt: meeting.createdAt || new Date().toISOString(),
    updatedAt: meeting.updatedAt || new Date().toISOString(),
  }
}

// Ensure action item has all required properties with defaults
const ensureValidActionItem = (item: any): ActionItem => {
  if (!item) return createEmptyActionItem("")

  return {
    id: item.id || crypto.randomUUID(),
    meetingId: item.meetingId || "",
    description: item.description || "",
    assignee: item.assignee || "",
    dueDate: item.dueDate || "",
    completed: typeof item.completed === "boolean" ? item.completed : false,
    createdAt: item.createdAt || new Date().toISOString(),
  }
}

// Create an empty meeting object
const createEmptyMeeting = (): Meeting => ({
  id: crypto.randomUUID(),
  title: "",
  date: new Date().toISOString().split("T")[0],
  startTime: "",
  endTime: "",
  location: "",
  participants: [],
  agenda: "",
  notes: "",
  actionItems: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

// Create an empty action item
const createEmptyActionItem = (meetingId: string): ActionItem => ({
  id: crypto.randomUUID(),
  meetingId,
  description: "",
  assignee: "",
  dueDate: "",
  completed: false,
  createdAt: new Date().toISOString(),
})

export default function MeetingsPage() {
  // State
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null)
  const [isNewMeetingDialogOpen, setIsNewMeetingDialogOpen] = useState(false)
  const [isNewActionItemDialogOpen, setIsNewActionItemDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newMeeting, setNewMeeting] = useState<Omit<Meeting, "id" | "actionItems" | "createdAt" | "updatedAt">>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    location: "",
    participants: [],
    agenda: "",
    notes: "",
  })

  const [newParticipant, setNewParticipant] = useState("")

  const [newActionItem, setNewActionItem] = useState<Omit<ActionItem, "id" | "meetingId" | "createdAt">>({
    description: "",
    assignee: "",
    dueDate: "",
    completed: false,
  })

  // Load data from localStorage
  useEffect(() => {
    try {
      setIsLoading(true)
      let savedMeetings = getLocalStorage<any[]>("meetings", [])

      // Validate and fix each meeting object
      if (!Array.isArray(savedMeetings)) {
        console.error("Invalid meetings data format:", savedMeetings)
        savedMeetings = []
      }

      // Ensure each meeting has all required properties
      const validatedMeetings = savedMeetings.map(ensureValidMeeting)
      setMeetings(validatedMeetings)

      if (validatedMeetings.length > 0 && !activeMeeting) {
        setActiveMeeting(validatedMeetings[0])
      }

      setError(null)
    } catch (err) {
      console.error("Error loading meetings:", err)
      setError("Failed to load meetings data. Please try refreshing the page.")
      setMeetings([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    if (meetings && meetings.length > 0) {
      try {
        setLocalStorage("meetings", meetings)
      } catch (err) {
        console.error("Error saving meetings:", err)
      }
    }
  }, [meetings])

  // Create new meeting
  const createMeeting = () => {
    if (!newMeeting.title || !newMeeting.date) return

    try {
      const now = new Date().toISOString()
      const meeting: Meeting = {
        ...newMeeting,
        id: crypto.randomUUID(),
        actionItems: [],
        createdAt: now,
        updatedAt: now,
      }

      // Validate the meeting object
      const validMeeting = ensureValidMeeting(meeting)
      const updatedMeetings = [...meetings, validMeeting]
      setMeetings(updatedMeetings)
      setActiveMeeting(validMeeting)
      setIsNewMeetingDialogOpen(false)
      resetNewMeeting()
    } catch (err) {
      console.error("Error creating meeting:", err)
      setError("Failed to create meeting. Please try again.")
    }
  }

  // Update meeting
  const updateMeeting = () => {
    if (!activeMeeting || !activeMeeting.title) return

    try {
      const updatedMeeting = {
        ...activeMeeting,
        updatedAt: new Date().toISOString(),
      }

      // Validate the updated meeting
      const validMeeting = ensureValidMeeting(updatedMeeting)

      const updatedMeetings = meetings.map((m) => (m.id === validMeeting.id ? validMeeting : m))

      setMeetings(updatedMeetings)
      setActiveMeeting(validMeeting)
      setIsEditMode(false)
    } catch (err) {
      console.error("Error updating meeting:", err)
      setError("Failed to update meeting. Please try again.")
    }
  }

  // Delete meeting
  const deleteMeeting = (id: string) => {
    try {
      if (!id) return

      const updatedMeetings = meetings.filter((m) => m.id !== id)
      setMeetings(updatedMeetings)

      if (activeMeeting?.id === id) {
        setActiveMeeting(updatedMeetings.length > 0 ? updatedMeetings[0] : null)
      }
    } catch (err) {
      console.error("Error deleting meeting:", err)
      setError("Failed to delete meeting. Please try again.")
    }
  }

  // Add participant to meeting
  const addParticipant = () => {
    if (!newParticipant) return

    try {
      // Ensure participants is an array
      const currentParticipants = Array.isArray(newMeeting.participants) ? newMeeting.participants : []

      setNewMeeting({
        ...newMeeting,
        participants: [...currentParticipants, newParticipant],
      })

      setNewParticipant("")
    } catch (err) {
      console.error("Error adding participant:", err)
    }
  }

  // Remove participant from meeting
  const removeParticipant = (participant: string) => {
    try {
      // Ensure participants is an array
      const currentParticipants = Array.isArray(newMeeting.participants) ? newMeeting.participants : []

      setNewMeeting({
        ...newMeeting,
        participants: currentParticipants.filter((p) => p !== participant),
      })
    } catch (err) {
      console.error("Error removing participant:", err)
    }
  }

  // Add action item to meeting
  const addActionItem = () => {
    if (!activeMeeting || !newActionItem.description || !newActionItem.assignee) return

    try {
      const actionItem: ActionItem = {
        ...newActionItem,
        id: crypto.randomUUID(),
        meetingId: activeMeeting.id,
        createdAt: new Date().toISOString(),
      }

      // Ensure actionItems is an array
      const currentActionItems = Array.isArray(activeMeeting.actionItems) ? activeMeeting.actionItems : []

      const updatedMeeting = {
        ...activeMeeting,
        actionItems: [...currentActionItems, actionItem],
        updatedAt: new Date().toISOString(),
      }

      // Validate the updated meeting
      const validMeeting = ensureValidMeeting(updatedMeeting)

      const updatedMeetings = meetings.map((m) => (m.id === validMeeting.id ? validMeeting : m))

      setMeetings(updatedMeetings)
      setActiveMeeting(validMeeting)
      setIsNewActionItemDialogOpen(false)
      resetNewActionItem()
    } catch (err) {
      console.error("Error adding action item:", err)
      setError("Failed to add action item. Please try again.")
    }
  }

  // Toggle action item completion
  const toggleActionItemCompletion = (actionItemId: string) => {
    if (!activeMeeting) return

    try {
      // Ensure actionItems is an array
      const currentActionItems = Array.isArray(activeMeeting.actionItems) ? activeMeeting.actionItems : []

      if (currentActionItems.length === 0) return

      const updatedActionItems = currentActionItems.map((item) =>
        item.id === actionItemId ? { ...item, completed: !item.completed } : item,
      )

      const updatedMeeting = {
        ...activeMeeting,
        actionItems: updatedActionItems,
        updatedAt: new Date().toISOString(),
      }

      // Validate the updated meeting
      const validMeeting = ensureValidMeeting(updatedMeeting)

      const updatedMeetings = meetings.map((m) => (m.id === validMeeting.id ? validMeeting : m))

      setMeetings(updatedMeetings)
      setActiveMeeting(validMeeting)
    } catch (err) {
      console.error("Error toggling action item completion:", err)
    }
  }

  // Delete action item
  const deleteActionItem = (actionItemId: string) => {
    if (!activeMeeting) return

    try {
      // Ensure actionItems is an array
      const currentActionItems = Array.isArray(activeMeeting.actionItems) ? activeMeeting.actionItems : []

      if (currentActionItems.length === 0) return

      const updatedActionItems = currentActionItems.filter((item) => item.id !== actionItemId)

      const updatedMeeting = {
        ...activeMeeting,
        actionItems: updatedActionItems,
        updatedAt: new Date().toISOString(),
      }

      // Validate the updated meeting
      const validMeeting = ensureValidMeeting(updatedMeeting)

      const updatedMeetings = meetings.map((m) => (m.id === validMeeting.id ? validMeeting : m))

      setMeetings(updatedMeetings)
      setActiveMeeting(validMeeting)
    } catch (err) {
      console.error("Error deleting action item:", err)
    }
  }

  // Reset form states
  const resetNewMeeting = () => {
    setNewMeeting({
      title: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      location: "",
      participants: [],
      agenda: "",
      notes: "",
    })
    setNewParticipant("")
  }

  const resetNewActionItem = () => {
    setNewActionItem({
      description: "",
      assignee: "",
      dueDate: "",
      completed: false,
    })
  }

  // Filter meetings by search query
  const filteredMeetings = Array.isArray(meetings)
    ? meetings.filter(
        (meeting) =>
          meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (Array.isArray(meeting.participants) &&
            meeting.participants.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))) ||
          meeting.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : []

  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return ""

    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (err) {
      console.error("Error formatting date:", err)
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""

    try {
      const [hours, minutes] = timeString.split(":")
      const date = new Date()
      date.setHours(Number.parseInt(hours, 10))
      date.setMinutes(Number.parseInt(minutes, 10))

      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    } catch (error) {
      console.error("Error formatting time:", error)
      return timeString
    }
  }

  const getDaysAgo = (dateString: string) => {
    if (!dateString) return ""

    try {
      const date = new Date(dateString)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const diffTime = today.getTime() - date.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return "Today"
      if (diffDays === 1) return "Yesterday"
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return formatDate(dateString)
    } catch (err) {
      console.error("Error calculating days ago:", err)
      return formatDate(dateString)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading meetings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["professional"]}>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Meeting Notes</h1>
            <p className="text-muted-foreground">Organize meeting notes and action items</p>
          </div>
          <Dialog open={isNewMeetingDialogOpen} onOpenChange={setIsNewMeetingDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Meeting</DialogTitle>
                <DialogDescription>Add details for your new meeting.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    placeholder="Enter meeting title"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newMeeting.startTime}
                      onChange={(e) => setNewMeeting({ ...newMeeting, startTime: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newMeeting.endTime}
                      onChange={(e) => setNewMeeting({ ...newMeeting, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                    placeholder="Enter meeting location or link"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participants">Participants</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="participants"
                      value={newParticipant}
                      onChange={(e) => setNewParticipant(e.target.value)}
                      placeholder="Add participant name or email"
                    />
                    <Button type="button" onClick={addParticipant}>
                      Add
                    </Button>
                  </div>

                  {Array.isArray(newMeeting.participants) && newMeeting.participants.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newMeeting.participants.map((participant, index) => (
                        <Badge key={`${participant}-${index}`} variant="secondary" className="flex items-center gap-1">
                          {participant}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeParticipant(participant)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agenda">Agenda</Label>
                  <Textarea
                    id="agenda"
                    value={newMeeting.agenda}
                    onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                    placeholder="Enter meeting agenda items"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewMeetingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createMeeting}>Create Meeting</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search meetings..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {!Array.isArray(meetings) || meetings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-3">
                <h3 className="text-lg font-medium">No meetings yet</h3>
                <p className="text-muted-foreground">Create your first meeting to get started.</p>
                <Button onClick={() => setIsNewMeetingDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meetings</CardTitle>
                  <CardDescription>Your meeting notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredMeetings.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No meetings match your search.</p>
                    ) : (
                      filteredMeetings
                        .sort((a, b) => {
                          try {
                            return new Date(b.date).getTime() - new Date(a.date).getTime()
                          } catch (err) {
                            return 0
                          }
                        })
                        .map((meeting) => (
                          <div
                            key={meeting.id}
                            className={`p-3 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                              activeMeeting?.id === meeting.id ? "bg-muted" : ""
                            }`}
                            onClick={() => setActiveMeeting(ensureValidMeeting(meeting))}
                          >
                            <h3 className="font-medium">{meeting.title || "Untitled Meeting"}</h3>
                            <div className="flex items-center mt-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formatDate(meeting.date)}</span>
                              {meeting.startTime && meeting.endTime && (
                                <span>
                                  {" "}
                                  • {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                                </span>
                              )}
                            </div>
                            {Array.isArray(meeting.participants) && meeting.participants.length > 0 && (
                              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                <Users className="h-3 w-3 mr-1" />
                                <span>{meeting.participants.length} participants</span>
                              </div>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              {activeMeeting ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{activeMeeting.title || "Untitled Meeting"}</CardTitle>
                        <CardDescription>
                          {formatDate(activeMeeting.date)}
                          {activeMeeting.startTime && activeMeeting.endTime && (
                            <span>
                              {" "}
                              • {formatTime(activeMeeting.startTime)} - {formatTime(activeMeeting.endTime)}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isEditMode ? (
                          <>
                            <Button variant="outline" onClick={() => setIsEditMode(false)}>
                              Cancel
                            </Button>
                            <Button onClick={updateMeeting}>Save</Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="icon" onClick={() => setIsEditMode(true)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => deleteMeeting(activeMeeting.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="notes">
                      <TabsList className="mb-4">
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="action-items">Action Items</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                      </TabsList>

                      <TabsContent value="notes">
                        <div className="space-y-4">
                          {activeMeeting.agenda && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium text-muted-foreground">Agenda</h3>
                              {isEditMode ? (
                                <Textarea
                                  value={activeMeeting.agenda}
                                  onChange={(e) =>
                                    setActiveMeeting({
                                      ...activeMeeting,
                                      agenda: e.target.value,
                                    })
                                  }
                                  placeholder="Enter meeting agenda"
                                  className="min-h-[100px]"
                                />
                              ) : (
                                <div className="p-4 border rounded-md whitespace-pre-line">{activeMeeting.agenda}</div>
                              )}
                            </div>
                          )}

                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Meeting Notes</h3>
                            {isEditMode ? (
                              <Textarea
                                value={activeMeeting.notes || ""}
                                onChange={(e) =>
                                  setActiveMeeting({
                                    ...activeMeeting,
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="Enter meeting notes"
                                className="min-h-[300px]"
                              />
                            ) : (
                              <div className="p-4 border rounded-md min-h-[300px] whitespace-pre-line">
                                {activeMeeting.notes || "No notes recorded for this meeting yet."}
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="action-items">
                        <div className="space-y-4">
                          <Dialog open={isNewActionItemDialogOpen} onOpenChange={setIsNewActionItemDialogOpen}>
                            <DialogTrigger asChild>
                              <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Action Item
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Action Item</DialogTitle>
                                <DialogDescription>Add a new action item from this meeting.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="description">Description</Label>
                                  <Input
                                    id="description"
                                    value={newActionItem.description}
                                    onChange={(e) =>
                                      setNewActionItem({ ...newActionItem, description: e.target.value })
                                    }
                                    placeholder="What needs to be done?"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="assignee">Assignee</Label>
                                  <Select
                                    value={newActionItem.assignee}
                                    onValueChange={(value) => setNewActionItem({ ...newActionItem, assignee: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Who is responsible?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.isArray(activeMeeting.participants) &&
                                        activeMeeting.participants.map((participant, index) => (
                                          <SelectItem key={`${participant}-${index}`} value={participant}>
                                            {participant}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="dueDate">Due Date</Label>
                                  <Input
                                    id="dueDate"
                                    type="date"
                                    value={newActionItem.dueDate}
                                    onChange={(e) => setNewActionItem({ ...newActionItem, dueDate: e.target.value })}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNewActionItemDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={addActionItem}>Add Action Item</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {!Array.isArray(activeMeeting.actionItems) || activeMeeting.actionItems.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No action items yet. Add some action items to track follow-ups.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {activeMeeting.actionItems
                                .sort((a, b) => {
                                  try {
                                    // Sort by completion status first, then by due date
                                    if (a.completed !== b.completed) {
                                      return a.completed ? 1 : -1
                                    }

                                    if (!a.dueDate && !b.dueDate) return 0
                                    if (!a.dueDate) return 1
                                    if (!b.dueDate) return -1

                                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                                  } catch (err) {
                                    console.error("Error sorting action items:", err)
                                    return 0
                                  }
                                })
                                .map((item) => (
                                  <Card key={item.id || `item-${Math.random()}`}>
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                          <div
                                            className={`mt-1 cursor-pointer ${item.completed ? "text-green-500" : "text-muted-foreground"}`}
                                            onClick={() => toggleActionItemCompletion(item.id)}
                                          >
                                            <CheckCircle className="h-5 w-5" />
                                          </div>
                                          <div className="space-y-1">
                                            <p
                                              className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}
                                            >
                                              {item.description || "No description"}
                                            </p>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                              <span>Assigned to: {item.assignee || "Unassigned"}</span>
                                              {item.dueDate && (
                                                <span className="ml-3">Due: {formatDate(item.dueDate)}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => deleteActionItem(item.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="details">
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                            {isEditMode ? (
                              <Input
                                value={activeMeeting.location || ""}
                                onChange={(e) =>
                                  setActiveMeeting({
                                    ...activeMeeting,
                                    location: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <p>{activeMeeting.location || "No location specified"}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Date & Time</h3>
                            {isEditMode ? (
                              <div className="grid grid-cols-3 gap-4">
                                <Input
                                  type="date"
                                  value={activeMeeting.date || ""}
                                  onChange={(e) =>
                                    setActiveMeeting({
                                      ...activeMeeting,
                                      date: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  type="time"
                                  value={activeMeeting.startTime || ""}
                                  onChange={(e) =>
                                    setActiveMeeting({
                                      ...activeMeeting,
                                      startTime: e.target.value,
                                    })
                                  }
                                />
                                <Input
                                  type="time"
                                  value={activeMeeting.endTime || ""}
                                  onChange={(e) =>
                                    setActiveMeeting({
                                      ...activeMeeting,
                                      endTime: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            ) : (
                              <p>
                                {formatDate(activeMeeting.date)}
                                {activeMeeting.startTime && activeMeeting.endTime && (
                                  <span>
                                    {" "}
                                    • {formatTime(activeMeeting.startTime)} - {formatTime(activeMeeting.endTime)}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Participants</h3>
                            {isEditMode ? (
                              <div className="space-y-2">
                                <div className="flex space-x-2">
                                  <Input
                                    value={newParticipant}
                                    onChange={(e) => setNewParticipant(e.target.value)}
                                    placeholder="Add participant name or email"
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      if (!newParticipant) return

                                      // Ensure participants is an array
                                      const currentParticipants = Array.isArray(activeMeeting.participants)
                                        ? activeMeeting.participants
                                        : []

                                      setActiveMeeting({
                                        ...activeMeeting,
                                        participants: [...currentParticipants, newParticipant],
                                      })
                                      setNewParticipant("")
                                    }}
                                  >
                                    Add
                                  </Button>
                                </div>

                                {Array.isArray(activeMeeting.participants) && activeMeeting.participants.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {activeMeeting.participants.map((participant, index) => (
                                      <Badge
                                        key={`${participant}-${index}`}
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                      >
                                        {participant}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-4 w-4 p-0 hover:bg-transparent"
                                          onClick={() => {
                                            setActiveMeeting({
                                              ...activeMeeting,
                                              participants: activeMeeting.participants.filter((p) => p !== participant),
                                            })
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p>
                                {Array.isArray(activeMeeting.participants) && activeMeeting.participants.length > 0
                                  ? activeMeeting.participants.join(", ")
                                  : "No participants specified"}
                              </p>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div>Created: {formatDate(activeMeeting.createdAt)}</div>
                      <div>Updated: {formatDate(activeMeeting.updatedAt)}</div>
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Select a meeting to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
