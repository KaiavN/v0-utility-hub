"use client"

import { useState } from "react"
import { useAIAssistant } from "@/contexts/ai-assistant-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Info, Key } from "lucide-react"

interface AISettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AISettingsDialog({ open, onOpenChange }: AISettingsDialogProps) {
  const { settings, updateSettings } = useAIAssistant()
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [canAccessData, setCanAccessData] = useState(settings.canAccessData)
  const [canEditData, setCanEditData] = useState(settings.canEditData)

  const handleSave = () => {
    updateSettings({
      apiKey,
      canAccessData,
      canEditData: canAccessData ? canEditData : false, // Disable editing if access is disabled
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI Assistant Settings</DialogTitle>
          <DialogDescription>Configure how the AI assistant works with your data</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <Key className="h-4 w-4" /> API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenRouter API key"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              {apiKey ? "Using custom API key" : "Using default API key from environment variables"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to use the default OpenRouter API key. The AI uses the
              google/gemini-2.0-flash-thinking-exp:free model.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="data-access">Data Access</Label>
                <p className="text-xs text-muted-foreground">Allow the AI to access your stored data</p>
              </div>
              <Switch id="data-access" checked={canAccessData} onCheckedChange={setCanAccessData} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="data-edit">Data Modification</Label>
                <p className="text-xs text-muted-foreground">Allow the AI to modify your stored data</p>
              </div>
              <Switch
                id="data-edit"
                checked={canEditData && canAccessData}
                onCheckedChange={setCanEditData}
                disabled={!canAccessData}
              />
            </div>

            {canAccessData && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/50 p-3 text-sm flex items-start gap-2 border border-yellow-200 dark:border-yellow-900">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-yellow-800 dark:text-yellow-300">
                  <p className="font-medium">Privacy Notice</p>
                  <p className="mt-1">
                    When enabled, the AI assistant can access your data stored in this application. This helps provide
                    more personalized assistance but may have privacy implications.
                  </p>
                  {canEditData && (
                    <p className="mt-2">
                      <strong>Data Modification:</strong> The AI can suggest changes to your data. You will always be
                      asked to approve any changes before they are made.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

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
