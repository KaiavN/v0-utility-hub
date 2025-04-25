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
import { PlusCircle, Trash2, Edit, Mail, Phone, MapPin, Building, Calendar, Search } from "lucide-react"
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
interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  website: string
  notes: string
  status: "active" | "inactive" | "lead" | "former"
  interactions: Interaction[]
  createdAt: string
  updatedAt: string
}

interface Interaction {
  id: string
  clientId: string
  date: string
  type: "email" | "call" | "meeting" | "other"
  description: string
  notes: string
  createdAt: string
}

export default function ClientsPage() {
  // State
  const [clients, setClients] = useState<Client[]>([])
  const [activeClient, setActiveClient] = useState<Client | null>(null)
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const [isNewInteractionDialogOpen, setIsNewInteractionDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [newClient, setNewClient] = useState<Omit<Client, "id" | "interactions" | "createdAt" | "updatedAt">>({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    notes: "",
    status: "active",
  })

  const [newInteraction, setNewInteraction] = useState<Omit<Interaction, "id" | "clientId" | "createdAt">>({
    date: new Date().toISOString().split("T")[0],
    type: "email",
    description: "",
    notes: "",
  })

  // Load data from localStorage
  useEffect(() => {
    const savedClients = getLocalStorage<Client[]>("clients", [])
    setClients(savedClients)

    if (savedClients.length > 0 && !activeClient) {
      setActiveClient(savedClients[0])
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    if (clients.length > 0) {
      setLocalStorage("clients", clients)
    }
  }, [clients])

  // Create new client
  const createClient = () => {
    if (!newClient.name || !newClient.email) return

    const now = new Date().toISOString()
    const client: Client = {
      ...newClient,
      id: crypto.randomUUID(),
      interactions: [],
      createdAt: now,
      updatedAt: now,
    }

    const updatedClients = [...clients, client]
    setClients(updatedClients)
    setActiveClient(client)
    setIsNewClientDialogOpen(false)
    resetNewClient()
  }

  // Update client
  const updateClient = () => {
    if (!activeClient || !activeClient.name || !activeClient.email) return

    const updatedClients = clients.map((c) =>
      c.id === activeClient.id ? { ...activeClient, updatedAt: new Date().toISOString() } : c,
    )

    setClients(updatedClients)
    setIsEditMode(false)
  }

  // Delete client
  const deleteClient = (id: string) => {
    const updatedClients = clients.filter((c) => c.id !== id)
    setClients(updatedClients)

    if (activeClient?.id === id) {
      setActiveClient(updatedClients.length > 0 ? updatedClients[0] : null)
    }
  }

  // Add interaction to client
  const addInteraction = () => {
    if (!activeClient || !newInteraction.description) return

    const interaction: Interaction = {
      ...newInteraction,
      id: crypto.randomUUID(),
      clientId: activeClient.id,
      createdAt: new Date().toISOString(),
    }

    const updatedClient = {
      ...activeClient,
      interactions: [...activeClient.interactions, interaction],
      updatedAt: new Date().toISOString(),
    }

    const updatedClients = clients.map((c) => (c.id === activeClient.id ? updatedClient : c))

    setClients(updatedClients)
    setActiveClient(updatedClient)
    setIsNewInteractionDialogOpen(false)
    resetNewInteraction()
  }

  // Delete interaction
  const deleteInteraction = (interactionId: string) => {
    if (!activeClient) return

    const updatedInteractions = activeClient.interactions.filter((i) => i.id !== interactionId)

    const updatedClient = {
      ...activeClient,
      interactions: updatedInteractions,
      updatedAt: new Date().toISOString(),
    }

    const updatedClients = clients.map((c) => (c.id === activeClient.id ? updatedClient : c))

    setClients(updatedClients)
    setActiveClient(updatedClient)
  }

  // Reset form states
  const resetNewClient = () => {
    setNewClient({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      notes: "",
      status: "active",
    })
  }

  const resetNewInteraction = () => {
    setNewInteraction({
      date: new Date().toISOString().split("T")[0],
      type: "email",
      description: "",
      notes: "",
    })
  }

  // Filter clients by search query
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Helper functions
  const getStatusColor = (status: Client["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "lead":
        return "bg-blue-100 text-blue-800"
      case "former":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInteractionTypeColor = (type: Interaction["type"]) => {
    switch (type) {
      case "email":
        return "bg-blue-100 text-blue-800"
      case "call":
        return "bg-green-100 text-green-800"
      case "meeting":
        return "bg-purple-100 text-purple-800"
      case "other":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <RoleGuard allowedRoles={["professional"]}>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Client Manager</h1>
            <p className="text-muted-foreground">Manage client information and interactions</p>
          </div>
          <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>Enter the details for your new client.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      placeholder="Enter client name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={newClient.company}
                      onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newClient.address}
                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={newClient.website}
                    onChange={(e) => setNewClient({ ...newClient, website: e.target.value })}
                    placeholder="Enter website URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newClient.status}
                    onValueChange={(value) => setNewClient({ ...newClient, status: value as Client["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="former">Former</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newClient.notes}
                    onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                    placeholder="Enter additional notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewClientDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createClient}>Add Client</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-3">
                <h3 className="text-lg font-medium">No clients yet</h3>
                <p className="text-muted-foreground">Add your first client to get started.</p>
                <Button onClick={() => setIsNewClientDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Client
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Clients</CardTitle>
                  <CardDescription>Your client list</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredClients.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No clients match your search.</p>
                    ) : (
                      filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className={`p-3 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                            activeClient?.id === client.id ? "bg-muted" : ""
                          }`}
                          onClick={() => setActiveClient(client)}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{client.name}</h3>
                            <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{client.company}</p>
                          <div className="flex items-center mt-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              {activeClient ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{activeClient.name}</CardTitle>
                        <CardDescription>{activeClient.company}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isEditMode ? (
                          <>
                            <Button variant="outline" onClick={() => setIsEditMode(false)}>
                              Cancel
                            </Button>
                            <Button onClick={updateClient}>Save</Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="icon" onClick={() => setIsEditMode(true)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => deleteClient(activeClient.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="details">
                      <TabsList className="mb-4">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="interactions">Interactions</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details">
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                              {isEditMode ? (
                                <Input
                                  value={activeClient.email}
                                  onChange={(e) =>
                                    setActiveClient({
                                      ...activeClient,
                                      email: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <p>{activeClient.email}</p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                              {isEditMode ? (
                                <Input
                                  value={activeClient.phone}
                                  onChange={(e) =>
                                    setActiveClient({
                                      ...activeClient,
                                      phone: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <p>{activeClient.phone || "Not provided"}</p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                              {isEditMode ? (
                                <Input
                                  value={activeClient.company}
                                  onChange={(e) =>
                                    setActiveClient({
                                      ...activeClient,
                                      company: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                <div className="flex items-center">
                                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <p>{activeClient.company || "Not provided"}</p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                              {isEditMode ? (
                                <Select
                                  value={activeClient.status}
                                  onValueChange={(value) =>
                                    setActiveClient({
                                      ...activeClient,
                                      status: value as Client["status"],
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="lead">Lead</SelectItem>
                                    <SelectItem value="former">Former</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge className={getStatusColor(activeClient.status)}>{activeClient.status}</Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                            {isEditMode ? (
                              <Input
                                value={activeClient.address}
                                onChange={(e) =>
                                  setActiveClient({
                                    ...activeClient,
                                    address: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                                <p>{activeClient.address || "Not provided"}</p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
                            {isEditMode ? (
                              <Input
                                value={activeClient.website}
                                onChange={(e) =>
                                  setActiveClient({
                                    ...activeClient,
                                    website: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              <p>
                                {activeClient.website ? (
                                  <a
                                    href={
                                      activeClient.website.startsWith("http")
                                        ? activeClient.website
                                        : `https://${activeClient.website}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {activeClient.website}
                                  </a>
                                ) : (
                                  "Not provided"
                                )}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
                            {activeClient.interactions.length > 0 ? (
                              <div className="space-y-2">
                                {activeClient.interactions.slice(0, 3).map((interaction) => (
                                  <div key={interaction.id} className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{interaction.description}</p>
                                      <p className="text-sm text-muted-foreground">{formatDate(interaction.date)}</p>
                                    </div>
                                    <Badge className={getInteractionTypeColor(interaction.type)}>
                                      {interaction.type}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">No interactions recorded yet.</p>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="interactions">
                        <div className="space-y-4">
                          <Dialog open={isNewInteractionDialogOpen} onOpenChange={setIsNewInteractionDialogOpen}>
                            <DialogTrigger asChild>
                              <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Interaction
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Interaction</DialogTitle>
                                <DialogDescription>Record a new interaction with this client.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                      id="date"
                                      type="date"
                                      value={newInteraction.date}
                                      onChange={(e) => setNewInteraction({ ...newInteraction, date: e.target.value })}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                      value={newInteraction.type}
                                      onValueChange={(value) =>
                                        setNewInteraction({ ...newInteraction, type: value as Interaction["type"] })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="call">Call</SelectItem>
                                        <SelectItem value="meeting">Meeting</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="description">Description</Label>
                                  <Input
                                    id="description"
                                    value={newInteraction.description}
                                    onChange={(e) =>
                                      setNewInteraction({ ...newInteraction, description: e.target.value })
                                    }
                                    placeholder="Enter a brief description"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="notes">Notes</Label>
                                  <Textarea
                                    id="notes"
                                    value={newInteraction.notes}
                                    onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                                    placeholder="Enter detailed notes"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNewInteractionDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={addInteraction}>Add Interaction</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {activeClient.interactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No interactions recorded yet. Add your first interaction with this client.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {activeClient.interactions
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((interaction) => (
                                  <Card key={interaction.id}>
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                          <div className="flex items-center">
                                            <h3 className="font-medium">{interaction.description}</h3>
                                            <Badge className={`ml-2 ${getInteractionTypeColor(interaction.type)}`}>
                                              {interaction.type}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center text-sm text-muted-foreground">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            <span>{formatDate(interaction.date)}</span>
                                          </div>
                                          {interaction.notes && (
                                            <p className="text-sm mt-2 whitespace-pre-line">{interaction.notes}</p>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => deleteInteraction(interaction.id)}
                                        >
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

                      <TabsContent value="notes">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">Client Notes</h3>
                            {isEditMode ? (
                              <Textarea
                                value={activeClient.notes}
                                onChange={(e) =>
                                  setActiveClient({
                                    ...activeClient,
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="Enter notes about this client"
                                className="min-h-[200px]"
                              />
                            ) : (
                              <div className="p-4 border rounded-md min-h-[200px] whitespace-pre-line">
                                {activeClient.notes || "No notes added yet."}
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div>Client since: {formatDate(activeClient.createdAt)}</div>
                      <div>Last updated: {formatDate(activeClient.updatedAt)}</div>
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Select a client to view details</p>
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
