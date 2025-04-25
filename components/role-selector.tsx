"use client"

import { Button } from "@/components/ui/button"
import { useUserPreferences } from "@/contexts/user-preferences-context"
import { GraduationCap, Briefcase } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function RoleSelector() {
  const { preferences, setRole, isStudent, isProfessional } = useUserPreferences()
  const { toast } = useToast()

  // Add a guard to prevent rendering if preferences is not yet loaded
  if (!preferences) {
    return null // Return nothing if preferences aren't loaded yet
  }

  const handleRoleChange = (role: "student" | "professional") => {
    setRole(role)
    toast({
      title: `Switched to ${role === "student" ? "Student" : "Professional"} mode`,
      description: `You now have access to ${role === "student" ? "student" : "professional"}-specific features.`,
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isStudent() ? "default" : "outline"}
        size="sm"
        className="flex items-center gap-1"
        onClick={() => handleRoleChange("student")}
      >
        <GraduationCap className="h-4 w-4" />
        <span className="hidden sm:inline">Student</span>
      </Button>
      <Button
        variant={isProfessional() ? "default" : "outline"}
        size="sm"
        className="flex items-center gap-1"
        onClick={() => handleRoleChange("professional")}
      >
        <Briefcase className="h-4 w-4" />
        <span className="hidden sm:inline">Professional</span>
      </Button>
    </div>
  )
}
