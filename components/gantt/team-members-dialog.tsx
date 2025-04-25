"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, Check, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  avatar?: string
  role: string
  color: string
}

interface TeamMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: User[]
  onSave: (users: User[]) => void
  tasks: any[] // Using any for simplicity, but should match your Task interface
  projects: any[] // Using any for simplicity, but should match your Project interface
}

export default function TeamMembersDialog({
  open,
  onOpenChange,
  users,
  onSave,
  tasks,
  projects,
}: TeamMembersDialogProps) {
  const { toast } = useToast()
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [newMember, setNewMember] = useState<Partial<User>>({
    name: "",
    role: "Team Member",
    color: "#4f46e5",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [usageWarnings, setUsageWarnings] = useState<{ id: string; name: string; usageCount: number }[]>([])

  // Initialize team members from props
  useEffect(() => {
    if (open) {
      setTeamMembers([...users])
      setEditingMember(null)
      setNewMember({
        name: "",
        role: "Team Member",
        color: "#4f46e5",
      })
      setErrors({})
    } else {
      // Clean up state when dialog closes
      setIsProcessing(false)
    }
  }, [open, users])

  // Check for team member usage in tasks and projects
  useEffect(() => {
    if (open) {
      const warnings: { id: string; name: string; usageCount: number }[] = []

      users.forEach((user) => {
        let usageCount = 0

        // Count task assignments
        tasks.forEach((task) => {
          if (task.assignees && task.assignees.includes(user.id)) {
            usageCount++
          }
        })

        // Count project team memberships
        projects.forEach((project) => {
          if (project.team && project.team.includes(user.id)) {
            usageCount++
          }
          if (project.owner === user.id) {
            usageCount++
          }
        })

        if (usageCount > 0) {
          warnings.push({
            id: user.id,
            name: user.name,
            usageCount,
          })
        }
      })

      setUsageWarnings(warnings)
    }
  }, [open, users, tasks, projects])

  const validateMember = (member: Partial<User>): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!member.name || member.name.trim() === "") {
      errors.name = "Name is required"
    }

    if (!member.role || member.role.trim() === "") {
      errors.role = "Role is required"
    }

    if (!member.color) {
      errors.color = "Color is required"
    }

    return errors
  }

  const handleAddMember = () => {
    const validationErrors = validateMember(newMember)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Check for duplicate names
    if (teamMembers.some((member) => member.name.toLowerCase() === newMember.name?.toLowerCase())) {
      setErrors({ name: "A team member with this name already exists" })
      return
    }

    const newId = `user-${Date.now()}`
    const memberToAdd: User = {
      id: newId,
      name: newMember.name || "",
      role: newMember.role || "Team Member",
      color: newMember.color || "#4f46e5",
    }

    setTeamMembers([...teamMembers, memberToAdd])
    setNewMember({
      name: "",
      role: "Team Member",
      color: "#4f46e5",
    })
    setErrors({})

    toast({
      title: "Team member added",
      description: `${memberToAdd.name} has been added to the team.`,
    })
  }

  const handleEditMember = (member: User) => {
    setEditingMember(member)
    setErrors({})
  }

  const handleUpdateMember = () => {
    if (!editingMember) return

    const validationErrors = validateMember(editingMember)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    // Check for duplicate names (excluding the current member)
    if (
      teamMembers.some(
        (member) => member.id !== editingMember.id && member.name.toLowerCase() === editingMember.name.toLowerCase(),
      )
    ) {
      setErrors({ name: "A team member with this name already exists" })
      return
    }

    setTeamMembers(teamMembers.map((member) => (member.id === editingMember.id ? editingMember : member)))
    setEditingMember(null)
    setErrors({})

    toast({
      title: "Team member updated",
      description: `${editingMember.name}'s information has been updated.`,
    })
  }

  const handleRemoveMember = (id: string) => {
    // Check if this member is used in tasks or projects
    const memberWarning = usageWarnings.find((warning) => warning.id === id)

    if (memberWarning) {
      const confirmDelete = window.confirm(
        `${memberWarning.name} is assigned to ${memberWarning.usageCount} tasks or projects. Removing this team member will remove them from all assignments. Are you sure you want to continue?`,
      )

      if (!confirmDelete) return
    }

    setTeamMembers(teamMembers.filter((member) => member.id !== id))

    if (editingMember?.id === id) {
      setEditingMember(null)
    }

    toast({
      title: "Team member removed",
      description: "The team member has been removed from the team.",
    })
  }

  const handleSave = async () => {
    try {
      setIsProcessing(true)

      // Simulate a small delay to prevent UI glitches
      await new Promise((resolve) => setTimeout(resolve, 100))

      onSave(teamMembers)

      // Clean up state before closing
      setEditingMember(null)
      setErrors({})

      onOpenChange(false)

      toast({
        title: "Team members saved",
        description: "Your team member changes have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving team members:", error)
      toast({
        title: "Error saving team members",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive",
      })
      // Make sure to set processing to false even on error
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    // Check if there are unsaved changes
    const hasChanges = JSON.stringify(users) !== JSON.stringify(teamMembers)

    if (hasChanges) {
      const confirmCancel = window.confirm("You have unsaved changes. Are you sure you want to cancel?")
      if (!confirmCancel) return
    }

    // Reset state before closing
    setEditingMember(null)
    setErrors({})
    setNewMember({
      name: "",
      role: "Team Member",
      color: "#4f46e5",
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
          <DialogDescription>Add, edit, or remove team members for your Gantt chart projects.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team Members List */}
          <div className="space-y-4">
            <div className="font-medium flex items-center justify-between">
              <span>Team Members ({teamMembers.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingMember(null)
                  setErrors({})
                }}
                disabled={!editingMember}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Member
              </Button>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-2 rounded-md border ${
                      editingMember?.id === member.id ? "border-primary" : "border-border"
                    } hover:bg-muted/50`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditMember(member)} className="h-7 w-7">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-7 w-7 text-destructive"
                        disabled={member.id === "user-1"} // Prevent removing the default user
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {teamMembers.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground">No team members added yet.</div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Add/Edit Form */}
          <div className="space-y-4">
            <div className="font-medium">{editingMember ? "Edit Team Member" : "Add New Team Member"}</div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingMember ? editingMember.name : newMember.name}
                  onChange={(e) => {
                    if (editingMember) {
                      setEditingMember({ ...editingMember, name: e.target.value })
                    } else {
                      setNewMember({ ...newMember, name: e.target.value })
                    }
                    if (errors.name) setErrors({ ...errors, name: "" })
                  }}
                  placeholder="Enter name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editingMember ? editingMember.role : newMember.role}
                  onValueChange={(value) => {
                    if (editingMember) {
                      setEditingMember({ ...editingMember, role: value })
                    } else {
                      setNewMember({ ...newMember, role: value })
                    }
                    if (errors.role) setErrors({ ...errors, role: "" })
                  }}
                >
                  <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Developer">Developer</SelectItem>
                    <SelectItem value="Designer">Designer</SelectItem>
                    <SelectItem value="Team Member">Team Member</SelectItem>
                    <SelectItem value="Stakeholder">Stakeholder</SelectItem>
                    <SelectItem value="Client">Client</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "#4f46e5", // indigo
                    "#0891b2", // cyan
                    "#16a34a", // green
                    "#ca8a04", // yellow
                    "#dc2626", // red
                    "#9333ea", // purple
                    "#db2777", // pink
                    "#f97316", // orange
                    "#14b8a6", // teal
                    "#8b5cf6", // violet
                    "#6b7280", // gray
                    "#1e40af", // blue
                  ].map((color) => (
                    <div
                      key={color}
                      className={`h-8 w-8 cursor-pointer rounded-full ${
                        (editingMember ? editingMember.color : newMember.color) === color
                          ? "ring-2 ring-primary ring-offset-2"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        if (editingMember) {
                          setEditingMember({ ...editingMember, color })
                        } else {
                          setNewMember({ ...newMember, color })
                        }
                        if (errors.color) setErrors({ ...errors, color: "" })
                      }}
                    />
                  ))}
                </div>
                {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
              </div>

              <div className="pt-2">
                {editingMember ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditingMember(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateMember}>
                      <Check className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleAddMember}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Member
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Warnings */}
        {usageWarnings.length > 0 && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="mb-2">The following team members are assigned to tasks or projects:</p>
              <div className="flex flex-wrap gap-1">
                {usageWarnings.map((warning) => (
                  <Badge key={warning.id} variant="outline">
                    {warning.name} ({warning.usageCount} {warning.usageCount === 1 ? "assignment" : "assignments"})
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-xs">Removing these members will also remove them from all assignments.</p>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
