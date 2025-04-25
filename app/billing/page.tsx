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
import { PlusCircle, Trash2, Clock, FileText, Download, Search } from "lucide-react"
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
interface TimeEntry {
  id: string
  date: string
  client: string
  project: string
  description: string
  hours: number
  rate: number
  billable: boolean
  invoiced: boolean
  invoiceId: string | null
  createdAt: string
}

interface Invoice {
  id: string
  number: string
  client: string
  issueDate: string
  dueDate: string
  status: "draft" | "sent" | "paid" | "overdue"
  items: InvoiceItem[]
  notes: string
  createdAt: string
}

interface InvoiceItem {
  id: string
  description: string
  hours: number
  rate: number
  amount: number
  timeEntryId: string | null
}

export default function BillingPage() {
  // State
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<string[]>([])
  const [projects, setProjects] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("time-tracking")
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false)
  const [isNewInvoiceDialogOpen, setIsNewInvoiceDialogOpen] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  const [newEntry, setNewEntry] = useState<Omit<TimeEntry, "id" | "invoiced" | "invoiceId" | "createdAt">>({
    date: new Date().toISOString().split("T")[0],
    client: "",
    project: "",
    description: "",
    hours: 0,
    rate: 0,
    billable: true,
  })

  const [newInvoice, setNewInvoice] = useState<{
    client: string
    issueDate: string
    dueDate: string
    notes: string
  }>({
    client: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
  })

  // Load data from localStorage
  useEffect(() => {
    const savedTimeEntries = getLocalStorage<TimeEntry[]>("time-entries", [])
    const savedInvoices = getLocalStorage<Invoice[]>("invoices", [])
    const savedClients = getLocalStorage<string[]>("billing-clients", [])
    const savedProjects = getLocalStorage<string[]>("billing-projects", [])

    setTimeEntries(savedTimeEntries)
    setInvoices(savedInvoices)
    setClients(savedClients)
    setProjects(savedProjects)
  }, [])

  // Save data to localStorage
  useEffect(() => {
    if (timeEntries.length > 0) {
      setLocalStorage("time-entries", timeEntries)
    }
    if (invoices.length > 0) {
      setLocalStorage("invoices", invoices)
    }
    if (clients.length > 0) {
      setLocalStorage("billing-clients", clients)
    }
    if (projects.length > 0) {
      setLocalStorage("billing-projects", projects)
    }
  }, [timeEntries, invoices, clients, projects])

  // Add time entry
  const addTimeEntry = () => {
    if (!newEntry.client || !newEntry.description || newEntry.hours <= 0) return

    const entry: TimeEntry = {
      ...newEntry,
      id: crypto.randomUUID(),
      invoiced: false,
      invoiceId: null,
      createdAt: new Date().toISOString(),
    }

    setTimeEntries([...timeEntries, entry])

    // Add client and project to lists if they don't exist
    if (!clients.includes(newEntry.client)) {
      setClients([...clients, newEntry.client])
    }

    if (newEntry.project && !projects.includes(newEntry.project)) {
      setProjects([...projects, newEntry.project])
    }

    setIsNewEntryDialogOpen(false)
    resetNewEntry()
  }

  // Delete time entry
  const deleteTimeEntry = (id: string) => {
    setTimeEntries(timeEntries.filter((entry) => entry.id !== id))
    setSelectedEntries(selectedEntries.filter((entryId) => entryId !== id))
  }

  // Toggle entry selection
  const toggleEntrySelection = (id: string) => {
    if (selectedEntries.includes(id)) {
      setSelectedEntries(selectedEntries.filter((entryId) => entryId !== id))
    } else {
      setSelectedEntries([...selectedEntries, id])
    }
  }

  // Create invoice from selected entries
  const createInvoice = () => {
    if (!newInvoice.client || !newInvoice.dueDate || selectedEntries.length === 0) return

    const selectedTimeEntries = timeEntries.filter((entry) => selectedEntries.includes(entry.id))

    const invoiceItems: InvoiceItem[] = selectedTimeEntries.map((entry) => ({
      id: crypto.randomUUID(),
      description: `${entry.project ? `${entry.project}: ` : ""}${entry.description}`,
      hours: entry.hours,
      rate: entry.rate,
      amount: entry.hours * entry.rate,
      timeEntryId: entry.id,
    }))

    const invoiceNumber = `INV-${(invoices.length + 1).toString().padStart(4, "0")}`

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      number: invoiceNumber,
      client: newInvoice.client,
      issueDate: newInvoice.issueDate,
      dueDate: newInvoice.dueDate,
      status: "draft",
      items: invoiceItems,
      notes: newInvoice.notes,
      createdAt: new Date().toISOString(),
    }

    setInvoices([...invoices, invoice])

    // Mark time entries as invoiced
    const updatedTimeEntries = timeEntries.map((entry) =>
      selectedEntries.includes(entry.id) ? { ...entry, invoiced: true, invoiceId: invoice.id } : entry,
    )

    setTimeEntries(updatedTimeEntries)
    setSelectedEntries([])
    setIsNewInvoiceDialogOpen(false)
    resetNewInvoice()
    setActiveTab("invoices")
  }

  // Update invoice status
  const updateInvoiceStatus = (id: string, status: Invoice["status"]) => {
    const updatedInvoices = invoices.map((invoice) => (invoice.id === id ? { ...invoice, status } : invoice))

    setInvoices(updatedInvoices)
  }

  // Delete invoice
  const deleteInvoice = (id: string) => {
    // Update time entries to mark them as not invoiced
    const updatedTimeEntries = timeEntries.map((entry) =>
      entry.invoiceId === id ? { ...entry, invoiced: false, invoiceId: null } : entry,
    )

    setTimeEntries(updatedTimeEntries)
    setInvoices(invoices.filter((invoice) => invoice.id !== id))
  }

  // Reset form states
  const resetNewEntry = () => {
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      client: "",
      project: "",
      description: "",
      hours: 0,
      rate: 0,
      billable: true,
    })
  }

  const resetNewInvoice = () => {
    setNewInvoice({
      client: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      notes: "",
    })
  }

  // Filter time entries
  const filteredTimeEntries = timeEntries.filter((entry) => {
    // Search filter
    const matchesSearch =
      entry.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Client filter
    const matchesClient = clientFilter === "all" || entry.client === clientFilter

    // Date filter
    let matchesDate = true
    const entryDate = new Date(entry.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (dateFilter === "today") {
      const todayStr = today.toISOString().split("T")[0]
      matchesDate = entry.date === todayStr
    } else if (dateFilter === "this-week") {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      matchesDate = entryDate >= weekStart
    } else if (dateFilter === "this-month") {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      matchesDate = entryDate >= monthStart
    }

    return matchesSearch && matchesClient && matchesDate
  })

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)

    if (minutes === 0) {
      return `${wholeHours}h`
    }

    return `${wholeHours}h ${minutes}m`
  }

  const getInvoiceStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateInvoiceTotal = (invoice: Invoice) => {
    return invoice.items.reduce((total, item) => total + item.amount, 0)
  }

  const calculateTotalBillable = (entries: TimeEntry[]) => {
    return entries.filter((entry) => entry.billable).reduce((total, entry) => total + entry.hours * entry.rate, 0)
  }

  const calculateTotalHours = (entries: TimeEntry[]) => {
    return entries.reduce((total, entry) => total + entry.hours, 0)
  }

  return (
    <RoleGuard allowedRoles={["professional"]}>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Time Billing</h1>
            <p className="text-muted-foreground">Track billable hours and generate invoices</p>
          </div>
        </div>

        <Tabs defaultValue="time-tracking" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Time Tracking Tab */}
          <TabsContent value="time-tracking">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search entries..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                {selectedEntries.length > 0 && (
                  <Button variant="outline" onClick={() => setIsNewInvoiceDialogOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Invoice ({selectedEntries.length})
                  </Button>
                )}

                <Dialog open={isNewEntryDialogOpen} onOpenChange={setIsNewEntryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Time Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Time Entry</DialogTitle>
                      <DialogDescription>Record your billable or non-billable time.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newEntry.date}
                            onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hours">Hours</Label>
                          <Input
                            id="hours"
                            type="number"
                            min="0.25"
                            step="0.25"
                            value={newEntry.hours || ""}
                            onChange={(e) =>
                              setNewEntry({ ...newEntry, hours: Number.parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client">Client</Label>
                        <Select
                          value={newEntry.client}
                          onValueChange={(value) => setNewEntry({ ...newEntry, client: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client} value={client}>
                                {client}
                              </SelectItem>
                            ))}
                            <SelectItem value="new">+ Add New Client</SelectItem>
                          </SelectContent>
                        </Select>
                        {newEntry.client === "new" && (
                          <Input
                            className="mt-2"
                            placeholder="Enter new client name"
                            onChange={(e) => setNewEntry({ ...newEntry, client: e.target.value })}
                            value={newEntry.client === "new" ? "" : newEntry.client}
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="project">Project</Label>
                        <Select
                          value={newEntry.project}
                          onValueChange={(value) => setNewEntry({ ...newEntry, project: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select project (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-project">No Project</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project} value={project}>
                                {project}
                              </SelectItem>
                            ))}
                            <SelectItem value="new">+ Add New Project</SelectItem>
                          </SelectContent>
                        </Select>
                        {newEntry.project === "new" && (
                          <Input
                            className="mt-2"
                            placeholder="Enter new project name"
                            onChange={(e) => setNewEntry({ ...newEntry, project: e.target.value })}
                            value={newEntry.project === "new" ? "" : newEntry.project}
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newEntry.description}
                          onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                          placeholder="Describe the work performed"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="rate">Hourly Rate ($)</Label>
                          <Input
                            id="rate"
                            type="number"
                            min="0"
                            step="0.01"
                            value={newEntry.rate || ""}
                            onChange={(e) => setNewEntry({ ...newEntry, rate: Number.parseFloat(e.target.value) || 0 })}
                          />
                        </div>

                        <div className="space-y-2 flex items-end">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="billable"
                              checked={newEntry.billable}
                              onChange={(e) => setNewEntry({ ...newEntry, billable: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="billable">Billable</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsNewEntryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addTimeEntry}>Add Entry</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isNewInvoiceDialogOpen} onOpenChange={setIsNewInvoiceDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Invoice</DialogTitle>
                      <DialogDescription>Create an invoice from selected time entries.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoice-client">Client</Label>
                        <Select
                          value={newInvoice.client}
                          onValueChange={(value) => setNewInvoice({ ...newInvoice, client: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(
                              new Set(
                                timeEntries
                                  .filter((entry) => selectedEntries.includes(entry.id))
                                  .map((entry) => entry.client),
                              ),
                            ).map((client) => (
                              <SelectItem key={client} value={client}>
                                {client}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="issue-date">Issue Date</Label>
                          <Input
                            id="issue-date"
                            type="date"
                            value={newInvoice.issueDate}
                            onChange={(e) => setNewInvoice({ ...newInvoice, issueDate: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="due-date">Due Date</Label>
                          <Input
                            id="due-date"
                            type="date"
                            value={newInvoice.dueDate}
                            onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="invoice-notes">Notes</Label>
                        <Textarea
                          id="invoice-notes"
                          value={newInvoice.notes}
                          onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                          placeholder="Enter any additional notes for this invoice"
                        />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Selected Time Entries</h3>
                        <div className="rounded-md border">
                          <div className="grid grid-cols-5 bg-muted p-2 text-xs font-medium">
                            <div>Date</div>
                            <div className="col-span-2">Description</div>
                            <div>Hours</div>
                            <div className="text-right">Amount</div>
                          </div>
                          <div className="divide-y max-h-40 overflow-y-auto">
                            {timeEntries
                              .filter((entry) => selectedEntries.includes(entry.id))
                              .map((entry) => (
                                <div key={entry.id} className="grid grid-cols-5 p-2 text-sm">
                                  <div>{formatDate(entry.date)}</div>
                                  <div className="col-span-2 truncate">
                                    {entry.project ? `${entry.project}: ` : ""}
                                    {entry.description}
                                  </div>
                                  <div>{formatHours(entry.hours)}</div>
                                  <div className="text-right">{formatCurrency(entry.hours * entry.rate)}</div>
                                </div>
                              ))}
                          </div>
                          <div className="grid grid-cols-5 p-2 bg-muted text-sm font-medium">
                            <div className="col-span-3 text-right">Total:</div>
                            <div>
                              {formatHours(
                                timeEntries
                                  .filter((entry) => selectedEntries.includes(entry.id))
                                  .reduce((total, entry) => total + entry.hours, 0),
                              )}
                            </div>
                            <div className="text-right">
                              {formatCurrency(
                                timeEntries
                                  .filter((entry) => selectedEntries.includes(entry.id))
                                  .reduce((total, entry) => total + entry.hours * entry.rate, 0),
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsNewInvoiceDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createInvoice}>Create Invoice</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {filteredTimeEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <h3 className="text-lg font-medium">No time entries found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || clientFilter !== "all" || dateFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Add your first time entry to get started"}
                      </p>
                      <Button onClick={() => setIsNewEntryDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Time Entry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md">
                    <div className="grid grid-cols-8 bg-muted p-3 text-sm font-medium">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedEntries.length > 0 &&
                            selectedEntries.length === filteredTimeEntries.filter((e) => !e.invoiced).length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntries(filteredTimeEntries.filter((e) => !e.invoiced).map((e) => e.id))
                            } else {
                              setSelectedEntries([])
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>
                      <div>Date</div>
                      <div>Client</div>
                      <div>Project</div>
                      <div className="col-span-2">Description</div>
                      <div>Hours</div>
                      <div className="text-right">Amount</div>
                    </div>
                    <div className="divide-y">
                      {filteredTimeEntries
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((entry) => (
                          <div key={entry.id} className="grid grid-cols-8 p-3 text-sm items-center">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedEntries.includes(entry.id)}
                                onChange={() => toggleEntrySelection(entry.id)}
                                disabled={entry.invoiced}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </div>
                            <div>{formatDate(entry.date)}</div>
                            <div className="truncate">{entry.client}</div>
                            <div className="truncate">{entry.project || "-"}</div>
                            <div className="col-span-2 truncate">{entry.description}</div>
                            <div>{formatHours(entry.hours)}</div>
                            <div className="flex items-center justify-end">
                              <span className={`font-medium ${entry.billable ? "" : "text-muted-foreground"}`}>
                                {entry.billable ? formatCurrency(entry.hours * entry.rate) : "Non-billable"}
                              </span>
                              <Button variant="ghost" size="icon" onClick={() => deleteTimeEntry(entry.id)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-8 p-3 bg-muted text-sm font-medium">
                      <div className="col-span-6 text-right">Total:</div>
                      <div>{formatHours(calculateTotalHours(filteredTimeEntries))}</div>
                      <div className="text-right">{formatCurrency(calculateTotalBillable(filteredTimeEntries))}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <div className="grid gap-6">
              {invoices.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <h3 className="text-lg font-medium">No invoices yet</h3>
                      <p className="text-muted-foreground">Create your first invoice from time entries.</p>
                      <Button onClick={() => setActiveTab("time-tracking")}>
                        <Clock className="mr-2 h-4 w-4" />
                        Go to Time Tracking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {invoices
                    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
                    .map((invoice) => (
                      <Card key={invoice.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl">{invoice.number}</CardTitle>
                              <CardDescription>Client: {invoice.client}</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getInvoiceStatusColor(invoice.status)}>{invoice.status}</Badge>
                              <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Issue Date</h3>
                              <p>{formatDate(invoice.issueDate)}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                              <p>{formatDate(invoice.dueDate)}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
                              <p className="font-bold">{formatCurrency(calculateInvoiceTotal(invoice))}</p>
                            </div>
                          </div>

                          <div className="rounded-md border">
                            <div className="grid grid-cols-5 bg-muted p-2 text-xs font-medium">
                              <div className="col-span-2">Description</div>
                              <div>Hours</div>
                              <div>Rate</div>
                              <div className="text-right">Amount</div>
                            </div>
                            <div className="divide-y">
                              {invoice.items.map((item) => (
                                <div key={item.id} className="grid grid-cols-5 p-2 text-sm">
                                  <div className="col-span-2 truncate">{item.description}</div>
                                  <div>{formatHours(item.hours)}</div>
                                  <div>{formatCurrency(item.rate)}/hr</div>
                                  <div className="text-right">{formatCurrency(item.amount)}</div>
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-5 p-2 bg-muted text-sm font-medium">
                              <div className="col-span-4 text-right">Total:</div>
                              <div className="text-right">{formatCurrency(calculateInvoiceTotal(invoice))}</div>
                            </div>
                          </div>

                          {invoice.notes && (
                            <div className="mt-4">
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                              <p className="text-sm">{invoice.notes}</p>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <div className="text-sm text-muted-foreground">Created: {formatDate(invoice.createdAt)}</div>
                          <div className="flex items-center space-x-2">
                            <Select
                              value={invoice.status}
                              onValueChange={(value) => updateInvoiceStatus(invoice.id, value as Invoice["status"])}
                            >
                              <SelectTrigger className="h-8 w-[120px]">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => deleteInvoice(invoice.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Hours by Client</CardTitle>
                  <CardDescription>Total hours tracked per client</CardDescription>
                </CardHeader>
                <CardContent>
                  {clients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No data available yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {clients.map((client) => {
                        const clientEntries = timeEntries.filter((entry) => entry.client === client)
                        const totalHours = calculateTotalHours(clientEntries)
                        const totalBillable = calculateTotalBillable(clientEntries)
                        const percentage = Math.round((totalHours / calculateTotalHours(timeEntries)) * 100) || 0

                        return (
                          <div key={client} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{client}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatHours(totalHours)} ({percentage}%) - {formatCurrency(totalBillable)}
                                </p>
                              </div>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing Summary</CardTitle>
                  <CardDescription>Overview of your billing status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Billable</h3>
                        <p className="text-2xl font-bold">{formatCurrency(calculateTotalBillable(timeEntries))}</p>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Hours</h3>
                        <p className="text-2xl font-bold">{formatHours(calculateTotalHours(timeEntries))}</p>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Invoiced</h3>
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            timeEntries
                              .filter((entry) => entry.invoiced)
                              .reduce((total, entry) => total + entry.hours * entry.rate, 0),
                          )}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Uninvoiced</h3>
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            timeEntries
                              .filter((entry) => !entry.invoiced && entry.billable)
                              .reduce((total, entry) => total + entry.hours * entry.rate, 0),
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Invoice Status</h3>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 bg-gray-100 rounded-md">
                          <p className="text-lg font-bold">{invoices.filter((i) => i.status === "draft").length}</p>
                          <p className="text-xs text-muted-foreground">Draft</p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-md">
                          <p className="text-lg font-bold">{invoices.filter((i) => i.status === "sent").length}</p>
                          <p className="text-xs text-muted-foreground">Sent</p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-md">
                          <p className="text-lg font-bold">{invoices.filter((i) => i.status === "paid").length}</p>
                          <p className="text-xs text-muted-foreground">Paid</p>
                        </div>
                        <div className="p-2 bg-red-100 rounded-md">
                          <p className="text-lg font-bold">{invoices.filter((i) => i.status === "overdue").length}</p>
                          <p className="text-xs text-muted-foreground">Overdue</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}
