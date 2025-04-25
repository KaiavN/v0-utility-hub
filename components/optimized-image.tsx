"use client"

import { useState, useEffect, useRef, memo } from "react"
import Image from "next/image"

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  placeholder?: "blur" | "empty"
  blurDataURL?: string
}

// Create a simple placeholder SVG generator
const generatePlaceholderSvg = (width: number, height: number): string => {
  try {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23e2e8f0'/%3E%3C/svg%3E`
  } catch (error) {
    console.error("Error generating placeholder SVG:", error)
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e2e8f0'/%3E%3C/svg%3E`
  }
}

// Memoize the component to prevent unnecessary re-renders
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  placeholder = "empty",
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!imgRef.current || priority) {
      setIsIntersecting(true)
      return
    }

    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true)
            observer.disconnect()
          }
        },
        {
          rootMargin: "200px", // Load images when they're 200px from viewport
          threshold: 0.01,
        },
      )

      const currentRef = imgRef.current
      observer.observe(currentRef)

      return () => {
        if (currentRef) {
          observer.unobserve(currentRef)
        }
        observer.disconnect()
      }
    } catch (error) {
      console.error("Error setting up intersection observer:", error)
      setIsIntersecting(true) // Fall back to showing the image
    }
  }, [priority])

  // Generate a placeholder blur data URL if not provided
  const placeholderUrl = blurDataURL || generatePlaceholderSvg(width, height)

  // Handle image load error
  const handleImageError = () => {
    setImgError(true)
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {isIntersecting || priority ? (
        <Image
          src={imgError ? "/placeholder.svg" : src || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          className={className}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={placeholderUrl}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={handleImageError}
          {...props}
        />
      ) : (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" style={{ width, height }} aria-hidden="true" />
      )}
    </div>
  )
})
