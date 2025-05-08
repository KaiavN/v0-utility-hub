"use client"

import { useState, useEffect } from "react"
import { Mail, Phone, MapPin, Briefcase, Search, Plus, Edit, Trash2, Copy, BookUser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Contact {
  id: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  company?: string
  jobTitle?: string
  notes?: string
  group?: string
  favorite: boolean
  createdAt: string
  avatarUrl?: string
}

const defaultGroups = ["Family", "Friends", "Work", "Other"]

export default function ContactsPage() {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [newContact, setNewContact] = useState<Omit<Contact, "id" | "createdAt" | "favorite">>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    jobTitle: "",
    notes: "",
    group: "Other",
  })
  const [groups, setGroups] = useState<string[]>(defaultGroups)
  const [newGroup, setNewGroup] = useState("")
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Load contacts and groups from localStorage
  useEffect(() => {
    try {
      setIsLoading(true)
      setHasError(false)

      const savedContacts = getLocalStorage<Contact[]>("contacts", [])
      const savedGroups = getLocalStorage<string[]>("contactGroups", defaultGroups)

      // Ensure contacts is always an array
      setContacts(Array.isArray(savedContacts) ? savedContacts : [])
      setGroups(Array.isArray(savedGroups) ? savedGroups : defaultGroups)
    } catch (error) {
      console.error("Error loading contacts:", error)
      setHasError(true)
      setContacts([])
      setGroups(defaultGroups)

      toast({
        title: "Error loading contacts",
        description: "There was a problem loading your contacts. Default values have been used.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const saveContacts = (updatedContacts: Contact[]) => {
    try {
      // Ensure we're saving a valid array
      if (!Array.isArray(updatedContacts)) {
        console.error("Attempted to save invalid contacts data:", updatedContacts)
        toast({
          title: "Error saving contacts",
          description: "Invalid data format. Changes were not saved.",
          variant: "destructive",
        })
        return
      }

      setContacts(updatedContacts)
      setLocalStorage("contacts", updatedContacts)
    } catch (error) {
      console.error("Error saving contacts:", error)
      toast({
        title: "Error saving contacts",
        description: "There was a problem saving your contacts.",
        variant: "destructive",
      })
    }
  }

  const saveGroups = (updatedGroups: string[]) => {
    try {
      // Ensure we're saving a valid array
      if (!Array.isArray(updatedGroups)) {
        console.error("Attempted to save invalid groups data:", updatedGroups)
        toast({
          title: "Error saving groups",
          description: "Invalid data format. Changes were not saved.",
          variant: "destructive",
        })
        return
      }

      setGroups(updatedGroups)
      setLocalStorage("contactGroups", updatedGroups)
    } catch (error) {
      console.error("Error saving groups:", error)
      toast({
        title: "Error saving groups",
        description: "There was a problem saving your contact groups.",
        variant: "destructive",
      })
    }
  }

  const addContact = () => {
    if (!newContact.firstName) {
      toast({
        title: "Missing information",
        description: "First name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const contact: Contact = {
        ...newContact,
        lastName: newContact.lastName || "", // Ensure lastName is never undefined
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        favorite: false,
      }

      const updatedContacts = [...contacts, contact]
      saveContacts(updatedContacts)

      setNewContact({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        company: "",
        jobTitle: "",
        notes: "",
        group: "Other",
      })

      setIsAddDialogOpen(false)

      toast({
        title: "Contact added",
        description: "The contact has been added to your address book.",
      })
    } catch (error) {
      console.error("Error adding contact:", error)
      toast({
        title: "Error adding contact",
        description: "There was a problem adding the contact.",
        variant: "destructive",
      })
    }
  }

  const updateContact = () => {
    if (!editingContact) return

    if (!editingContact.firstName) {
      toast({
        title: "Missing information",
        description: "First name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      // Ensure lastName is never undefined
      const updatedEditingContact = {
        ...editingContact,
        lastName: editingContact.lastName || "",
      }

      const updatedContacts = contacts.map((contact) =>
        contact.id === updatedEditingContact.id ? updatedEditingContact : contact,
      )

      saveContacts(updatedContacts)
      setEditingContact(null)

      // If this is the selected contact, update it
      if (selectedContact?.id === editingContact.id) {
        setSelectedContact(editingContact)
      }

      toast({
        title: "Contact updated",
        description: "The contact information has been updated.",
      })
    } catch (error) {
      console.error("Error updating contact:", error)
      toast({
        title: "Error updating contact",
        description: "There was a problem updating the contact.",
        variant: "destructive",
      })
    }
  }

  const deleteContact = (id: string) => {
    try {
      const updatedContacts = contacts.filter((contact) => contact.id !== id)
      saveContacts(updatedContacts)

      if (selectedContact?.id === id) {
        setSelectedContact(null)
        setIsDetailsOpen(false)
      }

      toast({
        title: "Contact deleted",
        description: "The contact has been deleted from your address book.",
      })
    } catch (error) {
      console.error("Error deleting contact:", error)
      toast({
        title: "Error deleting contact",
        description: "There was a problem deleting the contact.",
        variant: "destructive",
      })
    }
  }

  const toggleFavorite = (id: string) => {
    try {
      const updatedContacts = contacts.map((contact) =>
        contact.id === id ? { ...contact, favorite: !contact.favorite } : contact,
      )

      saveContacts(updatedContacts)

      // If this is the selected contact, update it
      if (selectedContact?.id === id) {
        const updatedContact = updatedContacts.find((c) => c.id === id)
        if (updatedContact) {
          setSelectedContact(updatedContact)
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        title: "Error updating contact",
        description: "There was a problem updating the contact's favorite status.",
        variant: "destructive",
      })
    }
  }

  const addGroup = () => {
    if (!newGroup.trim()) {
      toast({
        title: "Group name required",
        description: "Please provide a name for the new group.",
        variant: "destructive",
      })
      return
    }

    if (groups.includes(newGroup)) {
      toast({
        title: "Group already exists",
        description: "This group name already exists.",
        variant: "destructive",
      })
      return
    }

    try {
      const updatedGroups = [...groups, newGroup]
      saveGroups(updatedGroups)

      setNewGroup("")
      setIsGroupDialogOpen(false)

      toast({
        title: "Group added",
        description: "The new contact group has been created.",
      })
    } catch (error) {
      console.error("Error adding group:", error)
      toast({
        title: "Error adding group",
        description: "There was a problem adding the group.",
        variant: "destructive",
      })
    }
  }

  const deleteGroup = (group: string) => {
    try {
      if (contacts.some((contact) => contact.group === group)) {
        toast({
          title: "Cannot delete group",
          description: "This group contains contacts. Move or delete those contacts first.",
          variant: "destructive",
        })
        return
      }

      const updatedGroups = groups.filter((g) => g !== group)
      saveGroups(updatedGroups)

      if (activeGroup === group) {
        setActiveGroup(null)
      }

      toast({
        title: "Group deleted",
        description: "The contact group has been deleted.",
      })
    } catch (error) {
      console.error("Error deleting group:", error)
      toast({
        title: "Error deleting group",
        description: "There was a problem deleting the group.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string, type: string) => {
    try {
      navigator.clipboard.writeText(text)

      toast({
        title: `${type} copied`,
        description: `The ${type.toLowerCase()} has been copied to clipboard.`,
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Copy failed",
        description: "There was a problem copying to the clipboard.",
        variant: "destructive",
      })
    }
  }

  // Filter contacts based on search query and active group
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      `${contact.firstName} ${contact.lastName || ""}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesGroup = !activeGroup || (activeGroup === "favorite" ? contact.favorite : contact.group === activeGroup)

    return matchesSearch && matchesGroup
  })

  // Sort contacts: first by favorite, then by last name
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return a.favorite ? -1 : 1
    }

    return `${a.lastName || ""} ${a.firstName}`.localeCompare(`${b.lastName || ""} ${b.firstName}`)
  })

  // Group contacts by first letter of last name for list view
  const groupedContacts = sortedContacts.reduce(
    (acc, contact) => {
      // Add null check for lastName
      const lastName = contact.lastName || ""
      const firstLetter = lastName.length > 0 ? lastName[0].toUpperCase() : "#"
      if (!acc[firstLetter]) {
        acc[firstLetter] = []
      }
      acc[firstLetter].push(contact)
      return acc
    },
    {} as Record<string, Contact[]>,
  )

  // Get sorted keys for grouped contacts
  const sortedKeys = Object.keys(groupedContacts).sort()

  // Generate initials for avatar
  const getInitials = (firstName: string, lastName?: string) => {
    const firstInitial = firstName && firstName.length > 0 ? firstName[0] : ""
    const lastInitial = lastName && lastName.length > 0 ? lastName[0] : ""
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin mb-4 h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (hasError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Contacts</CardTitle>
            <CardDescription>
              There was a problem loading your contacts. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your address book</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contacts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="sm"
              className={`${viewMode === "grid" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`${viewMode === "list" ? "bg-muted" : ""}`}
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Groups</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setIsGroupDialogOpen(true)}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveGroup(null)}>
                  <div className="flex w-full items-center justify-between">
                    <span>All Contacts</span>
                    <Badge>{contacts.length}</Badge>
                  </div>
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveGroup("favorite")}>
                  <div className="flex w-full items-center justify-between">
                    <span>Favorites</span>
                    <Badge>{contacts.filter((c) => c.favorite).length}</Badge>
                  </div>
                </Button>

                {Array.isArray(groups) &&
                  groups.map((group) => (
                    <div key={group} className="flex items-center">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveGroup(group)}>
                        <div className="flex w-full items-center justify-between">
                          <span>{group}</span>
                          <Badge>{contacts.filter((c) => c.group === group).length}</Badge>
                        </div>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteGroup(group)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact List */}
        <div className="md:col-span-3">
          {filteredContacts.length === 0 ? (
            <Card className="flex h-60 flex-col items-center justify-center text-center">
              <BookUser className="mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="text-2xl font-bold">No Contacts Found</h2>
              <p className="mb-6 text-muted-foreground">
                {searchQuery
                  ? "Try a different search term or clear your filters"
                  : "Add your first contact to get started"}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </Card>
          ) : viewMode === "grid" ? (
            // Grid view
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="overflow-hidden transition-all hover:shadow-md"
                  onClick={() => {
                    setSelectedContact(contact)
                    setIsDetailsOpen(true)
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={contact.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback className={`${contact.favorite ? "bg-yellow-500" : "bg-primary"}`}>
                            {getInitials(contact.firstName, contact.lastName || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {`${contact.firstName} ${contact.lastName || ""}`}
                            {contact.favorite && <span className="ml-1 text-yellow-500">★</span>}
                          </CardTitle>
                          {contact.jobTitle && contact.company && (
                            <CardDescription>
                              {contact.jobTitle} at {contact.company}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(contact.id)
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={contact.favorite ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`h-4 w-4 ${contact.favorite ? "text-yellow-500" : "text-muted-foreground"}`}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.group && (
                        <Badge variant="outline" className="mt-1">
                          {contact.group}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingContact(contact)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteContact(contact.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            // List view
            <Card>
              <CardContent className="p-4">
                <ScrollArea className="h-[calc(100vh-240px)] pr-4">
                  {sortedKeys.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-center">
                      <p className="text-muted-foreground">No contacts found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(sortedKeys) &&
                        sortedKeys.map((key) => (
                          <div key={key}>
                            <h3 className="mb-2 text-lg font-semibold">{key}</h3>
                            <div className="space-y-1">
                              {groupedContacts[key] &&
                                groupedContacts[key].map((contact) => (
                                  <div
                                    key={contact.id}
                                    className="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-muted"
                                    onClick={() => {
                                      setSelectedContact(contact)
                                      setIsDetailsOpen(true)
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={contact.avatarUrl || "/placeholder.svg"} />
                                        <AvatarFallback
                                          className={`${contact.favorite ? "bg-yellow-500" : "bg-primary"} text-xs`}
                                        >
                                          {getInitials(contact.firstName, contact.lastName || "")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">
                                          {`${contact.firstName} ${contact.lastName || ""}`}
                                          {contact.favorite && <span className="ml-1 text-yellow-500">★</span>}
                                        </div>
                                        {contact.email && (
                                          <div className="text-xs text-muted-foreground">{contact.email}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      {contact.phone && (
                                        <div className="mr-4 flex items-center gap-1 text-sm">
                                          <Phone className="h-3 w-3 text-muted-foreground" />
                                          <span>{contact.phone}</span>
                                        </div>
                                      )}
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleFavorite(contact.id)
                                          }}
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill={contact.favorite ? "currentColor" : "none"}
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={`h-4 w-4 ${contact.favorite ? "text-yellow-500" : "text-muted-foreground"}`}
                                          >
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                          </svg>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingContact(contact)
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
                                            deleteContact(contact.id)
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Add a new contact to your address book.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newContact.firstName}
                  onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newContact.email || ""}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newContact.phone || ""}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newContact.company || ""}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={newContact.jobTitle || ""}
                  onChange={(e) => setNewContact({ ...newContact, jobTitle: e.target.value })}
                  placeholder="Job title"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newContact.address || ""}
                onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                placeholder="Address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group">Group</Label>
              <Select
                value={newContact.group || "Other"}
                onValueChange={(value) => setNewContact({ ...newContact, group: value })}
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(groups) &&
                    groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={newContact.notes || ""}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addContact}>Add Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update contact information.</DialogDescription>
          </DialogHeader>
          {editingContact && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={editingContact.firstName}
                    onChange={(e) => setEditingContact({ ...editingContact, firstName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={editingContact.lastName || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingContact.email || ""}
                  onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingContact.phone || ""}
                  onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-company">Company</Label>
                  <Input
                    id="edit-company"
                    value={editingContact.company || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, company: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-jobTitle">Job Title</Label>
                  <Input
                    id="edit-jobTitle"
                    value={editingContact.jobTitle || ""}
                    onChange={(e) => setEditingContact({ ...editingContact, jobTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editingContact.address || ""}
                  onChange={(e) => setEditingContact({ ...editingContact, address: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-group">Group</Label>
                <Select
                  value={editingContact.group || "Other"}
                  onValueChange={(value) => setEditingContact({ ...editingContact, group: value })}
                >
                  <SelectTrigger id="edit-group">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(groups) &&
                      groups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input
                  id="edit-notes"
                  value={editingContact.notes || ""}
                  onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContact(null)}>
              Cancel
            </Button>
            <Button onClick={updateContact}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group</DialogTitle>
            <DialogDescription>Create a new contact group.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder="e.g., Work, Family, Friends"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addGroup}>Add Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedContact.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback className={`${selectedContact.favorite ? "bg-yellow-500" : "bg-primary"} text-lg`}>
                    {getInitials(selectedContact.firstName, selectedContact.lastName || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {`${selectedContact.firstName} ${selectedContact.lastName || ""}`}
                    {selectedContact.favorite && <span className="ml-2 text-yellow-500">★</span>}
                  </h2>
                  {selectedContact.jobTitle && selectedContact.company && (
                    <p className="text-muted-foreground">
                      {selectedContact.jobTitle} at {selectedContact.company}
                    </p>
                  )}
                </div>
              </div>

              {selectedContact.group && <Badge>{selectedContact.group}</Badge>}

              <div className="rounded-lg border p-4">
                <div className="space-y-3">
                  {selectedContact.email && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>Email</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{selectedContact.email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(selectedContact.email || "", "Email")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedContact.phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>Phone</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{selectedContact.phone}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(selectedContact.phone || "", "Phone")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedContact.address && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>Address</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{selectedContact.address}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(selectedContact.address || "", "Address")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedContact.company && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>Company</span>
                      </div>
                      <span>{selectedContact.company}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedContact.notes && (
                <div>
                  <h3 className="mb-2 font-medium">Notes</h3>
                  <div className="rounded-lg border p-3 text-sm">{selectedContact.notes}</div>
                </div>
              )}

              <div className="pt-2 text-xs text-muted-foreground">
                Added on {new Date(selectedContact.createdAt).toLocaleDateString()}
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedContact) {
                    setEditingContact(selectedContact)
                    setIsDetailsOpen(false)
                  }
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedContact) {
                    toggleFavorite(selectedContact.id)
                  }
                }}
              >
                {selectedContact?.favorite ? "Remove from favorites" : "Add to favorites"}
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (selectedContact) {
                  deleteContact(selectedContact.id)
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
