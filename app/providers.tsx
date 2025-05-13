"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { MessagingProvider } from "@/contexts/messaging-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <MessagingProvider>{children}</MessagingProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
