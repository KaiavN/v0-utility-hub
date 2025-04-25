"use client"

import { useState, useEffect, useRef, type ReactNode, memo, useCallback } from "react"

interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  itemHeight: number
  windowHeight: number
  overscan?: number
  className?: string
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  windowHeight,
  overscan = 5,
  className = "",
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)
  const ticking = useRef(false)

  // Optimize scroll handler with requestAnimationFrame
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    lastScrollTop.current = containerRef.current.scrollTop

    if (!ticking.current) {
      requestAnimationFrame(() => {
        setScrollTop(lastScrollTop.current)
        ticking.current = false
      })

      ticking.current = true
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true })
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  // Calculate the range of visible items
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(items.length - 1, Math.floor((scrollTop + windowHeight) / itemHeight) + overscan)

  // Calculate the total height of all items
  const totalHeight = items.length * itemHeight

  // Render only the visible items
  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => {
    const actualIndex = startIndex + index
    return (
      <div
        key={actualIndex}
        style={{
          position: "absolute",
          top: actualIndex * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0,
        }}
      >
        {renderItem(item, actualIndex)}
      </div>
    )
  })

  return (
    <div ref={containerRef} className={`overflow-auto relative ${className}`} style={{ height: windowHeight }}>
      <div style={{ height: totalHeight, position: "relative" }}>{visibleItems}</div>
    </div>
  )
}

// Create a memoized version for better performance with stable props
export const MemoizedVirtualizedList = memo(VirtualizedList) as typeof VirtualizedList
