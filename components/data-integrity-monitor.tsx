"use client"

import { useEffect, useState } from "react"
import { validateDataIntegrity, performDataMaintenance, fixPlannerDataStructure } from "@/lib/data-manager"
import { repairCommonDataIssues, getLocalStorageUsage, flushLocalStorageWrites } from "@/lib/local-storage"
import { useToast } from "@/components/ui/use-toast"
import { recoverPlannerData } from "@/lib/planner-data-recovery"

// Add this at the top of the file, after the imports
const DEBUG = process.env.NODE_ENV === "development"

// Create a structured logger helper
const logger = {
  info: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.info(`%c🔄 MONITOR: ${message}`, "color: #3b82f6; font-weight: bold;", ...data)
  },
  success: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.log(`%c✅ MONITOR: ${message}`, "color: #10b981; font-weight: bold;", ...data)
  },
  warn: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.warn(`%c⚠️ MONITOR: ${message}`, "color: #f59e0b; font-weight: bold;", ...data)
  },
  error: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.error(`%c❌ MONITOR: ${message}`, "color: #ef4444; font-weight: bold;", ...data)
  },
  group: (name: string) => {
    if (!DEBUG) return
    console.group(`%c📋 MONITOR: ${name}`, "color: #8b5cf6; font-weight: bold;")
  },
  groupEnd: () => {
    if (!DEBUG) return
    console.groupEnd()
  },
  debug: (message: string, ...data: any[]) => {
    if (!DEBUG) return
    console.debug(`%c🔍 MONITOR: ${message}`, "color: #6b7280; font-weight: bold;", ...data)
  },
}

export function DataIntegrityMonitor() {
  const { toast } = useToast()
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  // Run data integrity checks on component mount and periodically
  useEffect(() => {
    // Fix plannerData structure immediately
    try {
      fixPlannerDataStructure()
    } catch (error) {
      logger.error("Error fixing plannerData structure:", error)
    }

    // Initial check with a slight delay to not impact page load
    const initialCheckTimeout = setTimeout(() => {
      runDataIntegrityChecks()
    }, 5000)

    // Set up periodic checks
    const intervalId = setInterval(
      () => {
        runDataIntegrityChecks()
      },
      30 * 60 * 1000,
    ) // Every 30 minutes

    // Clean up on unmount
    return () => {
      clearTimeout(initialCheckTimeout)
      clearInterval(intervalId)
    }
  }, [])

  // Run checks before page unload to ensure data is saved
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushLocalStorageWrites()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // Add a function to monitor and fix data issues more aggressively
  useEffect(() => {
    // Add event listener for page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        logger.info("Page became visible, checking data integrity...")
        // When the user returns to the tab, check data integrity
        runDataIntegrityChecks()
      } else if (document.visibilityState === "hidden") {
        // When the user leaves the tab, ensure all data is saved
        logger.info("Page hidden, flushing writes...")
        flushLocalStorageWrites()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // Function to run all data integrity checks
  const runDataIntegrityChecks = async () => {
    try {
      logger.info("Running data integrity checks...")

      // Fix plannerData structure first
      fixPlannerDataStructure()

      // Special recovery for planner data
      try {
        const plannerDataRecovered = recoverPlannerData()
        if (plannerDataRecovered) {
          logger.success("Successfully recovered planner data")
        }
      } catch (plannerError) {
        logger.error("Error recovering planner data:", plannerError)
      }

      // Check data integrity
      const isValid = validateDataIntegrity()

      if (!isValid) {
        logger.warn("Data integrity issues detected")
        toast({
          title: "Data Integrity Issues",
          description: "Some data issues were detected. Attempting to repair...",
          variant: "destructive",
        })

        // Perform maintenance
        await performDataMaintenance()

        // Repair common issues
        repairCommonDataIssues()
      }

      // Check storage usage
      const { percentage, used, total } = getLocalStorageUsage()
      if (percentage > 80) {
        toast({
          title: "Storage Usage High",
          description: `Your browser storage is ${percentage.toFixed(0)}% full (${(used / 1024 / 1024).toFixed(1)}MB/${(total / 1024 / 1024).toFixed(1)}MB)`,
          variant: "warning",
        })
      }

      setLastCheck(new Date())
    } catch (error) {
      logger.error("Error running data integrity checks:", error)
    }
  }

  // This component doesn't render anything visible
  return null
}
