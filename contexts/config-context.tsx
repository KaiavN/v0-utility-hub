"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type ConfigContextType = {
  supabase: {
    url: string
    anonKey: string
  }
  isLoaded: boolean
  error: string | null
}

const defaultConfig: ConfigContextType = {
  supabase: {
    url: "",
    anonKey: "",
  },
  isLoaded: false,
  error: null,
}

const ConfigContext = createContext<ConfigContextType>(defaultConfig)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigContextType>(defaultConfig)

  useEffect(() => {
    async function loadConfig() {
      try {
        // Try to load from localStorage first for faster startup
        const cachedConfig = localStorage.getItem("app_config")
        if (cachedConfig) {
          const parsed = JSON.parse(cachedConfig)
          setConfig({
            ...parsed,
            isLoaded: true,
            error: null,
          })
        }

        // Always fetch fresh config
        const response = await fetch("/api/config")
        if (!response.ok) {
          throw new Error(`Failed to load config: ${response.status}`)
        }

        const data = await response.json()

        // Save to localStorage for next time
        localStorage.setItem("app_config", JSON.stringify(data))

        setConfig({
          ...data,
          isLoaded: true,
          error: null,
        })
      } catch (error) {
        console.error("Error loading config:", error)
        setConfig({
          ...defaultConfig,
          isLoaded: true,
          error: error instanceof Error ? error.message : "Unknown error loading config",
        })
      }
    }

    loadConfig()
  }, [])

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  return useContext(ConfigContext)
}
