"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { forceSaveAllData } from "@/lib/data-manager"
import { flushLocalStorageWrites } from "@/lib/local-storage"
import { useToast } from "@/components/ui/use-toast"

export function GlobalSaveButton() {
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      // Force save all data
      forceSaveAllData()
      // Ensure all pending writes are processed
      flushLocalStorageWrites()

      toast({
        title: "Data saved",
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
    <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
      <Save className="h-4 w-4" />
      <span>{isSaving ? "Saving..." : "Save All Data"}</span>
    </Button>
  )
}
