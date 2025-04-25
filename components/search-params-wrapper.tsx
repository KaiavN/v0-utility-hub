"use client"

import { Suspense, type ReactNode } from "react"

interface SearchParamsWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

export function SearchParamsWrapper({
  children,
  fallback = <div className="p-4 text-center">Loading...</div>,
}: SearchParamsWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}
