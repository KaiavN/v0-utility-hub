"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { forceSaveAllData } from "@/lib/data-manager"
import { useToast } from "@/components/ui/use-toast"
import { flushLocalStorageWrites } from "@/lib/utils"

export function GlobalSaveButton() {
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSaveAll = () => {
    if (isSaving) return

    setIsSaving(true)

    try {
      console.log("🔄 Global Save: Starting save operation")

      // Get the current plannerData from localStorage
      if (typeof window !== "undefined") {
        // First try to get the current state from the calendar component if available
        if ((window as any).debugPlannerData) {
          const currentData = (window as any).debugPlannerData()
          console.log("🔄 Global Save: Retrieved current data from calendar component", currentData)
        }

        // Force save using the calendar component's function if available
        if ((window as any).forceSavePlannerData) {
          console.log("🔄 Global Save: Using calendar's forceSavePlannerData function")
          ;(window as any).forceSavePlannerData()
        }

        // Also use the data manager's function
        forceSaveAllData()

        // Verify the save
        const rawData = window.localStorage.getItem("plannerData")
        if (rawData) {
          try {
            const plannerData = JSON.parse(rawData)
            console.log("✅ Global Save: Verified plannerData was saved", {
              blocksCount: plannerData.blocks ? plannerData.blocks.length : 0,
              hasSettings: !!plannerData.settings,
              hasStats: !!plannerData.stats,
            })
          } catch (error) {
            console.error("❌ Global Save: Error parsing saved plannerData", error)
          }
        } else {
          console.warn("⚠️ Global Save: No plannerData found in localStorage after save")
        }
      }

      // Flush any pending writes
      flushLocalStorageWrites()

      toast({
        title: "Data Saved",
        description: "All your data has been saved successfully.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error saving data:", error)
      toast({
        title: "Error saving data",
        description: "There was a problem saving your data. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSaveAll} disabled={isSaving} className="flex items-center gap-2">
      <Save className="h-4 w-4" />
      <span>{isSaving ? "Saving..." : "Save All Data"}</span>
    </Button>
  )
}
