"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { DataTransfer } from "@/components/data-transfer"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Briefcase } from "lucide-react"

export default function HomePage() {
  const { preferences, setRole, isStudent, isProfessional } = useUserPreferences()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Common features for both roles - memoized to prevent recreation on each render
  const commonFeatures = useMemo(
    () => [
      {
        title: "Daily Planner",
        description: "Plan your day with time blocks and tasks.",
        href: "/tasks",
      },
      {
        title: "Notes",
        description: "Create and organize your notes and thoughts.",
        href: "/notes",
      },
      {
        title: "Recipe Manager",
        description: "Store and organize your favorite recipes.",
        href: "/recipes",
      },
      {
        title: "Pomodoro Timer",
        description: "Stay focused with timed work and break sessions.",
        href: "/pomodoro",
      },
    ],
    [],
  )

  // Student-specific features - memoized
  const studentFeatures = useMemo(
    () => [
      {
        title: "Assignment Tracker",
        description: "Never miss a deadline with assignment tracking.",
        href: "/assignments",
      },
      {
        title: "Citation Generator",
        description: "Generate citations in APA, MLA, Chicago, and Harvard formats.",
        href: "/citations",
      },
    ],
    [],
  )

  // Professional-specific features - memoized
  const professionalFeatures = useMemo(
    () => [
      {
        title: "Finance Dashboard",
        description: "Track your income, expenses, and financial goals.",
        href: "/finance",
      },
      {
        title: "Project Tracker",
        description: "Manage professional projects and deadlines.",
        href: "/projects",
      },
    ],
    [],
  )

  // Determine which role-specific features to show - memoized
  const roleSpecificFeatures = useMemo(
    () => (isStudent() ? studentFeatures : professionalFeatures),
    [isStudent, studentFeatures, professionalFeatures],
  )

  if (!mounted) {
    // Return a placeholder with the same structure to prevent layout shift
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8 h-20"></div>
        <div className="mb-8 h-40"></div>
        <div className="mb-8 h-20"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl border bg-card p-6 shadow-sm"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Welcome to Utility Hub</h1>
        <p className="text-xl text-muted-foreground">
          All your productivity tools in one place, with data stored locally in your browser.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Choose Your Mode</CardTitle>
          <CardDescription>Select the mode that best fits your needs. You can change this anytime.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant={isStudent() ? "default" : "outline"}
              size="lg"
              className="h-auto flex items-center justify-start gap-4 p-4"
              onClick={() => setRole("student")}
            >
              <GraduationCap className="h-8 w-8" />
              <div className="text-left">
                <div className="font-bold">Student</div>
                <div className="text-sm text-muted-foreground">Access study tools, assignment trackers, and more</div>
              </div>
            </Button>

            <Button
              variant={isProfessional() ? "default" : "outline"}
              size="lg"
              className="h-auto flex items-center justify-start gap-4 p-4"
              onClick={() => setRole("professional")}
            >
              <Briefcase className="h-8 w-8" />
              <div className="text-left">
                <div className="font-bold">Professional</div>
                <div className="text-sm text-muted-foreground">Access finance tools, client management, and more</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8">
        <DataTransfer />
      </div>

      <h2 className="text-2xl font-bold mb-4">Featured Tools</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {roleSpecificFeatures.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group cursor-pointer rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            prefetch={false}
          >
            <h3 className="mb-2 text-lg font-medium">
              {feature.title}{" "}
              <ArrowRight className="ml-1 inline-block h-4 w-4 transition-transform group-hover:translate-x-1" />
            </h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </Link>
        ))}

        {commonFeatures.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="group cursor-pointer rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            prefetch={false}
          >
            <h3 className="mb-2 text-lg font-medium">
              {feature.title}{" "}
              <ArrowRight className="ml-1 inline-block h-4 w-4 transition-transform group-hover:translate-x-1" />
            </h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
