"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Award, BookOpen, CheckCircle } from "lucide-react"

// Types based on the database schema
type Achievement = {
  id: string
  name: string
  description: string
  points: number
  icon: string
  created_at: string
}

type AssignmentProgress = {
  id: string
  assignment_id: string
  user_id: string
  status: string
  score: number
  progress_percentage: number
  feedback: string
  work_submitted: string
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [assignments, setAssignments] = useState<AssignmentProgress[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !user) return

      setIsLoadingData(true)
      setError(null)

      try {
        const supabase = createClient(
          process.env.STORAGE_NEXT_PUBLIC_SUPABASE_URL!,
          process.env.STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        // Fetch user achievements (this is a mock query since we don't know the exact schema)
        const { data: achievementsData, error: achievementsError } = await supabase
          .from("achievements")
          .select("*")
          .limit(5)

        if (achievementsError) {
          console.error("Error fetching achievements:", achievementsError)
          throw new Error("Failed to load achievements")
        }

        // Fetch user assignment progress
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("assignment_progress")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(5)

        if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError)
          throw new Error("Failed to load assignments")
        }

        setAchievements(achievementsData || [])
        setAssignments(assignmentsData || [])
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchUserData()
  }, [isAuthenticated, user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in the useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.name || "User"}!</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Achievements Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : achievements.length > 0 ? (
              <ul className="space-y-4">
                {achievements.map((achievement) => (
                  <li key={achievement.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{achievement.name}</h3>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      <Badge variant="outline" className="mt-2">
                        {achievement.points} points
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No achievements yet</p>
            )}
          </CardContent>
        </Card>

        {/* Assignments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Assignment Progress
            </CardTitle>
            <CardDescription>Track your current assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : assignments.length > 0 ? (
              <ul className="space-y-4">
                {assignments.map((assignment) => (
                  <li key={assignment.id} className="p-3 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">Assignment #{assignment.assignment_id.substring(0, 8)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Status: <span className="font-medium">{assignment.status}</span>
                        </p>
                      </div>
                      {assignment.status === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{assignment.progress_percentage}%</span>
                      </div>
                      <Progress value={assignment.progress_percentage} className="h-2" />
                    </div>
                    {assignment.score !== null && (
                      <div className="mt-2 text-sm">
                        Score: <span className="font-medium">{assignment.score}/100</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No assignments in progress</p>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">Showing your {assignments.length} most recent assignments</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
