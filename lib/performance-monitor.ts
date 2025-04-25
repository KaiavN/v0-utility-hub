export function initPerformanceMonitoring() {
  if (typeof window === "undefined" || !window.performance || !window.performance.mark) {
    return { startMeasure: () => {}, endMeasure: () => {} }
  }

  try {
    // Mark the initial load
    window.performance.mark("app_init")

    // Report metrics when page is fully loaded
    window.addEventListener("load", () => {
      try {
        window.performance.mark("app_loaded")
        window.performance.measure("app_load_time", "app_init", "app_loaded")

        // Get the measurement
        const measures = window.performance.getEntriesByName("app_load_time")
        if (measures.length > 0) {
          console.log(`App loaded in ${measures[0].duration.toFixed(2)}ms`)
        }

        // Report Core Web Vitals if available
        if ("requestIdleCallback" in window) {
          requestIdleCallback(() => {
            if ("web-vitals" in window) {
              import("web-vitals")
                .then(({ getCLS, getFID, getLCP }) => {
                  getCLS(console.log)
                  getFID(console.log)
                  getLCP(console.log)
                })
                .catch((err) => {
                  console.error("Error loading web-vitals:", err)
                })
            }
          })
        }
      } catch (error) {
        console.error("Error measuring app load time:", error)
      }
    })

    // Use a Map for faster lookups
    const measurements = new Map()

    // Track component render times
    return {
      startMeasure: (componentName: string) => {
        try {
          if (!componentName) return

          const markName = `${componentName}_start`
          window.performance.mark(markName)
          measurements.set(componentName, markName)
        } catch (error) {
          console.error(`Error starting performance measure for ${componentName}:`, error)
        }
      },
      endMeasure: (componentName: string) => {
        try {
          if (!componentName) return

          const startMark = measurements.get(componentName)
          if (!startMark) return

          const endMark = `${componentName}_end`
          window.performance.mark(endMark)
          window.performance.measure(`${componentName}_render_time`, startMark, endMark)

          // Get the measurement
          const measures = window.performance.getEntriesByName(`${componentName}_render_time`)
          if (measures.length > 0 && measures[0].duration > 50) {
            console.log(`${componentName} rendered in ${measures[0].duration.toFixed(2)}ms`)
          }

          // Clean up
          measurements.delete(componentName)
        } catch (error) {
          console.error(`Error ending performance measure for ${componentName}:`, error)
        }
      },
    }
  } catch (error) {
    console.error("Error initializing performance monitoring:", error)
    return { startMeasure: () => {}, endMeasure: () => {} }
  }
}

// Add real user monitoring for core web vitals
export function trackCoreWebVitals() {
  if (typeof window === "undefined") return

  try {
    import("web-vitals")
      .then(({ getCLS, getFID, getLCP, getFCP, getTTFB }) => {
        getCLS((metric) => {
          console.log("CLS:", metric.value)
        })

        getFID((metric) => {
          console.log("FID:", metric.value)
        })

        getLCP((metric) => {
          console.log("LCP:", metric.value)
        })

        getFCP((metric) => {
          console.log("FCP:", metric.value)
        })

        getTTFB((metric) => {
          console.log("TTFB:", metric.value)
        })
      })
      .catch((err) => {
        console.error("Error loading web-vitals:", err)
      })
  } catch (err) {
    console.error("Error tracking web vitals:", err)
  }
}

// Add defensive error handling for the Knowledge Base page
export function safelyAccessArrayLength(array: any[] | null | undefined): number {
  if (!array) return 0
  try {
    return array.length
  } catch (error) {
    console.error("Error accessing array length:", error)
    return 0
  }
}
