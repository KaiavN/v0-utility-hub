"use client"

import type React from "react"

interface Task {
  id: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  progress: number
  assignee?: string
  priority?: "low" | "medium" | "high"
  status?: "not-started" | "in-progress" | "completed" | "on-hold"
}

interface TaskDetailProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (id: string) => void
}

const TaskDetail: React.FC<TaskDetailProps> = ({ task, onEdit, onDelete }) => {
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "not-started":
        return "Not Started"
      case "in-progress":
        return "In Progress"
      case "completed":
        return "Completed"
      case "on-hold":
        return "On Hold"
      default:
        return "Not Started"
    }
  }

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case "low":
        return "Low"
      case "medium":
        return "Medium"
      case "high":
        return "High"
      default:
        return "Medium"
    }
  }

  return (
    <div className="task-detail">
      <h2>{task.name}</h2>

      {task.description && (
        <div className="task-description">
          <h3>Description</h3>
          <p>{task.description}</p>
        </div>
      )}

      <div className="task-info">
        <div className="info-item">
          <span className="label">Start Date:</span>
          <span>{task.startDate.toLocaleDateString()}</span>
        </div>

        <div className="info-item">
          <span className="label">End Date:</span>
          <span>{task.endDate.toLocaleDateString()}</span>
        </div>

        <div className="info-item">
          <span className="label">Progress:</span>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${task.progress}%` }}></div>
            <span>{task.progress}%</span>
          </div>
        </div>

        {task.assignee && (
          <div className="info-item">
            <span className="label">Assignee:</span>
            <span>{task.assignee}</span>
          </div>
        )}

        {task.status && (
          <div className="info-item">
            <span className="label">Status:</span>
            <span className={`status status-${task.status}`}>{getStatusLabel(task.status)}</span>
          </div>
        )}

        {task.priority && (
          <div className="info-item">
            <span className="label">Priority:</span>
            <span className={`priority priority-${task.priority}`}>{getPriorityLabel(task.priority)}</span>
          </div>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="task-actions">
          {onEdit && (
            <button onClick={() => onEdit(task)} className="edit-btn">
              Edit
            </button>
          )}

          {onDelete && (
            <button onClick={() => onDelete(task.id)} className="delete-btn">
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default TaskDetail
