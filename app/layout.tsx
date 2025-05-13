import type React from "react"
import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import ClientLayout from "./client"
import { DataIntegrityMonitor } from "@/components/data-integrity-monitor"
import { recoverPlannerData } from "@/lib/planner-data-recovery"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { fontSans } from "@/lib/fonts"
import { Toaster } from "@/components/ui/toaster"
import { FeatureTutorialButton } from "@/components/feature-tutorial-button"
import { EnvDebug } from "@/components/debug/env-debug"
import { SupabaseInitializer } from "@/components/supabase-initializer"
import { MessagingProvider } from "@/contexts/messaging-context"

export const metadata: Metadata = {
  title: "Utility Hub",
  description: "A collection of useful browser-based utilities with local storage",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#2563eb", // Setting explicitly to blue
  metadataBase: new URL("https://utilhub.vercel.app"),
  openGraph: {
    title: "Utility Hub",
    description: "A collection of useful browser-based utilities with local storage",
    type: "website",
    locale: "en_US",
    url: "https://utilhub.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Utility Hub",
    description: "A collection of useful browser-based utilities with local storage",
  },
  robots: {
    index: true,
    follow: true,
  },
    generator: 'v0.dev'
}

interface Props {
  children: React.ReactNode
}

export default function RootLayout({ children }: Props) {
  // This ensures planner data is initialized as early as possible
  if (typeof window !== "undefined") {
    // Initialize planner data on client side
    setTimeout(() => {
      try {
        recoverPlannerData()
      } catch (error) {
        console.error("Error initializing planner data:", error)
      }
    }, 0)
  }
  return (
    <html lang="en" suppressHydrationWarning data-theme-color="blue">
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        {/* Initialize Supabase as early as possible */}
        <SupabaseInitializer />

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <MessagingProvider>
              <ClientLayout>
                {children}
                {/* Add DataIntegrityMonitor for automatic data maintenance */}
                <DataIntegrityMonitor />
              </ClientLayout>
            </MessagingProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        {/* Feature tutorial button */}
        <FeatureTutorialButton />
        {process.env.NODE_ENV === "development" && <EnvDebug />}
      </body>
    </html>
  )
}


import './globals.css'