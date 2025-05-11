"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle, Trash2, Edit, Search } from "lucide-react"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { LinkedItemsList } from "@/components/linked-items/linked-items-list"
import { LinkItemDialog } from "@/components/linked-items/link-item-dialog"
import { Badge } from "@/components/ui/badge"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: "active" | "inactive" | "pending"
  address: string
  website: string
  notes: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [newClient, setNewClient] = useState<Omit<Client, "id">>({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "active",
    address: "",
    website: "",
    notes: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeClient, setActiveClient] = useState<Client | null>(null)

  useEffect(() => {
    const savedClients = getLocalStorage<Client[]>("clients", [])
    setClients(savedClients)
  }, [])

  useEffect(() => {
    if (clients.length > 0) {
      setLocalStorage("clients", clients)
    }
  }, [clients])

  const addOrUpdateClient = () => {
    if (!newClient.name || !newClient.email) return

    const client: Client = {
      ...newClient,
      id: editingClientId || uuidv4(),
    }

    if (editingClientId) {
      setClients(clients.map((c) => (c.id === editingClientId ? client : c)))
      setEditingClientId(null)
      setIsEditMode(false)
    } else {
      setClients([...clients, client])
    }

    setNewClient({
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "active",
      address: "",
      website: "",
      notes: "",
    })
    setIsDialogOpen(false)
  }

  const deleteClient = (id: string) => {
    setClients(clients.filter((c) => c.id !== id))
  }

  const editClient = (id: string) => {
    const client = clients.find((c) => c.id === id)
    if (client) {
      setNewClient({
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        status: client.status,
        address: client.address,
        website: client.website,
        notes: client.notes,
      })
      setEditingClientId(id)
      setIsDialogOpen(true)
      setIsEditMode(true)
      setActiveClient(client)
    }
  }

  const filteredClients = clients.filter((client) => {
    const searchTerm = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm) ||
      client.company.toLowerCase().includes(searchTerm)
    )
  })

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your clients and their information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Client" : "Create New Client"}</DialogTitle>
              <DialogDescription>
                {isEditMode ? "Update client details." : "Enter information for the new client."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={newClient.status}
                  onChange={(e) =>
                    setNewClient({ ...newClient, status: e.target.value as "active" | "inactive" | "pending" })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={newClient.website}
                  onChange={(e) => setNewClient({ ...newClient, website: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                  placeholder="Additional notes about the client"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addOrUpdateClient}>{isEditMode ? "Update Client" : "Create Client"}</Button>
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
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Client
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.company}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{client.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <LinkItemDialog
                      sourceId={client.id}
                      sourceType="client"
                      onLinkAdded={() => {
                        // Force refresh
                        const updatedClients = [...clients]
                        setClients(updatedClients)
                      }}
                    />
                    <Button variant="ghost" size="icon" onClick={() => editClient(client.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => deleteClient(client.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {activeClient && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Linked Items</CardTitle>
          </CardHeader>
          <CardContent>
            <LinkedItemsList sourceId={activeClient.id} sourceType="client" showEmpty={true} maxItems={5} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
