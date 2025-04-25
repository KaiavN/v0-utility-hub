"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toast"
import { UserPreferencesProvider } from "@/contexts/user-preferences-context"
import { AuthProvider } from "@/contexts/auth-context"
import { SiteHeader } from "@/components/site-header"
import { SpotifyProvider } from "@/contexts/spotify-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { SearchParamsWrapper } from "@/components/search-params-wrapper"
import { useState, useEffect, Suspense } from "react"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import dynamic from "next/dynamic"
import { validateDataIntegrity, repairCorruptedData, migrateDataIfNeeded } from "@/lib/data-manager"

// Import the StorageMonitor component
import { StorageMonitor } from "@/components/storage-monitor"

// Add the AIAssistant import at the top of the file
import { AIAssistant } from "@/components/ai/ai-assistant"

// Dynamically import non-critical components with aggressive chunking
const DataManager = dynamic(() => import("@/components/data-manager").then((mod) => ({ default: mod.DataManager })), {
  ssr: false,
  loading: () => <LoadingFallback />,
})
const PersistentMusicPlayer = dynamic(
  () => import("@/components/persistent-music-player").then((mod) => ({ default: mod.PersistentMusicPlayer })),
  { ssr: false, loading: () => <LoadingFallback /> },
)
const SpotifyConnectionManager = dynamic(
  () => import("@/components/spotify-connection-manager").then((mod) => ({ default: mod.SpotifyConnectionManager })),
  { ssr: false, loading: () => <LoadingFallback /> },
)

// Optimize font loading with display swap
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"], // Add fallback fonts
})

// Loading fallback component
const LoadingFallback = () => <div className="min-h-[40px]"></div>

interface Props {
  children: React.ReactNode
}

export default function ClientLayout({ children }: Props) {
  // Apply initial theme color immediately to avoid flicker
  useEffect(() => {
    // Apply default theme color to avoid flicker
    document.documentElement.setAttribute("data-theme-color", "blue")
  }, [])

  // Use a safer approach to get initial settings with default values
  const [userSettings, setUserSettings] = useState({
    themeColor: "blue", // Default to blue
    fontSize: 100,
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings safely after component mounts
  useEffect(() => {
    try {
      // First, check data integrity and repair if needed
      if (!validateDataIntegrity()) {
        console.warn("Data integrity issues detected, attempting repair...")
        repairCorruptedData()
      }

      // Migrate data if needed
      migrateDataIfNeeded()

      // Load settings with validation
      const savedThemeColor = getLocalStorage("global-theme-color", "blue")
      const savedFontSize = getLocalStorage("global-font-size", 100)

      setUserSettings({
        themeColor: savedThemeColor || "blue", // Ensure fallback to blue
        fontSize: savedFontSize || 100, // Ensure fallback to 100
      })
    } catch (error) {
      console.error("Error loading initial settings:", error)
      // Keep default values if there's an error
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Update application when theme or font changes
  useEffect(() => {
    if (!isLoaded) return

    try {
      // Apply theme color
      document.documentElement.setAttribute("data-theme-color", userSettings.themeColor || "blue")

      // Apply font size
      document.documentElement.style.fontSize = `${userSettings.fontSize || 100}%`

      // Save settings safely
      try {
        setLocalStorage("global-theme-color", userSettings.themeColor || "blue")
        setLocalStorage("global-font-size", userSettings.fontSize || 100)
      } catch (saveError) {
        console.error("Error saving settings:", saveError)
      }
    } catch (error) {
      console.error("Error applying settings:", error)
    }
  }, [userSettings, isLoaded])

  const handleSettingsUpdate = (settings: any) => {
    try {
      if (!settings) return

      setUserSettings({
        themeColor: settings.themeColor || userSettings.themeColor || "blue",
        fontSize: settings.fontSize || userSettings.fontSize || 100,
      })
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* Add meta tags for better performance */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Add meta for better mobile experience */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <SearchParamsWrapper>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <AuthProvider>
                <UserPreferencesProvider>
                  <SpotifyProvider>
                    <SidebarProvider>
                      <div className="flex min-h-screen flex-col">
                        <SiteHeader onSettingsUpdate={handleSettingsUpdate} />
                        <div className="flex flex-1 overflow-hidden">
                          <AppSidebar />
                          <main className="flex-1 overflow-auto bg-background">{children}</main>
                        </div>
                      </div>
                      <Toaster />
                      <Suspense fallback={<LoadingFallback />}>
                        <PersistentMusicPlayer />
                      </Suspense>
                      <Suspense fallback={<LoadingFallback />}>
                        <SpotifyConnectionManager />
                      </Suspense>
                    </SidebarProvider>
                  </SpotifyProvider>
                </UserPreferencesProvider>
              </AuthProvider>
            </ThemeProvider>
            <Suspense fallback={<LoadingFallback />}>
              <DataManager />
            </Suspense>
            <Suspense fallback={<LoadingFallback />}>
              <StorageMonitor />
            </Suspense>
            <Suspense fallback={<LoadingFallback />}>
              <AIAssistant />
            </Suspense>
          </SearchParamsWrapper>
        </ErrorBoundary>
      </body>
    </html>
  )
}
