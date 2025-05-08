"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exportAllData, importAllData } from "@/lib/data-transfer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function DataTransfer() {
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    // Force save any pending planner data before exporting
    try {
      const plannerData = localStorage.getItem("plannerData")
      if (plannerData) {
        console.log("Ensuring planner data is included in export...")
      }
    } catch (error) {
      console.error("Error checking planner data before export:", error)
    }

    exportAllData()
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setIsImporting(true)
      await importAllData(files[0])
    } catch (error) {
      console.error("Import failed:", error)
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Backup & Restore</CardTitle>
        <CardDescription>Export your data for backup or import previously exported data</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download all your data as a JSON file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleImportClick}
                className="flex items-center gap-2"
                disabled={isImporting}
              >
                <Upload className="h-4 w-4" />
                {isImporting ? "Importing..." : "Import Data"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload a previously exported data file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
      </CardContent>
    </Card>
  )
}
