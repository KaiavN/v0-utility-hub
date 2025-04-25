"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Check, Info, Plus, Pencil, Trash2 } from "lucide-react"
import type { DataEditOperation } from "@/lib/ai-data-editor"
import { generateDataEditSummary, generateDataEditDetails } from "@/lib/ai-data-editor"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataEditApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: DataEditOperation | DataEditOperation[] | null
  onApprove: () => void
  onReject: () => void
}

export function DataEditApprovalDialog({
  open,
  onOpenChange,
  operation,
  onApprove,
  onReject,
}: DataEditApprovalDialogProps) {
  const [tab, setTab] = useState("summary")
  const [isApproving, setIsApproving] = useState(false)
  const [selectedOperationIndex, setSelectedOperationIndex] = useState(0)

  if (!operation) return null

  const operations = Array.isArray(operation) ? operation : [operation]
  const currentOperation = operations[selectedOperationIndex]

  const summary = generateDataEditSummary(operation)
  const details = generateDataEditDetails(currentOperation)

  // Get operation type icon
  const getOperationIcon = (op: DataEditOperation) => {
    switch (op.type) {
      case "add":
        return <Plus className="h-4 w-4" />
      case "update":
        return <Pencil className="h-4 w-4" />
      case "delete":
        return <Trash2 className="h-4 w-4" />
      default:
        return null
    }
  }

  // Get operation type badge with friendly colors and labels
  const getOperationBadge = (op: DataEditOperation) => {
    switch (op.type) {
      case "add":
        return <Badge className="bg-green-500 hover:bg-green-600">{getOperationIcon(op)} Add</Badge>
      case "update":
        return <Badge className="bg-blue-500 hover:bg-blue-600">{getOperationIcon(op)} Update</Badge>
      case "delete":
        return <Badge className="bg-red-500 hover:bg-red-600">{getOperationIcon(op)} Delete</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  // Get a user-friendly name for the collection
  const getCollectionName = (collection: string) => {
    return collection.replace(/([A-Z])/g, " $1").trim()
  }

  const handleApprove = async () => {
    setIsApproving(true)
    await onApprove()
    setIsApproving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{operations.length > 1 ? "Approve Multiple Changes" : "Approve Change"}</DialogTitle>
            {operations.length > 1 ? (
              <Badge className="bg-primary">{operations.length} changes</Badge>
            ) : (
              getOperationBadge(currentOperation)
            )}
          </div>
          <DialogDescription>
            The AI assistant wants to {operations.length > 1 ? "make several changes" : "make a change"} to your data.
            Please review and approve if everything looks correct.
          </DialogDescription>
        </DialogHeader>

        {operations.length > 1 && (
          <div className="mb-4">
            <Label>Select change to view details:</Label>
            <Select
              value={selectedOperationIndex.toString()}
              onValueChange={(value) => setSelectedOperationIndex(Number.parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select change" />
              </SelectTrigger>
              <SelectContent>
                {operations.map((op, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    <div className="flex items-center gap-2">
                      {getOperationBadge(op)}
                      <span>
                        {op.type === "add" ? "Add new" : op.type === "update" ? "Update" : "Delete"}{" "}
                        {getCollectionName(op.collection).toLowerCase()}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="text-lg font-medium">{summary}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {Array.isArray(operation)
                      ? `This will modify data in: ${[...new Set(operations.map((op) => op.collection))].map((c) => getCollectionName(c)).join(", ")}`
                      : details}
                  </p>

                  {(Array.isArray(operation) && operation.some((op) => op.type === "delete")) ||
                  (!Array.isArray(operation) && currentOperation.type === "delete") ? (
                    <div className="mt-3 flex items-start gap-3 bg-red-100 dark:bg-red-900/20 p-3 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-400">
                        This will permanently delete data. This action cannot be undone.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="details" className="mt-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">
                {operations.length > 1
                  ? `Change ${selectedOperationIndex + 1} of ${operations.length}`
                  : "What will change"}
              </h3>
              <div className="bg-background p-3 rounded-md overflow-auto max-h-[200px] whitespace-pre-wrap text-sm">
                {details}
              </div>

              {currentOperation.data && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Data Preview</h3>
                  <div className="bg-background p-3 rounded-md overflow-auto max-h-[200px]">
                    <code className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(currentOperation.data, null, 2)}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex space-x-2 mt-4">
          <Button variant="outline" onClick={onReject} disabled={isApproving}>
            Reject
          </Button>
          <Button onClick={handleApprove} disabled={isApproving} className="relative">
            {isApproving ? (
              <>
                <span className="opacity-0">Approve</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Approve {operations.length > 1 ? "All" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
