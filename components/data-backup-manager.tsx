"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Save, Upload, Download } from "lucide-react"
import { exportAllData, importAllData, ImportMode } from "@/lib/data-transfer"

export function DataBackupManager() {
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [backupStatus, setBackupStatus] = useState<"idle" | "success" | "error">("idle")
  const { toast } = useToast()

  // Load last backup time from localStorage
  useEffect(() => {
    const storedLastBackup = localStorage.getItem("lastDataBackup")
    if (storedLastBackup) {
      setLastBackup(storedLastBackup)
    }
  }, [])

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true)
      setBackupStatus("idle")

      // First, ensure all critical data is properly saved
      const plannerData = localStorage.getItem("plannerData")
      const markdownDocuments = localStorage.getItem("markdownDocuments")

      // Log the state of critical data before export
      console.log("Planner data before export:", plannerData ? "exists" : "missing")
      console.log("Markdown documents before export:", markdownDocuments ? "exists" : "missing")

      // Perform the export
      await exportAllData()

      // Update last backup time
      const now = new Date().toISOString()
      localStorage.setItem("lastDataBackup", now)
      setLastBackup(now)
      setBackupStatus("success")

      // Verify critical data is still intact after export
      const plannerDataAfter = localStorage.getItem("plannerData")
      const markdownDocumentsAfter = localStorage.getItem("markdownDocuments")

      console.log("Planner data after export:", plannerDataAfter ? "exists" : "missing")
      console.log("Markdown documents after export:", markdownDocumentsAfter ? "exists" : "missing")

      // Check if any data was lost
      if (plannerData && !plannerDataAfter) {
        console.error("Planner data was lost during export!")
        // Restore the data
        localStorage.setItem("plannerData", plannerData)
        toast({
          title: "Data Recovery",
          description: "Planner data was restored after an issue during export.",
          variant: "warning",
        })
      }

      if (markdownDocuments && !markdownDocumentsAfter) {
        console.error("Markdown documents were lost during export!")
        // Restore the data
        localStorage.setItem("markdownDocuments", markdownDocuments)
        toast({
          title: "Data Recovery",
          description: "Markdown documents were restored after an issue during export.",
          variant: "warning",
        })
      }

      toast({
        title: "Backup Complete",
        description: "Your data has been successfully exported.",
      })
    } catch (error) {
      console.error("Export error:", error)
      setBackupStatus("error")
      toast({
        title: "Backup Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Handle import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setBackupStatus("idle")

      // First, backup critical data
      const plannerData = localStorage.getItem("plannerData")
      const markdownDocuments = localStorage.getItem("markdownDocuments")

      // Store backups in memory
      const backups = {
        plannerData,
        markdownDocuments,
      }

      // Perform the import
      await importAllData(file, ImportMode.REPLACE)

      // Update last backup time
      const now = new Date().toISOString()
      localStorage.setItem("lastDataBackup", now)
      setLastBackup(now)
      setBackupStatus("success")

      toast({
        title: "Import Complete",
        description: "Your data has been successfully imported.",
      })
    } catch (error) {
      console.error("Import error:", error)
      setBackupStatus("error")
      toast({
        title: "Import Failed",
        description: "There was an error importing your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      // Reset the file input
      event.target.value = ""
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Save className="mr-2 h-5 w-5" />
          Data Backup & Recovery
        </CardTitle>
        <CardDescription>Backup and restore your application data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Last backup:</span>
            <span className="text-sm font-medium">{lastBackup ? new Date(lastBackup).toLocaleString() : "Never"}</span>
          </div>

          {backupStatus === "success" && (
            <div className="flex items-center text-green-500 bg-green-50 dark:bg-green-950/30 p-2 rounded">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">Operation completed successfully</span>
            </div>
          )}

          {backupStatus === "error" && (
            <div className="flex items-center text-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">An error occurred. Please try again.</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting || isImporting}
          className="flex items-center"
        >
          {isExporting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </>
          )}
        </Button>

        <div className="relative">
          <input
            type="file"
            id="import-file"
            accept=".json"
            onChange={handleImport}
            disabled={isExporting || isImporting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button variant="outline" disabled={isExporting || isImporting} className="flex items-center">
            {isImporting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
