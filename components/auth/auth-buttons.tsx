"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { Loader2 } from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/supabase-auth"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AuthButtons() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Error checking current user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkCurrentUser()
  }, [])

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      await signOut()

      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      })

      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)

      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Button disabled variant="outline">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={user.user_metadata?.name || user.email} />
            <AvatarFallback>
              {(user.user_metadata?.name || user.email || "User").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm hidden md:inline">{user.user_metadata?.name || user.email}</span>
        </div>
        <Button onClick={handleSignOut} variant="outline" size="sm">
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <GoogleLoginButton variant="outline" size="sm" showErrors={false} />
    </div>
  )
}

export function AuthCard() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Authentication</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="pt-4">
            <div className="flex flex-col gap-2">
              <GoogleLoginButton fullWidth />
            </div>
          </TabsContent>
          <TabsContent value="signup" className="pt-4">
            <div className="flex flex-col gap-2">
              <GoogleLoginButton fullWidth />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Secure authentication powered by Supabase
      </CardFooter>
    </Card>
  )
}
