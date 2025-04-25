"use client"

import { useEffect } from "react"
import { optimizeStorage, loadAllData, saveAllData, migrateDataIfNeeded, checkAndRepairData } from "@/lib/data-manager"
import { flushLocalStorageWrites } from "@/lib/local-storage"

export function DataManager() {
  // Run initialization on load
  useEffect(() => {
    // Wait for the app to be fully loaded
    const timeoutId = setTimeout(() => {
      // Check for data migrations
      migrateDataIfNeeded()

      // Check and repair any corrupted data
      checkAndRepairData()

      // Optimize storage
      optimizeStorage()
    }, 2000) // 2 seconds after load

    return () => clearTimeout(timeoutId)
  }, [])

  // Set up periodic optimization
  useEffect(() => {
    // Optimize storage every hour
    const intervalId = setInterval(
      () => {
        optimizeStorage()
      },
      60 * 60 * 1000,
    ) // 1 hour

    return () => clearInterval(intervalId)
  }, [])

  // Set up auto-save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // This ensures any in-memory data is saved before the page unloads
      const data = loadAllData()
      saveAllData(data)
      flushLocalStorageWrites() // Ensure all pending writes are processed
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // Set up periodic auto-save
  useEffect(() => {
    // Auto-save every 5 minutes
    const intervalId = setInterval(
      () => {
        const data = loadAllData()
        saveAllData(data)
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => clearInterval(intervalId)
  }, [])

  return null // This component doesn't render anything
}
