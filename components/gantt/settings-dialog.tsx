"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { setLocalStorage } from "@/lib/local-storage"

interface GanttSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSettingsChange: (settings: GanttSettings) => void
  initialSettings: GanttSettings
}

export interface GanttSettings {
  defaultView: "gantt" | "board" | "calendar" | "list"
  defaultZoomLevel: number
  showCompletedTasks: boolean
  showDependencies: boolean
  highlightCriticalPath: boolean
  showTaskLabels: boolean
  taskBarHeight: number
  columnWidth: number
  autoSchedule: boolean
  snapToGrid: boolean
  colorScheme: "default" | "colorful" | "monochrome" | "pastel"
}

const defaultSettings: GanttSettings = {
  defaultView: "gantt",
  defaultZoomLevel: 50,
  showCompletedTasks: true,
  showDependencies: true,
  highlightCriticalPath: false,
  showTaskLabels: true,
  taskBarHeight: 32,
  columnWidth: 60,
  autoSchedule: false,
  snapToGrid: true,
  colorScheme: "default",
}

export function GanttSettingsDialog({
  open,
  onOpenChange,
  onSettingsChange,
  initialSettings = defaultSettings,
}: GanttSettingsDialogProps) {
  const [settings, setSettings] = useState<GanttSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState("display")

  const handleSave = () => {
    onSettingsChange(settings)
    setLocalStorage("gantt-settings", settings)
    onOpenChange(false)
  }

  const updateSettings = (key: keyof GanttSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gantt Chart Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="display" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default View</Label>
                  <p className="text-xs text-muted-foreground">Choose which view to show by default</p>
                </div>
                <Select
                  value={settings.defaultView}
                  onValueChange={(value: any) => updateSettings("defaultView", value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gantt">Gantt Chart</SelectItem>
                    <SelectItem value="board">Board View</SelectItem>
                    <SelectItem value="calendar">Calendar View</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Default Zoom Level</Label>
                  <span className="text-sm font-medium">{settings.defaultZoomLevel}%</span>
                </div>
                <Slider
                  value={[settings.defaultZoomLevel]}
                  min={10}
                  max={100}
                  step={10}
                  onValueChange={(value) => updateSettings("defaultZoomLevel", value[0])}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Completed Tasks</Label>
                  <p className="text-xs text-muted-foreground">Display completed tasks in the timeline</p>
                </div>
                <Switch
                  checked={settings.showCompletedTasks}
                  onCheckedChange={(checked) => updateSettings("showCompletedTasks", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Dependencies</Label>
                  <p className="text-xs text-muted-foreground">Display task dependency lines</p>
                </div>
                <Switch
                  checked={settings.showDependencies}
                  onCheckedChange={(checked) => updateSettings("showDependencies", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Task Labels</Label>
                  <p className="text-xs text-muted-foreground">Display task names on the bars</p>
                </div>
                <Switch
                  checked={settings.showTaskLabels}
                  onCheckedChange={(checked) => updateSettings("showTaskLabels", checked)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Schedule</Label>
                  <p className="text-xs text-muted-foreground">Automatically schedule dependent tasks</p>
                </div>
                <Switch
                  checked={settings.autoSchedule}
                  onCheckedChange={(checked) => updateSettings("autoSchedule", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Snap to Grid</Label>
                  <p className="text-xs text-muted-foreground">Snap tasks to grid when dragging</p>
                </div>
                <Switch
                  checked={settings.snapToGrid}
                  onCheckedChange={(checked) => updateSettings("snapToGrid", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Highlight Critical Path</Label>
                  <p className="text-xs text-muted-foreground">Highlight the critical path in the project</p>
                </div>
                <Switch
                  checked={settings.highlightCriticalPath}
                  onCheckedChange={(checked) => updateSettings("highlightCriticalPath", checked)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Task Bar Height</Label>
                  <span className="text-sm font-medium">{settings.taskBarHeight}px</span>
                </div>
                <Slider
                  value={[settings.taskBarHeight]}
                  min={20}
                  max={50}
                  step={2}
                  onValueChange={(value) => updateSettings("taskBarHeight", value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Column Width</Label>
                  <span className="text-sm font-medium">{settings.columnWidth}px</span>
                </div>
                <Slider
                  value={[settings.columnWidth]}
                  min={40}
                  max={100}
                  step={5}
                  onValueChange={(value) => updateSettings("columnWidth", value[0])}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Color Scheme</Label>
                  <p className="text-xs text-muted-foreground">Choose the color scheme for tasks</p>
                </div>
                <Select
                  value={settings.colorScheme}
                  onValueChange={(value: any) => updateSettings("colorScheme", value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="colorful">Colorful</SelectItem>
                    <SelectItem value="monochrome">Monochrome</SelectItem>
                    <SelectItem value="pastel">Pastel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
