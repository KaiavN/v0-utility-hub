"use client"

import { redirect } from "next/navigation"
import { useEventSubscription } from "@/lib/event-bus"
import { useState } from "react"
import { getLocalStorage } from "@/lib/local-storage"
import type { Task } from "@/lib/definitions"

export default function TasksRedirect() {
  const [tasks, setTasks] = useState<Task[]>([])

  // Subscribe to data updates
  useEventSubscription("data:tasks:updated", (updatedTasks) => {
    console.log("Tasks data updated, refreshing from event data or localStorage")
    if (updatedTasks) {
      setTasks(updatedTasks)
    } else {
      // Fallback to localStorage if the event doesn't include the data
      const savedTasks = getLocalStorage<Task[]>("tasks", [])
      setTasks(savedTasks)
    }
  })

  // Also subscribe to general data updates
  useEventSubscription("data:updated", (updateInfo) => {
    if (updateInfo?.collection === "tasks") {
      console.log("Tasks data updated via general event, refreshing from localStorage")
      const savedTasks = getLocalStorage<Task[]>("tasks", [])
      setTasks(savedTasks)
    }
  })
  redirect("/calendar")
}
