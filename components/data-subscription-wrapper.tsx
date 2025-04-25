"use client"

import { type ReactNode, useEffect, useState } from "react"
import { eventBus } from "@/lib/event-bus"
import { getLocalStorage } from "@/lib/local-storage"

interface DataSubscriptionWrapperProps {
  children: ReactNode
  collection: string
  storageKey?: string
  onDataUpdate?: (data: any) => void
}

export function DataSubscriptionWrapper({
  children,
  collection,
  storageKey,
  onDataUpdate,
}: DataSubscriptionWrapperProps) {
  const [, setUpdateCounter] = useState(0)

  useEffect(() => {
    // Subscribe to specific collection updates
    const unsubscribe1 = eventBus.subscribe(`data:${collection}:updated`, (data) => {
      console.log(`Data updated for ${collection}`, data ? "with data" : "without data")

      // If we have a callback, call it with the data
      if (onDataUpdate) {
        if (data) {
          onDataUpdate(data)
        } else if (storageKey) {
          // If no data provided but we have a storage key, get from localStorage
          const storedData = getLocalStorage(storageKey, null)
          onDataUpdate(storedData)
        }
      }

      // Force a re-render
      setUpdateCounter((prev) => prev + 1)
    })

    // Subscribe to general updates
    const unsubscribe2 = eventBus.subscribe("data:updated", (updateInfo) => {
      if (updateInfo?.collection === collection) {
        console.log(`General data update for ${collection}`)

        // If we have a callback and storage key, get from localStorage
        if (onDataUpdate && storageKey) {
          const storedData = getLocalStorage(storageKey, null)
          onDataUpdate(storedData)
        }

        // Force a re-render
        setUpdateCounter((prev) => prev + 1)
      }
    })

    return () => {
      unsubscribe1()
      unsubscribe2()
    }
  }, [collection, storageKey, onDataUpdate])

  return <>{children}</>
}
