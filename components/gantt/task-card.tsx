import type React from "react"

interface TaskCardProps {
  title: string
  startDate: Date
  endDate: Date
  progress: number
}

const TaskCard: React.FC<TaskCardProps> = ({ title, startDate, endDate, progress }) => {
  return (
    <div className="task-card">
      <div className="task-title">{title}</div>
      <div className="task-dates">
        <span>Start: {startDate.toLocaleDateString()}</span>
        <span>End: {endDate.toLocaleDateString()}</span>
      </div>
      <div className="task-progress">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        <span>{progress}%</span>
      </div>
    </div>
  )
}

export default TaskCard
