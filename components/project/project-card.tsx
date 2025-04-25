"use client"

import type React from "react"

interface ProjectCardProps {
  id: string
  title: string
  description: string
  progress: number
  dueDate?: Date
  onClick?: (id: string) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({ id, title, description, progress, dueDate, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(id)
    }
  }

  return (
    <div className="project-card" onClick={handleClick}>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        <span>{progress}%</span>
      </div>
      {dueDate && <div className="due-date">Due: {dueDate.toLocaleDateString()}</div>}
    </div>
  )
}

export default ProjectCard
