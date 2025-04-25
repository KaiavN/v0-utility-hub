"use client"

import { ImportMode, importAllData } from "@/lib/data-transfer"

interface ImportDataDialogProps {
  onClose: () => void
}

export function ImportDataDialog({ onClose }: ImportDataDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Import Data</h2>
        <p className="mb-4">Choose how you want to import your data:</p>

        <div className="space-y-4 mb-6">
          <button
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = ".json"
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  importAllData(file, ImportMode.REPLACE).finally(onClose)
                }
              }
              input.click()
            }}
            className="w-full py-2 px-4 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          >
            Replace All Data
          </button>

          <button
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = ".json"
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  importAllData(file, ImportMode.MERGE).finally(onClose)
                }
              }
              input.click()
            }}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Merge With Existing Data
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
