"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, User, Shield, Key, LogOut } from "lucide-react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// Import the DbRepairButton component at the top of the file
import { DbRepairButton } from "@/components/auth/db-repair-button"

export default function SettingsPage() {
  const { user, isLoading: authLoading, updateProfile, logout, profile } = useAuth()
  const [username, setUsername] = useState(user?.username || "")
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      setUsername(user.username || "")
      setDisplayName(user.displayName || "")
      setAvatarUrl(user.avatarUrl || "")
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    // Validate username
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username",
        variant: "destructive",
      })
      return
    }

    if (username.length < 3 || username.length > 20) {
      toast({
        title: "Invalid Username",
        description: "Username must be between 3 and 20 characters",
        variant: "destructive",
      })
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({
        title: "Invalid Username",
        description: "Username can only contain letters, numbers, and underscores",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    try {
      const success = await updateProfile({
        username,
        displayName,
        avatarUrl,
      })

      if (success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully",
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    })
  }

  return (
    <AuthGuard
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Sign in to access settings</h2>
            <p className="text-muted-foreground mb-4">You need to be signed in to view and edit your settings</p>
          </div>
        </div>
      }
    >
      <div className="container py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="account">
                <Shield className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="security">
                <Key className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your profile information and how others see you</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile}>
                    <div className="grid gap-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={avatarUrl || ""} alt={username} />
                          <AvatarFallback>{username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Label htmlFor="avatar">Profile Picture</Label>
                          <Input
                            id="avatar"
                            value={avatarUrl || ""}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                            className="mt-1"
                          />
                          <p className="text-sm text-muted-foreground mt-1">Enter a URL for your profile picture</p>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted" />
                        <p className="text-sm text-muted-foreground">Your email cannot be changed</p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={isUpdating}
                        />
                        <p className="text-sm text-muted-foreground">This is your public username visible to others</p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={isUpdating}
                          placeholder="Your full name"
                        />
                        <p className="text-sm text-muted-foreground">This is your name as it will appear to others</p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          disabled={isUpdating}
                          placeholder="Tell us a little about yourself"
                          rows={4}
                        />
                      </div>

                      <Button type="submit" disabled={isUpdating || authLoading}>
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Profile"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              {profile?.role === "admin" && (
                <div className="mt-6 p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-4">Admin Database Tools</h3>
                  <DbRepairButton />
                </div>
              )}
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>Manage your account settings and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm text-muted-foreground">
                          Receive email notifications about account activity
                        </p>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                        aria-label="Toggle email notifications"
                      />
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">Account Actions</h3>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out of your account
                        </Button>
                        <Button variant="destructive" className="w-full justify-start">
                          Delete your account
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your password and security preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Change Password</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        To change your password, use the "Forgot Password" option on the login screen. We'll send you an
                        email with instructions to reset your password.
                      </p>
                      <Button variant="outline">Send Password Reset Email</Button>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button variant="outline">Enable Two-Factor Authentication</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
