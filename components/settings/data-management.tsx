"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exportAllData } from "@/lib/data-transfer"
import { ImportDataDialog } from "./import-data-dialog"
import { AlertCircle, Download, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DataManagement() {
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await exportAllData()
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Export your data for backup or import from a previous backup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Always backup your data regularly to prevent loss. Your data is stored locally in your browser.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleExport} disabled={isExporting} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export All Data"}
          </Button>

          <Button onClick={() => setShowImportDialog(true)} variant="outline" className="flex-1">
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
        </div>

        {showImportDialog && <ImportDataDialog onClose={() => setShowImportDialog(false)} />}
      </CardContent>
    </Card>
  )
}
