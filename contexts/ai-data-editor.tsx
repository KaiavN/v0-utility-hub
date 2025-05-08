"\"use client"

// Define the data edit operation type
export interface DataEditOperation {
  type: "add" | "update" | "delete"
  collection: string
  id?: string
  query?: Record<string, any>
  data?: any
}
