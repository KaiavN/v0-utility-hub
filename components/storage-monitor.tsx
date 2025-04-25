"use client"

import { useState, useEffect } from "react"
import { getLocalStorageUsage, optimizeLocalStorage } from "@/lib/local-storage"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function StorageMonitor() {
  const [usage, setUsage] = useState({ used: 0, total: 5 * 1024 * 1024, percentage: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Update storage usage initially and every 30 seconds
    updateUsage()
    const interval = setInterval(updateUsage, 30000)

    return () => clearInterval(interval)
  }, [])

  const updateUsage = () => {
    const currentUsage = getLocalStorageUsage()
    setUsage(currentUsage)

    // Show warning if storage is getting full (over 80%)
    if (currentUsage.percentage > 80 && !isVisible) {
      setIsVisible(true)
      toast({
        title: "Storage Warning",
        description: `Your local storage is ${Math.round(currentUsage.percentage)}% full. Consider optimizing storage.`,
        variant: "destructive",
      })
    }
  }

  const handleOptimize = () => {
    optimizeLocalStorage()
    updateUsage()
    toast({
      title: "Storage Optimized",
      description: "Your local storage has been optimized.",
    })
  }

  // Only show when storage is getting full or when manually toggled
  if (!isVisible) return null

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center">
          <Database className="h-4 w-4 mr-2" />
          Local Storage Usage
        </CardTitle>
        <CardDescription className="text-xs">
          {(usage.used / 1024 / 1024).toFixed(2)} MB of {(usage.total / 1024 / 1024).toFixed(2)} MB used
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <Progress value={usage.percentage} className="h-2" />
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button variant="outline" size="sm" onClick={() => setIsVisible(false)}>
          Dismiss
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={updateUsage}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={handleOptimize}>
            <Trash2 className="h-3 w-3 mr-1" />
            Optimize
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
