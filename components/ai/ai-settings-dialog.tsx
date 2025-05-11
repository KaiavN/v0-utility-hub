"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAIAssistant } from "@/contexts/ai-assistant-context"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AISettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AISettingsDialog({ open, onOpenChange }: AISettingsDialogProps) {
  const { settings, updateSettings } = useAIAssistant()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Assistant Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="data-access" className="flex flex-col gap-1">
              <span>Data Access</span>
              <span className="font-normal text-xs text-muted-foreground">
                Allow the AI to access your data to provide personalized assistance
              </span>
            </Label>
            <Switch
              id="data-access"
              checked={settings.canAccessData}
              onCheckedChange={(checked) => updateSettings({ canAccessData: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="data-edit" className="flex flex-col gap-1">
              <span>Data Editing</span>
              <span className="font-normal text-xs text-muted-foreground">
                Allow the AI to suggest edits to your data (requires approval)
              </span>
            </Label>
            <Switch
              id="data-edit"
              checked={settings.canEditData}
              onCheckedChange={(checked) => updateSettings({ canEditData: checked })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="model-select">AI Model</Label>
            <Select value={settings.model} onValueChange={(value) => updateSettings({ model: value })}>
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash</SelectItem>
                <SelectItem value="google/gemini-2.0-pro-exp:free">Gemini 2.0 Pro</SelectItem>
                <SelectItem value="anthropic/claude-3-opus:free">Claude 3 Opus</SelectItem>
                <SelectItem value="anthropic/claude-3-sonnet:free">Claude 3 Sonnet</SelectItem>
                <SelectItem value="anthropic/claude-3-haiku:free">Claude 3 Haiku</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
