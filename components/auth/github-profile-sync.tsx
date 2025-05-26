"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { syncGitHubProfile } from "@/lib/github-profile-helper"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Github, RefreshCw } from "lucide-react"

export function GitHubProfileSync() {
  const { user, profile, isAuthenticated } = useAuth()
  const [isSyncing, setIsSyncing] = useState(false)

  const isGitHubUser = user?.id && profile?.github_username

  const handleSync = async () => {
    if (!user?.id) return

    setIsSyncing(true)
    try {
      const success = await syncGitHubProfile(user.id)

      if (success) {
        toast({
          title: "Profile Synchronized",
          description: "Your GitHub profile has been successfully synchronized.",
        })
      } else {
        toast({
          title: "Sync Failed",
          description: "Failed to synchronize your GitHub profile. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error syncing GitHub profile:", error)
      toast({
        title: "Sync Error",
        description: "An unexpected error occurred while syncing your profile.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Github className="mr-2 h-5 w-5" />
          GitHub Profile
        </CardTitle>
        <CardDescription>Manage your GitHub profile integration</CardDescription>
      </CardHeader>
      <CardContent>
        {isGitHubUser ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium">GitHub Username:</span>
              <span>{profile.github_username}</span>
            </div>
            {profile.avatar_url && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Avatar:</span>
                <img
                  src={profile.avatar_url || "/placeholder.svg"}
                  alt="GitHub Avatar"
                  className="h-10 w-10 rounded-full"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Your account is linked to GitHub. You can synchronize your profile to get the latest information from
              GitHub.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Your account is not linked to GitHub. Sign in with GitHub to link your account.
            </p>
          </div>
        )}
      </CardContent>
      {isGitHubUser && (
        <CardFooter>
          <Button onClick={handleSync} disabled={isSyncing} className="w-full">
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync GitHub Profile
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
