"use client"

import { useState, useEffect } from "react"
import { Copy, Eye, EyeOff, Key, PlusCircle, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
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

interface PasswordEntry {
  id: string
  title: string
  username: string
  password: string
  website: string
  createdAt: string
}

export default function PasswordsPage() {
  const { toast } = useToast()
  const [passwordEntries, setPasswordEntries] = useState<PasswordEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)

  // Password generator state
  const [passwordLength, setPasswordLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [generatedPassword, setGeneratedPassword] = useState("")

  // New entry state
  const [newEntry, setNewEntry] = useState<Omit<PasswordEntry, "id" | "createdAt">>({
    title: "",
    username: "",
    password: "",
    website: "",
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    const savedEntries = getLocalStorage<PasswordEntry[]>("passwordEntries", [])
    setPasswordEntries(savedEntries)
    generatePassword()
  }, [])

  const saveEntries = (updatedEntries: PasswordEntry[]) => {
    setPasswordEntries(updatedEntries)
    setLocalStorage("passwordEntries", updatedEntries)
  }

  const addEntry = () => {
    if (!newEntry.title || !newEntry.password) {
      toast({
        title: "Missing information",
        description: "Please provide at least a title and password.",
        variant: "destructive",
      })
      return
    }

    const entry: PasswordEntry = {
      ...newEntry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    const updatedEntries = [entry, ...passwordEntries]
    saveEntries(updatedEntries)

    setNewEntry({
      title: "",
      username: "",
      password: "",
      website: "",
    })

    setIsAddDialogOpen(false)

    toast({
      title: "Password saved",
      description: "Your password has been securely saved.",
    })
  }

  const deleteEntry = (id: string) => {
    const updatedEntries = passwordEntries.filter((entry) => entry.id !== id)
    saveEntries(updatedEntries)

    toast({
      title: "Entry deleted",
      description: "Your password entry has been deleted.",
    })
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)

    toast({
      title: "Copied",
      description: "The item has been copied to your clipboard.",
    })
  }

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-="

    let chars = ""
    if (includeUppercase) chars += uppercase
    if (includeLowercase) chars += lowercase
    if (includeNumbers) chars += numbers
    if (includeSymbols) chars += symbols

    if (chars.length === 0) {
      chars = lowercase
      setIncludeLowercase(true)
    }

    let password = ""
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length)
      password += chars[randomIndex]
    }

    setGeneratedPassword(password)
  }

  const filteredEntries = passwordEntries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.website.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const openAddDialog = () => {
    setIsAddDialogOpen(true)
  }

  const closeAddDialog = () => {
    setIsAddDialogOpen(false)
  }

  const toggleShowPasswords = () => {
    setShowPasswords(!showPasswords)
  }

  const renderPasswordVisibilityButton = () => {
    if (showPasswords) {
      return (
        <Button variant="outline" size="sm" onClick={toggleShowPasswords}>
          <EyeOff className="mr-2 h-4 w-4" />
          <span>Hide Passwords</span>
        </Button>
      )
    } else {
      return (
        <Button variant="outline" size="sm" onClick={toggleShowPasswords}>
          <Eye className="mr-2 h-4 w-4" />
          <span>Show Passwords</span>
        </Button>
      )
    }
  }

  const renderEmptyState = () => {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <Key className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">No passwords found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add your first password to get started</p>
        </div>
      </div>
    )
  }

  const renderPasswordEntries = () => {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEntries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{entry.title}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {entry.website && (
                <CardDescription>
                  <a
                    href={entry.website.startsWith("http") ? entry.website : `https://${entry.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {entry.website}
                  </a>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2 pb-2">
              {entry.username && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Username</p>
                    <p className="font-medium">{entry.username}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(entry.username, "Username")}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Password</p>
                  <p className="font-mono font-medium">{showPasswords ? entry.password : "••••••••••••"}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(entry.password, "Password")}
                  className="h-8 w-8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <p className="text-xs text-muted-foreground">Added on {new Date(entry.createdAt).toLocaleDateString()}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Password Manager</h1>
          <p className="text-muted-foreground">Securely store and generate passwords</p>
        </div>
        <Button onClick={openAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Add Password</span>
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Password</DialogTitle>
            <DialogDescription>Enter the details for the new password entry.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="e.g., Gmail, Twitter"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username/Email</Label>
              <Input
                id="username"
                value={newEntry.username}
                onChange={(e) => setNewEntry({ ...newEntry, username: e.target.value })}
                placeholder="username@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={showPasswords ? "text" : "password"}
                  value={newEntry.password}
                  onChange={(e) => setNewEntry({ ...newEntry, password: e.target.value })}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNewEntry({ ...newEntry, password: generatedPassword })}
                  title="Use generated password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                value={newEntry.website}
                onChange={(e) => setNewEntry({ ...newEntry, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddDialog}>
              Cancel
            </Button>
            <Button onClick={addEntry}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Password Generator</CardTitle>
            <CardDescription>Create strong, secure passwords</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={generatedPassword}
                type={showPasswords ? "text" : "password"}
                readOnly
                className="flex-1 font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={toggleShowPasswords}
                title={showPasswords ? "Hide password" : "Show password"}
              >
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(generatedPassword, "Password")}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={generatePassword} title="Generate new password">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="length">Length: {passwordLength}</Label>
              </div>
              <Slider
                id="length"
                min={8}
                max={32}
                step={1}
                value={[passwordLength]}
                onValueChange={(value) => setPasswordLength(value[0])}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
                <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
                <Label htmlFor="lowercase">Lowercase (a-z)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                <Label htmlFor="numbers">Numbers (0-9)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                <Label htmlFor="symbols">Symbols (!@#$)</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generatePassword} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Generate New Password</span>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password Security Tips</CardTitle>
            <CardDescription>Best practices for password management</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="ml-6 list-disc space-y-2 text-sm">
              <li>Use a unique password for each account</li>
              <li>Make passwords at least 12 characters long</li>
              <li>Include a mix of letters, numbers, and symbols</li>
              <li>Avoid using personal information in passwords</li>
              <li>Change important passwords regularly</li>
              <li>Use two-factor authentication when available</li>
              <li>Be cautious of phishing attempts asking for your password</li>
              <li>Consider using a password manager (like this one!)</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search passwords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Passwords</h2>
          <div className="flex items-center gap-2">{renderPasswordVisibilityButton()}</div>
        </div>

        {filteredEntries.length === 0 ? renderEmptyState() : renderPasswordEntries()}
      </div>
    </div>
  )
}
