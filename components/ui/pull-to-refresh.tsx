"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  pullDistance?: number
  loadingColor?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  pullDistance = 80,
  loadingColor = "text-primary",
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullY, setPullY] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull to refresh when at the top of the page
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return

      const currentY = e.touches[0].clientY
      const diff = currentY - startY.current

      // Only allow pulling down, not up
      if (diff > 0 && window.scrollY <= 0) {
        // Apply resistance to make it harder to pull
        const resistance = 0.4
        const newPullY = Math.min(diff * resistance, pullDistance)
        setPullY(newPullY)

        // Prevent default scrolling behavior when pulling
        if (newPullY > 0) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return

      if (pullY >= pullDistance * 0.6) {
        // Trigger refresh if pulled far enough
        setIsRefreshing(true)
        setPullY(0)
        try {
          await onRefresh()
        } catch (error) {
          console.error("Refresh failed:", error)
        } finally {
          setIsRefreshing(false)
        }
      } else {
        // Reset if not pulled far enough
        setPullY(0)
      }
      setIsPulling(false)
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isPulling, pullY, pullDistance, onRefresh])

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 flex justify-center z-10 pointer-events-none"
        style={{ top: -40 }}
        animate={{ y: pullY }}
      >
        {isRefreshing ? (
          <Loader2 className={`h-6 w-6 animate-spin ${loadingColor}`} />
        ) : (
          <div
            className={`h-6 w-6 rounded-full border-2 border-primary border-t-transparent ${pullY > pullDistance * 0.6 ? "opacity-100" : "opacity-50"}`}
          />
        )}
      </motion.div>

      {/* Loading indicator when refreshing */}
      {isRefreshing && (
        <div className="absolute top-2 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-sm">
            <Loader2 className={`h-5 w-5 animate-spin ${loadingColor}`} />
          </div>
        </div>
      )}

      {/* Content */}
      <motion.div animate={{ y: pullY }}>{children}</motion.div>
    </div>
  )
}
