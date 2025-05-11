// Types for cross-feature linking

export type ItemType =
  | "task"
  | "project"
  | "ganttTask"
  | "ganttProject"
  | "client"
  | "note"
  | "meeting"
  | "billing"
  | "contact"
  | "document"
  | "assignment"
  | "event"
  | "codeSnippet"
  | "finance"

export interface LinkedItem {
  id: string
  type: ItemType
  title: string
  description?: string
  date?: string
  url?: string
  sourceId: string
  sourceType: ItemType
  createdAt: string
}

export interface LinkableItem {
  id: string
  title: string
  type: ItemType
  description?: string
  date?: string
}
