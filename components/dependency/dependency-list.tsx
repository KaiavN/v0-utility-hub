"use client"

import type React from "react"

interface Dependency {
  id: string
  fromTask: string
  toTask: string
  type: "finish-to-start" | "start-to-start" | "finish-to-finish" | "start-to-finish"
}

interface DependencyListProps {
  dependencies: Dependency[]
  onDelete?: (id: string) => void
}

const DependencyList: React.FC<DependencyListProps> = ({ dependencies, onDelete }) => {
  if (!dependencies || dependencies.length === 0) {
    return <div>No dependencies defined</div>
  }

  const getTypeLabel = (type: Dependency["type"]) => {
    switch (type) {
      case "finish-to-start":
        return "Finish to Start"
      case "start-to-start":
        return "Start to Start"
      case "finish-to-finish":
        return "Finish to Finish"
      case "start-to-finish":
        return "Start to Finish"
      default:
        return type
    }
  }

  return (
    <div className="dependency-list">
      <h3>Dependencies</h3>
      <ul>
        {dependencies.map((dep) => (
          <li key={dep.id} className="dependency-item">
            <span>From: {dep.fromTask}</span>
            <span>To: {dep.toTask}</span>
            <span>Type: {getTypeLabel(dep.type)}</span>
            {onDelete && (
              <button
                onClick={() => onDelete(dep.id)}
                className="delete-btn"
                aria-label={`Delete dependency ${dep.id}`}
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DependencyList
