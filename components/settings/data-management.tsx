"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImportDataDialog } from "./import-data-dialog"
import { exportAllData } from "@/lib/data-transfer"
import { DataBackupManager } from "@/components/data-backup-manager"

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportAllData()
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Tabs defaultValue="backup">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>

      <TabsContent value="backup" className="space-y-4 py-4">
        <DataBackupManager />
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export or import your application data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Export all your data to a JSON file for backup or transfer to another device. Import previously exported
              data to restore your information.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              {isExporting ? "Exporting..." : "Export All Data"}
            </Button>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              Import Data
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <ImportDataDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />
    </Tabs>
  )
}
