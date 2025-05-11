"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Mail, Phone, MapPin, Trash2, Edit, User, ImageIcon } from "lucide-react"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

// Define the Contact type
interface Contact {
  id: string
  name: string
  email: string
  phone: string
  address: string
  company: string
  avatar: string
  notes: string
  favorite: boolean
}

// Avatar options
const avatarOptions = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "big-ears",
  "big-ears-neutral",
  "big-smile",
  "bottts",
  "croodles",
  "croodles-neutral",
  "fun-emoji",
  "icons",
  "identicon",
  "initials",
  "lorelei",
  "lorelei-neutral",
  "micah",
  "miniavs",
  "notionists",
  "open-peeps",
  "personas",
  "pixel-art",
  "pixel-art-neutral",
]

export default function ContactsPage() {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [currentContact, setCurrentContact] = useState<Contact | null>(null)
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    notes: "",
    favorite: false,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).substring(2, 9)}`,
  })
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState("avataaars")
  const [tempAvatar, setTempAvatar] = useState("")

  // Load contacts from localStorage on component mount
  useEffect(() => {
    try {
      const savedContacts = getLocalStorage<Contact[]>("contacts", [])
      if (Array.isArray(savedContacts)) {
        setContacts(savedContacts)
      } else {
        console.error("Saved contacts is not an array:", savedContacts)
        setContacts([])
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
      setContacts([])
    }
  }, [])

  // Save contacts to localStorage whenever they change
  useEffect(() => {
    try {
      setLocalStorage("contacts", contacts)
    } catch (error) {
      console.error("Error saving contacts:", error)
      toast({
        title: "Error saving contacts",
        description: "There was a problem saving your contacts.",
        variant: "destructive",
      })
    }
  }, [contacts, toast])

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Group contacts by first letter of name
  const groupedContacts = filteredContacts.reduce(
    (acc, contact) => {
      const firstLetter = contact.name.charAt(0).toUpperCase()
      if (!acc[firstLetter]) {
        acc[firstLetter] = []
      }
      acc[firstLetter].push(contact)
      return acc
    },
    {} as Record<string, Contact[]>,
  )

  // Sort groups alphabetically
  const sortedGroups = Object.keys(groupedContacts).sort()

  // Generate a new avatar URL based on the selected style
  const generateAvatar = (seed: string, style: string = selectedAvatarStyle) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`
  }

  // Open avatar selection dialog
  const openAvatarDialog = (contact: Contact | null = null) => {
    if (contact) {
      setCurrentContact(contact)
      // Extract the current avatar style if possible
      const avatarUrl = contact.avatar
      const styleMatch = avatarUrl.match(/\/7\.x\/([^/]+)\/svg/)
      if (styleMatch && styleMatch[1]) {
        setSelectedAvatarStyle(styleMatch[1])
      }
      setTempAvatar(contact.avatar)
    } else {
      setTempAvatar(newContact.avatar || "")
    }
    setIsAvatarDialogOpen(true)
  }

  // Apply selected avatar
  const applyAvatar = () => {
    if (currentContact) {
      setCurrentContact({
        ...currentContact,
        avatar: tempAvatar,
      })
    } else {
      setNewContact({
        ...newContact,
        avatar: tempAvatar,
      })
    }
    setIsAvatarDialogOpen(false)
  }

  // Change avatar style
  const changeAvatarStyle = (style: string) => {
    setSelectedAvatarStyle(style)
    const seed = Math.random().toString(36).substring(2, 9)
    const newAvatarUrl = generateAvatar(seed, style)
    setTempAvatar(newAvatarUrl)
  }

  // Regenerate avatar with same style but different seed
  const regenerateAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 9)
    const newAvatarUrl = generateAvatar(seed)
    setTempAvatar(newAvatarUrl)
  }

  // Handle adding a new contact
  const handleAddContact = () => {
    if (!newContact.name) {
      toast({
        title: "Name required",
        description: "Please provide a name for the contact.",
        variant: "destructive",
      })
      return
    }

    const id = Math.random().toString(36).substring(2, 9)
    const avatar = newContact.avatar || generateAvatar(id)

    const contact: Contact = {
      id,
      name: newContact.name,
      email: newContact.email || "",
      phone: newContact.phone || "",
      address: newContact.address || "",
      company: newContact.company || "",
      avatar,
      notes: newContact.notes || "",
      favorite: newContact.favorite || false,
    }

    setContacts([...contacts, contact])
    setNewContact({
      name: "",
      email: "",
      phone: "",
      address: "",
      company: "",
      notes: "",
      favorite: false,
      avatar: generateAvatar(Math.random().toString(36).substring(2, 9)),
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Contact added",
      description: `${contact.name} has been added to your contacts.`,
    })
  }

  // Handle editing a contact
  const handleEditContact = () => {
    if (!currentContact) return

    if (!currentContact.name) {
      toast({
        title: "Name required",
        description: "Please provide a name for the contact.",
        variant: "destructive",
      })
      return
    }

    const updatedContacts = contacts.map((contact) => (contact.id === currentContact.id ? currentContact : contact))

    setContacts(updatedContacts)
    setIsEditDialogOpen(false)

    toast({
      title: "Contact updated",
      description: `${currentContact.name} has been updated.`,
    })
  }

  // Handle deleting a contact
  const handleDeleteContact = (id: string) => {
    const contactToDelete = contacts.find((contact) => contact.id === id)
    const updatedContacts = contacts.filter((contact) => contact.id !== id)
    setContacts(updatedContacts)

    if (currentContact?.id === id) {
      setCurrentContact(null)
    }

    toast({
      title: "Contact deleted",
      description: contactToDelete
        ? `${contactToDelete.name} has been removed from your contacts.`
        : "Contact has been deleted.",
    })
  }

  // Handle toggling favorite status
  const handleToggleFavorite = (id: string) => {
    const updatedContacts = contacts.map((contact) =>
      contact.id === id ? { ...contact, favorite: !contact.favorite } : contact,
    )
    setContacts(updatedContacts)

    if (currentContact?.id === id) {
      setCurrentContact({ ...currentContact, favorite: !currentContact.favorite })
    }

    const contact = contacts.find((c) => c.id === id)
    if (contact) {
      toast({
        title: contact.favorite ? "Removed from favorites" : "Added to favorites",
        description: `${contact.name} has been ${contact.favorite ? "removed from" : "added to"} your favorites.`,
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contacts..."
              className="w-full sm:w-[300px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>Enter the details for your new contact.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 cursor-pointer" onClick={() => openAvatarDialog()}>
                    <AvatarImage src={newContact.avatar || "/placeholder.svg"} alt="Avatar" />
                    <AvatarFallback>
                      <ImageIcon className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" onClick={() => openAvatarDialog()}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Choose Avatar
                  </Button>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company" className="text-right">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={newContact.address}
                    onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="notes" className="text-right pt-2">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={newContact.notes || ""}
                    onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                    className="col-span-3 min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddContact}>Add Contact</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contact List</CardTitle>
              <CardDescription>{contacts.length} contacts total</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                {sortedGroups.length > 0 ? (
                  sortedGroups.map((letter) => (
                    <div key={letter} className="mb-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">{letter}</h3>
                      <div className="space-y-2">
                        {groupedContacts[letter].map((contact) => (
                          <div
                            key={contact.id}
                            className={`flex items-center p-2 rounded-md cursor-pointer ${
                              currentContact?.id === contact.id ? "bg-muted" : "hover:bg-muted/50"
                            }`}
                            onClick={() => setCurrentContact(contact)}
                          >
                            <Avatar className="h-9 w-9 mr-2">
                              <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                              <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{contact.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
                            </div>
                            {contact.favorite && <span className="text-yellow-500 text-xs">★</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <User className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No contacts match your search" : "No contacts yet"}
                    </p>
                    {!searchQuery && (
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Contact
                      </Button>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {currentContact ? (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    {currentContact.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => handleToggleFavorite(currentContact.id)}
                    >
                      <span
                        className={`text-lg ${currentContact.favorite ? "text-yellow-500" : "text-muted-foreground"}`}
                      >
                        ★
                      </span>
                    </Button>
                  </CardTitle>
                  <CardDescription>{currentContact.company}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Edit Contact</DialogTitle>
                        <DialogDescription>Make changes to the contact information.</DialogDescription>
                      </DialogHeader>
                      {currentContact && (
                        <div className="grid gap-4 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar
                              className="h-16 w-16 cursor-pointer"
                              onClick={() => openAvatarDialog(currentContact)}
                            >
                              <AvatarImage
                                src={currentContact.avatar || "/placeholder.svg"}
                                alt={currentContact.name}
                              />
                              <AvatarFallback>{currentContact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" size="sm" onClick={() => openAvatarDialog(currentContact)}>
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Change Avatar
                            </Button>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                              Name
                            </Label>
                            <Input
                              id="edit-name"
                              value={currentContact.name}
                              onChange={(e) => setCurrentContact({ ...currentContact, name: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right">
                              Email
                            </Label>
                            <Input
                              id="edit-email"
                              type="email"
                              value={currentContact.email}
                              onChange={(e) => setCurrentContact({ ...currentContact, email: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-phone" className="text-right">
                              Phone
                            </Label>
                            <Input
                              id="edit-phone"
                              type="tel"
                              value={currentContact.phone}
                              onChange={(e) => setCurrentContact({ ...currentContact, phone: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-company" className="text-right">
                              Company
                            </Label>
                            <Input
                              id="edit-company"
                              value={currentContact.company}
                              onChange={(e) => setCurrentContact({ ...currentContact, company: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-address" className="text-right">
                              Address
                            </Label>
                            <Input
                              id="edit-address"
                              value={currentContact.address}
                              onChange={(e) => setCurrentContact({ ...currentContact, address: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="edit-notes" className="text-right pt-2">
                              Notes
                            </Label>
                            <Textarea
                              id="edit-notes"
                              value={currentContact.notes}
                              onChange={(e) => setCurrentContact({ ...currentContact, notes: e.target.value })}
                              className="col-span-3 min-h-[100px]"
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleEditContact}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="icon" onClick={() => handleDeleteContact(currentContact.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <Avatar className="h-24 w-24 cursor-pointer" onClick={() => openAvatarDialog(currentContact)}>
                    <AvatarImage src={currentContact.avatar || "/placeholder.svg"} alt={currentContact.name} />
                    <AvatarFallback>{currentContact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    {currentContact.email && (
                      <div className="flex items-center mb-2">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a href={`mailto:${currentContact.email}`} className="text-sm hover:underline">
                          {currentContact.email}
                        </a>
                      </div>
                    )}
                    {currentContact.phone && (
                      <div className="flex items-center mb-2">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a href={`tel:${currentContact.phone}`} className="text-sm hover:underline">
                          {currentContact.phone}
                        </a>
                      </div>
                    )}
                    {currentContact.address && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{currentContact.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Tabs defaultValue="notes" className="mt-6">
                  <TabsList>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  <TabsContent value="notes" className="p-4 border rounded-md mt-2">
                    {currentContact.notes ? (
                      <p className="text-sm">{currentContact.notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No notes for this contact.</p>
                    )}
                  </TabsContent>
                  <TabsContent value="activity" className="p-4 border rounded-md mt-2">
                    <p className="text-sm text-muted-foreground italic">Activity tracking coming soon.</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-10">
                <p className="text-muted-foreground mb-4">Select a contact to view details</p>
                <p className="text-muted-foreground text-sm">or</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Contact
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Avatar Selection Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Choose Avatar</DialogTitle>
            <DialogDescription>Select an avatar style and customize it.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={tempAvatar || "/placeholder.svg"} alt="Avatar Preview" />
                <AvatarFallback>
                  <ImageIcon className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex justify-center mb-4">
              <Button onClick={regenerateAvatar} variant="outline">
                <ImageIcon className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {avatarOptions.map((style) => (
                <Button
                  key={style}
                  variant={selectedAvatarStyle === style ? "default" : "outline"}
                  className="h-auto py-2 px-3 text-xs"
                  onClick={() => changeAvatarStyle(style)}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1).replace(/-/g, " ")}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAvatarDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyAvatar}>Apply Avatar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
