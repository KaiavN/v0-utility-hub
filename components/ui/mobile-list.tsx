"use client"

import type * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { MobileCard } from "@/components/ui/mobile-card"

interface MobileListProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T) => string
  onItemSwipeLeft?: (item: T) => void
  onItemSwipeRight?: (item: T) => void
  swipeLeftAction?: string
  swipeRightAction?: string
  emptyState?: React.ReactNode
  isLoading?: boolean
  loadingItemCount?: number
}

export function MobileList<T>({
  className,
  items,
  renderItem,
  keyExtractor,
  onItemSwipeLeft,
  onItemSwipeRight,
  swipeLeftAction,
  swipeRightAction,
  emptyState,
  isLoading = false,
  loadingItemCount = 3,
  ...props
}: MobileListProps<T>) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)} {...props}>
        {Array.from({ length: loadingItemCount }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-muted rounded-lg h-24 w-full" />
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (items.length === 0 && emptyState) {
    return (
      <div className={cn("py-8", className)} {...props}>
        {emptyState}
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)} {...props}>
      <AnimatePresence initial={false}>
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MobileCard
              onSwipeLeft={onItemSwipeLeft ? () => onItemSwipeLeft(item) : undefined}
              onSwipeRight={onItemSwipeRight ? () => onItemSwipeRight(item) : undefined}
              swipeLeftAction={swipeLeftAction}
              swipeRightAction={swipeRightAction}
            >
              {renderItem(item, index)}
            </MobileCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
