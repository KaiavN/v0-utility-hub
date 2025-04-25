import type React from "react"
import type { Metadata } from "next/dist/lib/metadata/types/metadata-interface"
import ClientLayout from "./client"

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
  return <ClientLayout>{children}</ClientLayout>
}


import './globals.css'