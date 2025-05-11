"use client"

import type React from "react"

import { useState } from "react"
import { useWindowSize } from "@/hooks/use-window-size"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MobileForm } from "@/components/ui/mobile-form"
import {
  Moon,
  Sun,
  Smartphone,
  Palette,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  Trash2,
  Info,
  HelpCircle,
} from "lucide-react"

export function MobileSettings() {
  const { width } = useWindowSize()
  const isMobile = width ? width < 768 : false
  const [activeTab, setActiveTab] = useState("appearance")
  const [theme, setTheme] = useState("system")
  const [fontSize, setFontSize] = useState(16)
  const [notifications, setNotifications] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isMobile) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate saving
    setTimeout(() => {
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="appearance" className="flex-1">
            <Palette className="h-4 w-4 mr-2" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1">
            <Bell className="h-4 w-4 mr-2" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex-1">
            <Database className="h-4 w-4 mr-2" />
            <span>Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <MobileForm
            title="Appearance Settings"
            description="Customize how the app looks and feels"
            onSubmit={handleSave}
            isSubmitting={isSubmitting}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center">
                        <Sun className="h-4 w-4 mr-2" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center">
                        <Moon className="h-4 w-4 mr-2" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center">
                        <Smartphone className="h-4 w-4 mr-2" />
                        <span>System</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="font-size">Font Size ({fontSize}px)</Label>
                </div>
                <Slider
                  id="font-size"
                  min={12}
                  max={24}
                  step={1}
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                </div>
                <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} />
              </div>
            </div>
          </MobileForm>
        </TabsContent>

        <TabsContent value="notifications">
          <MobileForm
            title="Notification Settings"
            description="Manage how you receive notifications"
            onSubmit={handleSave}
            isSubmitting={isSubmitting}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts for important events</p>
                </div>
                <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
              </div>

              {notifications && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="task-reminders">Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get notified about upcoming tasks</p>
                    </div>
                    <Switch id="task-reminders" checked={true} onCheckedChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="event-alerts">Event Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified about calendar events</p>
                    </div>
                    <Switch id="event-alerts" checked={true} onCheckedChange={() => {}} />
                  </div>
                </>
              )}
            </div>
          </MobileForm>
        </TabsContent>

        <TabsContent value="data">
          <MobileForm
            title="Data Management"
            description="Manage your app data and storage"
            onSubmit={handleSave}
            isSubmitting={isSubmitting}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">Auto Save</Label>
                  <p className="text-sm text-muted-foreground">Automatically save changes</p>
                </div>
                <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
              </div>

              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>

                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </div>
            </div>
          </MobileForm>
        </TabsContent>
      </Tabs>

      <div className="border-t pt-6 space-y-4">
        <Button variant="outline" className="w-full justify-start">
          <HelpCircle className="mr-2 h-4 w-4" />
          Help & Support
        </Button>

        <Button variant="outline" className="w-full justify-start">
          <Shield className="mr-2 h-4 w-4" />
          Privacy Policy
        </Button>

        <Button variant="outline" className="w-full justify-start">
          <Info className="mr-2 h-4 w-4" />
          About
        </Button>

        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Version 1.0.0</p>
          <p>© 2025 Utility Hub</p>
        </div>
      </div>
    </div>
  )
}
