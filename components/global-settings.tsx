"use client"

import { useState, useEffect, useCallback } from "react"
import { Settings, Moon, Sun, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { cn } from "@/lib/utils"

const themeColors = [
  { name: "Blue", value: "blue", color: "#2563eb" },
  { name: "Green", value: "green", color: "#16a34a" },
  { name: "Red", value: "red", color: "#dc2626" },
  { name: "Purple", value: "purple", color: "#9333ea" },
  { name: "Orange", value: "orange", color: "#ea580c" },
  { name: "Teal", value: "teal", color: "#0891b2" },
  { name: "Pink", value: "pink", color: "#db2777" },
  { name: "Indigo", value: "indigo", color: "#4f46e5" },
]

interface GlobalSettingsProps {
  onSettingsUpdate: (settings: any) => void
  className?: string
}

// Function to shade a color (from stackoverflow)
function shadeColor(color: string, percent: number) {
  try {
    let R = Number.parseInt(color.substring(1, 3), 16)
    let G = Number.parseInt(color.substring(3, 5), 16)
    let B = Number.parseInt(color.substring(5, 7), 16)

    R = Number.parseInt(String((R * (100 + percent)) / 100), 0)
    G = Number.parseInt(String((G * (100 + percent)) / 100), 0)
    B = Number.parseInt(String((B * (100 + percent)) / 100), 0)

    R = R < 255 ? R : 255
    G = G < 255 ? G : 255
    B = B < 255 ? B : 255

    const RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16)
    const GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16)
    const BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16)

    return "#" + RR + GG + BB
  } catch (error) {
    console.error("Error shading color:", error)
    return color // Return original color if there's an error
  }
}

export function GlobalSettings({ onSettingsUpdate, className }: GlobalSettingsProps) {
  const { setTheme } = useTheme()
  const [themeColor, setThemeColor] = useState<string>("blue") // Default to blue
  const [fontSize, setFontSize] = useState<number>(100)
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Load settings from localStorage and check current theme
  useEffect(() => {
    try {
      // Always default to blue if no saved preference
      const savedThemeColor = getLocalStorage<string>("global-theme-color", "blue")
      const savedFontSize = getLocalStorage<number>("global-font-size", 100)
      const isDarkMode = document.documentElement.classList.contains("dark")

      setThemeColor(savedThemeColor || "blue") // Ensure fallback to blue
      setFontSize(savedFontSize || 100) // Ensure fallback to 100
      setIsDark(isDarkMode)

      // Apply theme color
      document.documentElement.setAttribute("data-theme-color", savedThemeColor || "blue")

      // Apply font size - ensure it's applied to the right elements
      applyFontSize(savedFontSize || 100)

      setMounted(true)
    } catch (error) {
      console.error("Error loading settings:", error)
      // Apply default values if there's an error
      setThemeColor("blue")
      setFontSize(100)
      document.documentElement.setAttribute("data-theme-color", "blue")
      applyFontSize(100)
      setMounted(true)
    }
  }, [])

  // Apply theme color immediately
  const applyThemeColor = useCallback((color: string) => {
    try {
      // Ensure color is valid
      const validColor = color || "blue"

      // Apply theme color
      document.documentElement.setAttribute("data-theme-color", validColor)

      // Apply CSS variables for the selected theme color
      const root = document.documentElement
      const colorHex = themeColors.find((c) => c.value === validColor)?.color || "#2563eb"

      root.style.setProperty("--theme-primary", colorHex)
      root.style.setProperty("--theme-primary-light", `${colorHex}33`) // 20% opacity
      root.style.setProperty("--theme-primary-dark", shadeColor(colorHex, -20)) // 20% darker
    } catch (error) {
      console.error("Error applying theme color:", error)
    }
  }, [])

  // Apply font size immediately with a more robust approach
  const applyFontSize = useCallback((size: number) => {
    try {
      // Ensure size is valid
      const validSize = size || 100

      // Apply to html element (documentElement)
      document.documentElement.style.fontSize = `${validSize}%`

      // Apply to body with !important to override any conflicting styles
      document.body.setAttribute("style", `font-size: ${validSize}% !important`)

      // Apply to specific elements that might have their own font size
      const elements = document.querySelectorAll(
        "p, h1, h2, h3, h4, h5, h6, span, div, button, input, textarea, select, a",
      )
      elements.forEach((el) => {
        // Only apply if the element doesn't have an inline style
        if (!el.hasAttribute("style") || !el.getAttribute("style")?.includes("font-size")) {
          ;(el as HTMLElement).style.fontSize = "" // Reset to inherit from parent
        }
      })
    } catch (error) {
      console.error("Error applying font size:", error)
    }
  }, [])

  // Save settings to localStorage and notify parent
  const saveSettings = useCallback(() => {
    if (!mounted) return

    try {
      setLocalStorage("global-theme-color", themeColor || "blue")
      setLocalStorage("global-font-size", fontSize || 100)

      const settings = {
        themeColor: themeColor || "blue",
        fontSize: fontSize || 100,
      }

      onSettingsUpdate(settings)
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }, [themeColor, fontSize, mounted, onSettingsUpdate])

  // Handle theme color change
  const handleThemeColorChange = (color: string) => {
    try {
      setThemeColor(color || "blue")
      applyThemeColor(color || "blue")
      saveSettings()
    } catch (error) {
      console.error("Error changing theme color:", error)
    }
  }

  // Handle font size change with immediate application
  const handleFontSizeChange = (size: string) => {
    try {
      const newSize = Number.parseInt(size) || 100
      setFontSize(newSize)

      // Apply immediately
      applyFontSize(newSize)

      // Save to localStorage
      setLocalStorage("global-font-size", newSize)

      // Notify parent component
      onSettingsUpdate({ themeColor, fontSize: newSize })
    } catch (error) {
      console.error("Error changing font size:", error)
    }
  }

  // Handle theme change
  const handleThemeChange = (isDarkTheme: boolean) => {
    try {
      if (isDarkTheme) {
        document.documentElement.classList.add("dark")
        setTheme("dark")
      } else {
        document.documentElement.classList.remove("dark")
        setTheme("light")
      }
      setIsDark(isDarkTheme)
      saveSettings()
    } catch (error) {
      console.error("Error changing theme:", error)
    }
  }

  if (!mounted) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings" className={className}>
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="flex justify-between cursor-default">
            <span>Theme</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleThemeChange(false)}>
                <Sun className={cn("h-4 w-4", !isDark ? "text-primary" : "text-muted-foreground")} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleThemeChange(true)}>
                <Moon className={cn("h-4 w-4", isDark ? "text-primary" : "text-muted-foreground")} />
              </Button>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Theme Color</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-56">
              <div className="grid grid-cols-4 gap-1 p-1">
                {themeColors.map((color) => (
                  <div
                    key={color.value}
                    className={cn(
                      "flex items-center justify-center p-1 rounded-md cursor-pointer border-2",
                      themeColor === color.value ? "border-primary" : "border-transparent",
                    )}
                    onClick={() => handleThemeColorChange(color.value)}
                  >
                    <div
                      className="w-full h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: color.color }}
                    >
                      {themeColor === color.value && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </div>
                ))}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Font Size</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={fontSize.toString()} onValueChange={handleFontSizeChange}>
                <DropdownMenuRadioItem value="90">Small (90%)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="100">Default (100%)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="110">Large (110%)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="120">Extra Large (120%)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
