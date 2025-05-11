"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Define the data edit operation type
export interface DataEditOperation {
  type: "add" | "update" | "delete"
  collection: string
  id?: string
  query?: Record<string, any>
  data?: any
}

interface AIDataEditorContextType {
  pendingOperation: DataEditOperation | DataEditOperation[] | null
  setPendingOperation: (operation: DataEditOperation | DataEditOperation[] | null) => void
  approveOperation: () => Promise<void>
  rejectOperation: () => void
  isDialogOpen: boolean
  setIsDialogOpen: (open: boolean) => void
}

const AIDataEditorContext = createContext<AIDataEditorContextType | undefined>(undefined)

export function useAIDataEditor() {
  const context = useContext(AIDataEditorContext)
  if (context === undefined) {
    throw new Error("useAIDataEditor must be used within an AIDataEditorProvider")
  }
  return context
}

interface AIDataEditorProviderProps {
  children: ReactNode
  onApproveOperation?: (operation: DataEditOperation | DataEditOperation[]) => Promise<void>
}

export function AIDataEditorProvider({ children, onApproveOperation }: AIDataEditorProviderProps) {
  const [pendingOperation, setPendingOperation] = useState<DataEditOperation | DataEditOperation[] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const approveOperation = async () => {
    if (pendingOperation && onApproveOperation) {
      await onApproveOperation(pendingOperation)
    }
    setPendingOperation(null)
    setIsDialogOpen(false)
  }

  const rejectOperation = () => {
    setPendingOperation(null)
    setIsDialogOpen(false)
  }

  return (
    <AIDataEditorContext.Provider
      value={{
        pendingOperation,
        setPendingOperation,
        approveOperation,
        rejectOperation,
        isDialogOpen,
        setIsDialogOpen,
      }}
    >
      {children}
    </AIDataEditorContext.Provider>
  )
}
