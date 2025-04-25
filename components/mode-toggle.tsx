"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Check the actual DOM state rather than relying on the theme state
  useEffect(() => {
    setMounted(true)
    // Check if dark mode is currently active by looking at the HTML element
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)

    // Set up a mutation observer to detect theme changes
    const observer = new MutationObserver(() => {
      const isDarkMode = document.documentElement.classList.contains("dark")
      setIsDark(isDarkMode)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  // Toggle function that directly applies the theme
  const toggleTheme = () => {
    // If currently dark (showing sun icon), switch to light
    // If currently light (showing moon icon), switch to dark
    if (isDark) {
      document.documentElement.classList.remove("dark")
      setTheme("light")
      setIsDark(false)
    } else {
      document.documentElement.classList.add("dark")
      setTheme("dark")
      setIsDark(true)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {/* Show sun in dark mode (clicking will make it light) */}
      {/* Show moon in light mode (clicking will make it dark) */}
      {isDark ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
    </Button>
  )
}
