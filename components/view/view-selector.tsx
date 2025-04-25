"use client"

import type React from "react"

type ViewType = "gantt" | "board" | "calendar" | "list"

interface ViewOption {
  id: ViewType
  label: string
  icon?: React.ReactNode
}

interface ViewSelectorProps {
  views: ViewOption[]
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

const ViewSelector: React.FC<ViewSelectorProps> = ({ views, activeView, onViewChange }) => {
  return (
    <div className="view-selector">
      {views.map((view) => (
        <button
          key={view.id}
          className={`view-option ${activeView === view.id ? "active" : ""}`}
          onClick={() => onViewChange(view.id)}
          aria-pressed={activeView === view.id}
        >
          {view.icon && <span className="view-icon">{view.icon}</span>}
          <span className="view-label">{view.label}</span>
        </button>
      ))}
    </div>
  )
}

export default ViewSelector
