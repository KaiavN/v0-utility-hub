"use client"

import { useEffect, useState } from "react"

interface ScriptLoaderProps {
  src: string
  id?: string
  async?: boolean
  defer?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
  strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload" | "worker"
}

export function ScriptLoader({
  src,
  id,
  async = true,
  defer = false,
  onLoad,
  onError,
  strategy = "lazyOnload",
}: ScriptLoaderProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Skip if already loaded
    if (id && document.getElementById(id)) {
      setLoaded(true)
      onLoad?.()
      return
    }

    // Skip immediate loading for lazy scripts
    if (strategy === "lazyOnload") {
      const handleLoad = () => {
        loadScript()
      }

      if (document.readyState === "complete") {
        loadScript()
      } else {
        window.addEventListener("load", handleLoad)
        return () => window.removeEventListener("load", handleLoad)
      }
    } else if (strategy === "worker") {
      // Load in a web worker if supported
      if (typeof Worker !== "undefined") {
        const workerCode = `
          self.addEventListener('message', function() {
            fetch('${src}')
              .then(response => response.text())
              .then(code => {
                self.postMessage({ success: true });
              })
              .catch(error => {
                self.postMessage({ success: false, error: error.message });
              });
          });
        `
        const blob = new Blob([workerCode], { type: "application/javascript" })
        const worker = new Worker(URL.createObjectURL(blob))

        worker.onmessage = (e) => {
          if (e.data.success) {
            loadScript()
          } else {
            const scriptError = new Error(e.data.error || "Failed to load script in worker")
            setError(scriptError)
            onError?.(scriptError)
          }
          worker.terminate()
        }

        worker.postMessage("load")
      } else {
        // Fall back to normal loading if workers not supported
        loadScript()
      }
    } else {
      // Load immediately for other strategies
      loadScript()
    }

    function loadScript() {
      const script = document.createElement("script")
      script.src = src
      if (id) script.id = id
      script.async = async
      script.defer = defer

      script.onload = () => {
        setLoaded(true)
        onLoad?.()
      }

      script.onerror = (e) => {
        const scriptError = new Error(`Failed to load script: ${src}`)
        setError(scriptError)
        onError?.(scriptError)
      }

      document.body.appendChild(script)
    }
  }, [src, id, async, defer, onLoad, onError, strategy])

  return null
}
