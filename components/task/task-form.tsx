"use client"

import type React from "react"
import { useState } from "react"

interface TaskFormProps {
  onSubmit: (taskName: string) => void
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit }) => {
  const [taskName, setTaskName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(taskName)
    setTaskName("")
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="taskName">Task Name:</label>
      <input type="text" id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} />
      <button type="submit">Add Task</button>
    </form>
  )
}

export default TaskForm
