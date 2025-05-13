"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useSWRConfig } from "swr"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"

interface CreateGroupDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface UserOption {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string | null
}

interface FormValues {
  name: string
  description: string
  avatar_url: string
  selectedUsers: string[]
}

export function CreateGroupDialog({ isOpen, onClose }: CreateGroupDialogProps) {
  const { mutate } = useSWRConfig()
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      avatar_url: "",
      selectedUsers: [],
    },
  })

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([])
      return
    }

    setIsSearching(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email")
        .or(`display_name.ilike.%${query}%, email.ilike.%${query}%`)
        .neq("id", user?.id)
        .limit(10)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Error searching users",
        description: "Could not find users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const onSubmit = async (data: FormValues) => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user for the group chat.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Call our create_group_chat function
      const { data: groupId, error } = await supabase.rpc("create_group_chat", {
        group_name: data.name,
        group_description: data.description,
        avatar_url: data.avatar_url,
        member_ids: selectedUsers,
      })

      if (error) throw error

      // Refresh conversations list
      mutate("/api/messages/conversations")

      // Navigate to the new conversation
      if (groupId) {
        router.push(`/messages?conversation=${groupId}`)
      }

      onClose()
      reset()
      setSelectedUsers([])

      toast({
        title: "Group created",
        description: "Your group chat has been created successfully.",
      })
    } catch (error) {
      console.error("Error creating group:", error)
      toast({
        title: "Error creating group",
        description: "Could not create group chat. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedUsers([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create New Group Chat</DialogTitle>
          <DialogDescription>Create a group chat to message multiple people at once</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="Enter group name"
                {...register("name", { required: "Group name is required" })}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="Enter group description" {...register("description")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="avatar_url">Avatar URL (optional)</Label>
              <Input id="avatar_url" placeholder="https://example.com/avatar.png" {...register("avatar_url")} />
            </div>

            <div className="grid gap-2">
              <Label>Add Members</Label>
              <Input placeholder="Search users by name or email" onChange={(e) => searchUsers(e.target.value)} />

              {isSearching ? (
                <div className="text-center py-2">Searching...</div>
              ) : (
                <>
                  {users.length > 0 && (
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      <div className="space-y-2">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => toggleUser(user.id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback>{user.display_name?.[0] || user.email?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                              {user.display_name || user.email || "Unknown user"}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {selectedUsers.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {selectedUsers.length} user{selectedUsers.length !== 1 && "s"} selected
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
