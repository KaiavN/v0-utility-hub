"use client"

import { GlobalSettings } from "@/components/global-settings"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { RoleSelector } from "@/components/role-selector"
import { GlobalSaveButton } from "@/components/global-save-button"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Coffee } from "lucide-react"
import { AuthButton } from "@/components/auth/auth-button"

interface SiteHeaderProps {
  onSettingsUpdate: (settings: any) => void
}

// Direct Ko-fi button implementation
function KofiButton() {
  return (
    <Button
      variant="outline"
      className="flex items-center gap-1 bg-[#2c4a7c] text-white hover:bg-[#1e3a6c] border-[#2c4a7c]"
      onClick={() => window.open("https://ko-fi.com/T6T71DQ8YM", "_blank")}
    >
      <Coffee className="h-4 w-4" />
      <span className="hidden sm:inline">Support on Ko-fi</span>
    </Button>
  )
}

export function SiteHeader({ onSettingsUpdate }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-background">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-bold md:text-2xl">Utility Hub</h1>
        </div>
        <div className="flex items-center gap-2">
          <AuthButton />
          <KofiButton />
          <Suspense fallback={<div className="w-[120px]"></div>}>
            <RoleSelector />
          </Suspense>
          <GlobalSaveButton />
          <GlobalSettings onSettingsUpdate={onSettingsUpdate} />
        </div>
      </div>
    </header>
  )
}
