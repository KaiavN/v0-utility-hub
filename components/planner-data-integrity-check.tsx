"use client"

import { useEffect, useState } from "react"
import { runPlannerDataDiagnostic, fixPlannerDataIssues } from "@/lib/planner-data-diagnostic"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Add this at the top of the file, after the imports
const DEBUG = process.env.NODE_ENV === "development"

// Create a structured logger helper
const logger = {
  info: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.info(`%c🧪 INTEGRITY CHECK: ${message}`, "color: #3b82f6; font-weight: bold;", ...data)
  },
  success: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.log(`%c✅ INTEGRITY CHECK: ${message}`, "color: #10b981; font-weight: bold;", ...data)
  },
  warn: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.warn(`%c⚠️ INTEGRITY CHECK: ${message}`, "color: #f59e0b; font-weight: bold;", ...data)
  },
  error: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.error(`%c❌ INTEGRITY CHECK: ${message}`, "color: #ef4444; font-weight: bold;", ...data)
  },
  group: (name: string) => {
    if (!DEBUG) return
    console.group(`%c📋 INTEGRITY CHECK: ${name}`, "color: #8b5cf6; font-weight: bold;")
  },
  groupEnd: () => {
    if (!DEBUG) return
    console.groupEnd()
  },
  debug: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.debug(`%c🔍 INTEGRITY CHECK: ${message}`, "color: #6b7280; font-weight: bold;", ...data)
  },
}

// Add a new function after the logger object:

// Run a periodic check in background
function runPeriodicCheck() {
  if (!DEBUG) return

  try {
    const result = runPlannerDataDiagnostic()
    if (result.issues.length > 0) {
      logger.warn("Periodic check found issues:", result.issues)
    }

    // Deep validate occasionally
    if (Math.random() < 0.2) {
      // 20% chance
      const { deepValidatePlannerData } = require("@/lib/planner-data-diagnostic")
      const validationResult = deepValidatePlannerData()
      if (validationResult.removed > 0) {
        logger.warn(`Deep validation removed ${validationResult.removed} problematic blocks`)
      }
    }
  } catch (error) {
    logger.error("Error in periodic check:", error)
  }
}

export function PlannerDataIntegrityCheck() {
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [issues, setIssues] = useState<string[]>([])
  const [fixed, setFixed] = useState<string[]>([])

  useEffect(() => {
    // Run diagnostic on mount
    const checkData = async () => {
      try {
        const result = runPlannerDataDiagnostic()

        if (result.issues.length > 0) {
          logger.warn("Planner data issues detected:", result.issues)
          setIssues(result.issues)

          // Run deep validation if issues are found
          const { deepValidatePlannerData } = require("@/lib/planner-data-diagnostic")
          const validationResult = await deepValidatePlannerData()

          if (validationResult.removed > 0) {
            const newIssue = `Deep validation removed ${validationResult.removed} problematic blocks`
            setIssues((prev) => [...prev, newIssue])

            // Add to fixed items if automatic
            if (validationResult.success) {
              setFixed((prev) => [...prev, newIssue])

              // Show toast for auto-fixed issues
              toast({
                title: "Calendar data issues fixed",
                description: `${result.fixed.length + 1} issues with your calendar data were automatically fixed.`,
                duration: 5000,
              })
            } else {
              // Show dialog for unfixed issues
              setShowDialog(true)
            }
          }

          if (result.fixed.length > 0) {
            logger.success("Issues automatically fixed:", result.fixed)
            setFixed(result.fixed)

            // Show toast for auto-fixed issues
            toast({
              title: "Calendar data issues fixed",
              description: `${result.fixed.length} issues with your calendar data were automatically fixed.`,
              duration: 5000,
            })
          } else {
            // Show dialog for unfixed issues
            setShowDialog(true)
          }
        } else {
          // Run occasional deep validation even if no issues
          if (Math.random() < 0.2) {
            // 20% chance
            const { deepValidatePlannerData } = require("@/lib/planner-data-diagnostic")
            await deepValidatePlannerData()
          }
        }
      } catch (error) {
        logger.error("Error checking planner data integrity:", error)
      }
    }

    // Delay check to avoid interfering with initial render
    const timer = setTimeout(checkData, 2000)

    // Set up a periodic check (every 10 minutes)
    const periodicTimer = setInterval(runPeriodicCheck, 10 * 60 * 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(periodicTimer)
    }
  }, [toast])

  const handleFixIssues = () => {
    try {
      const { deepValidatePlannerData } = require("@/lib/planner-data-diagnostic")
      const validationResult = deepValidatePlannerData()

      const success = fixPlannerDataIssues()

      if (success) {
        const message =
          validationResult.removed > 0
            ? `Your calendar data has been repaired (${validationResult.removed} invalid blocks removed). The page will reload to apply changes.`
            : "Your calendar data has been repaired. The page will reload to apply changes."

        toast({
          title: "Calendar data fixed",
          description: message,
          duration: 5000,
        })

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast({
          title: "Unable to fix calendar data",
          description: "Please try clearing your browser cache and reloading the page.",
          variant: "destructive",
          duration: 5000,
        })
      }

      setShowDialog(false)
    } catch (error) {
      logger.error("Error fixing planner data:", error)
      toast({
        title: "Error fixing calendar data",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Calendar Data Issues Detected
            </DialogTitle>
            <DialogDescription>
              We've detected issues with your calendar data that may cause problems with saving or loading your
              schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 text-sm">
            <p className="font-medium mb-2">Issues found:</p>
            <ul className="list-disc pl-5 space-y-1">
              {issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>

            {fixed.length > 0 && (
              <>
                <p className="font-medium mt-4 mb-2">Already fixed:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {fixed.map((fix, index) => (
                    <li key={index} className="text-green-600 dark:text-green-400">
                      {fix}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Ignore
            </Button>
            <Button onClick={handleFixIssues}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Fix Issues
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
