"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  swipeLeftAction?: string
  swipeRightAction?: string
  swipeThreshold?: number
  children: React.ReactNode
}

export function MobileCard({
  className,
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeLeftAction = "Delete",
  swipeRightAction = "Archive",
  swipeThreshold = 100,
  ...props
}: MobileCardProps) {
  const [swipeDirection, setSwipeDirection] = React.useState<"left" | "right" | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDragEnd = (e: any, info: any) => {
    setIsDragging(false)

    if (info.offset.x < -swipeThreshold && onSwipeLeft) {
      setSwipeDirection("left")
      setTimeout(() => {
        onSwipeLeft()
        setSwipeDirection(null)
      }, 200)
    } else if (info.offset.x > swipeThreshold && onSwipeRight) {
      setSwipeDirection("right")
      setTimeout(() => {
        onSwipeRight()
        setSwipeDirection(null)
      }, 200)
    }
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)} {...props}>
      {/* Background action indicators */}
      {(onSwipeLeft || onSwipeRight) && (
        <div className="absolute inset-0 flex justify-between items-center px-4">
          {onSwipeRight && (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm font-medium text-green-500">{swipeRightAction}</span>
            </div>
          )}
          {onSwipeLeft && (
            <div className="flex items-center justify-center h-full ml-auto">
              <span className="text-sm font-medium text-red-500">{swipeLeftAction}</span>
            </div>
          )}
        </div>
      )}

      {/* Card content with swipe functionality */}
      <motion.div
        drag={onSwipeLeft || onSwipeRight ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={swipeDirection === "left" ? { x: "-100%" } : swipeDirection === "right" ? { x: "100%" } : { x: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className={cn(
          "bg-card text-card-foreground shadow-sm border rounded-lg",
          isDragging ? "cursor-grabbing" : onSwipeLeft || onSwipeRight ? "cursor-grab" : "",
        )}
      >
        {children}
      </motion.div>
    </div>
  )
}
