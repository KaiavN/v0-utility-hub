"use client"

// A simple event bus for real-time data updates
type EventCallback = (data?: any) => void

interface EventMap {
  [eventName: string]: EventCallback[]
}

class EventBus {
  private events: EventMap = {}

  // Subscribe to an event
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter((cb) => cb !== callback)
    }
  }

  // Publish an event
  publish(event: string, data?: any): void {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(data))
    }
  }
}

// Create a singleton instance
export const eventBus = new EventBus()

// Custom hook for components to use
import { useEffect, useState } from "react"

export function useEventSubscription<T>(eventName: string, initialData?: T): T | undefined {
  const [data, setData] = useState<T | undefined>(initialData)

  useEffect(() => {
    // Subscribe to the event
    const unsubscribe = eventBus.subscribe(eventName, (newData) => {
      setData(newData)
    })

    // Cleanup subscription
    return unsubscribe
  }, [eventName])

  return data
}

// Helper hook for specific data collections
export function useDataSubscription<T>(collection: string, initialData: T): T {
  const updatedData = useEventSubscription<T>(`data:${collection}:updated`, initialData)
  return updatedData || initialData
}
