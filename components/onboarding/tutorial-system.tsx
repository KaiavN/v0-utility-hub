"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, CheckCircle, Sparkles, Info, Lightbulb, Zap, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import { tutorials } from "@/lib/tutorial-data"

export type TutorialStep = {
  id: string
  title: string
  content: string
  targetSelector?: string
  position?: "top" | "right" | "bottom" | "left" | "center"
  image?: string
  route?: string
  action?: string
  icon?: "info" | "lightbulb" | "sparkles" | "zap" | null
  completionCriteria?: {
    event?: string
    selector?: string
    attribute?: string
    value?: string
  }
}

type TutorialProps = {
  tutorialId: string
  steps: TutorialStep[]
  onComplete?: () => void
  forceShow?: boolean
}

export function Tutorial({ tutorialId, steps, onComplete, forceShow = false }: TutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [targetElement, setTargetElement] = useState<DOMRect | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [animateHighlight, setAnimateHighlight] = useState(false)
  const [completionListeners, setCompletionListeners] = useState<(() => void)[]>([])
  const [targetNotFound, setTargetNotFound] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const confettiRef = useRef<HTMLDivElement>(null)
  const tutorialCardRef = useRef<HTMLDivElement>(null)

  // Ensure steps array is valid and not empty
  const validSteps =
    Array.isArray(steps) && steps.length > 0
      ? steps
      : [
          {
            id: "error-step",
            title: "Tutorial Error",
            content: "There was an error loading this tutorial. Please try again later.",
            position: "center",
            icon: "info",
          },
        ]

  // Safely get current step with fallback
  const currentStep = validSteps[currentStepIndex] || validSteps[0]
  const progress = ((currentStepIndex + 1) / validSteps.length) * 100

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || isMinimized) return

      if (e.key === "Escape") {
        toggleMinimize()
      } else if (e.key === "ArrowRight" && !isPaused) {
        handleNext()
      } else if (e.key === "ArrowLeft" && !isPaused) {
        handlePrevious()
      } else if (e.key === " " || e.key === "Spacebar") {
        // Toggle pause state with spacebar
        setIsPaused(!isPaused)
        e.preventDefault() // Prevent page scrolling
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isVisible, isMinimized, isPaused, currentStepIndex])

  useEffect(() => {
    // Check if tutorial has been completed before
    const completedTutorials = getLocalStorage<string[]>("completed-tutorials", [])
    const hasCompletedTutorial = completedTutorials.includes(tutorialId)

    if (forceShow || !hasCompletedTutorial) {
      try {
        // Only show tutorial if we're on the right route (if specified)
        if (!currentStep?.route || pathname === currentStep.route) {
          setIsVisible(true)
          updateTargetElement()
        } else if (currentStep?.route) {
          // If we're not on the right route, navigate there
          router.push(currentStep.route)
          // Small delay to ensure navigation completes before showing tutorial
          setTimeout(() => {
            setIsVisible(true)
            updateTargetElement()
          }, 500)
        }
      } catch (error) {
        console.error("Error initializing tutorial:", error)
        // Show tutorial anyway in case of error
        setIsVisible(true)
      }
    }
  }, [tutorialId, forceShow, pathname, router])

  useEffect(() => {
    // Reset target not found state when changing steps
    setTargetNotFound(false)

    if (isVisible && currentStep?.targetSelector) {
      // Add a small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        updateTargetElement()
        // Start the highlight animation
        setAnimateHighlight(true)
        setTimeout(() => setAnimateHighlight(false), 1500)
      }, 500)

      // Add resize listener to update position when window resizes
      window.addEventListener("resize", updateTargetElement)

      return () => {
        clearTimeout(timer)
        window.removeEventListener("resize", updateTargetElement)
      }
    }
  }, [isVisible, currentStepIndex, currentStep?.targetSelector])

  // Handle confetti effect when tutorial is completed
  useEffect(() => {
    if (showConfetti && confettiRef.current) {
      const rect = confettiRef.current.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3"],
        disableForReducedMotion: true,
      })

      // Clear confetti after animation
      setTimeout(() => {
        setShowConfetti(false)
      }, 2000)
    }
  }, [showConfetti])

  // Set up completion criteria listeners
  useEffect(() => {
    // Clean up previous listeners
    completionListeners.forEach((listener) => listener())
    setCompletionListeners([])

    if (isPaused || !isVisible || isMinimized || !currentStep?.completionCriteria) return

    const newListeners: (() => void)[] = []

    try {
      const { event, selector, attribute, value } = currentStep.completionCriteria

      if (event && selector) {
        // Add a small delay to ensure elements are available in the DOM
        const setupTimeout = setTimeout(() => {
          // Try to find elements with the selector
          const elements = document.querySelectorAll(selector)

          if (elements.length === 0) {
            console.warn(`No elements found for selector: ${selector}`)
            // Mark as not found but don't block progress
            setTargetNotFound(true)
            return
          }

          const eventHandler = (e: Event) => {
            // Check if attribute/value criteria is met
            if (attribute && value) {
              const element = e.target as HTMLElement
              if (element && element.getAttribute(attribute) === value) {
                handleNext()
              }
            } else {
              // For input events, check if the field has a value
              if (event === "input" && e.target instanceof HTMLInputElement) {
                if (e.target.value.trim() !== "") {
                  handleNext()
                }
              } else {
                handleNext()
              }
            }
          }

          elements.forEach((element) => {
            element.addEventListener(event, eventHandler)
            newListeners.push(() => element.removeEventListener(event, eventHandler))
          })
        }, 800) // Increased delay to give more time for elements to load

        // Add the timeout cleanup to listeners
        newListeners.push(() => clearTimeout(setupTimeout))
      }

      setCompletionListeners(newListeners)
    } catch (error) {
      console.error("Error setting up completion listeners:", error)
      setTargetNotFound(true)
    }

    return () => {
      newListeners.forEach((listener) => listener())
    }
  }, [currentStepIndex, isPaused, isVisible, isMinimized])

  // Add resize observer to update position when content changes
  useEffect(() => {
    if (!tutorialCardRef.current || !isVisible || isMinimized) return

    // Create a resize observer to detect when the tutorial card's size changes
    const resizeObserver = new ResizeObserver(() => {
      // Update position to ensure it stays on screen
      if (targetElement) {
        updateTargetElement()
      }
    })

    // Start observing the tutorial card
    resizeObserver.observe(tutorialCardRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isVisible, isMinimized, targetElement])

  const updateTargetElement = () => {
    if (!currentStep?.targetSelector) {
      setTargetElement(null)
      setTargetNotFound(false)
      return
    }

    try {
      // Try multiple selector variations to increase chances of finding the element
      const selectors = [
        currentStep.targetSelector,
        `[data-tutorial="${currentStep.targetSelector.replace(/^\./, "")}"]`, // Remove leading dot for data attribute
        `*[class*="${currentStep.targetSelector.replace(/^\./, "")}"]`, // Find elements with class containing the name
      ]

      let element = null

      // Try each selector until we find an element
      for (const selector of selectors) {
        try {
          const found = document.querySelector(selector)
          if (found) {
            element = found
            break
          }
        } catch (e) {
          // Ignore errors for individual selectors
          console.warn(`Invalid selector: ${selector}`, e)
        }
      }

      if (element) {
        const rect = element.getBoundingClientRect()

        // Only update if the element is actually visible
        if (rect.width > 0 && rect.height > 0) {
          setTargetElement(rect)
          setTargetNotFound(false)

          // Scroll element into view with smooth behavior if it's not already visible
          const isVisible =
            rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth

          if (!isVisible) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          }
        } else {
          console.warn(`Element found for selector ${currentStep.targetSelector} but has zero dimensions`)
          setTargetNotFound(true)
        }
      } else {
        console.warn(`No element found for selector: ${currentStep.targetSelector}`)
        setTargetNotFound(true)
        setTargetElement(null)
      }
    } catch (error) {
      console.error("Error updating target element:", error)
      setTargetNotFound(true)
      setTargetElement(null)
    }

    // If we have a tutorial card ref, check if it's fully visible and adjust if needed
    if (tutorialCardRef.current && targetElement) {
      setTimeout(() => {
        const cardRect = tutorialCardRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Check if any part of the card is outside the viewport
        if (
          cardRect.left < 0 ||
          cardRect.top < 0 ||
          cardRect.right > viewportWidth ||
          cardRect.bottom > viewportHeight
        ) {
          // Force a re-render to apply the boundary checks in getCardPosition
          setTargetElement({ ...targetElement })
        }
      }, 100)
    }
  }

  const handleNext = () => {
    setHasInteracted(true)
    if (currentStepIndex < validSteps.length - 1) {
      try {
        const nextStep = validSteps[currentStepIndex + 1]

        // If the next step has a different route, navigate there first
        if (nextStep?.route && pathname !== nextStep.route) {
          router.push(nextStep.route)
          // Small delay to ensure navigation completes before showing next step
          setTimeout(() => {
            setCurrentStepIndex(currentStepIndex + 1)
            updateTargetElement()
          }, 500)
        } else {
          setCurrentStepIndex(currentStepIndex + 1)
        }
      } catch (error) {
        console.error("Error navigating to next step:", error)
        // Just advance the step without navigation in case of error
        setCurrentStepIndex(currentStepIndex + 1)
      }
    } else {
      // Show confetti before completing
      setShowConfetti(true)
      setTimeout(() => {
        completeTutorial()
      }, 1000)
    }
  }

  const handlePrevious = () => {
    setHasInteracted(true)
    if (currentStepIndex > 0) {
      try {
        const prevStep = validSteps[currentStepIndex - 1]

        // If the previous step has a different route, navigate there first
        if (prevStep?.route && pathname !== prevStep.route) {
          router.push(prevStep.route)
          // Small delay to ensure navigation completes before showing previous step
          setTimeout(() => {
            setCurrentStepIndex(currentStepIndex - 1)
            updateTargetElement()
          }, 500)
        } else {
          setCurrentStepIndex(currentStepIndex - 1)
        }
      } catch (error) {
        console.error("Error navigating to previous step:", error)
        // Just go back a step without navigation in case of error
        setCurrentStepIndex(currentStepIndex - 1)
      }
    }
  }

  const handleSkip = () => {
    setHasInteracted(true)
    completeTutorial()
  }

  const completeTutorial = () => {
    // Mark tutorial as completed
    try {
      const completedTutorials = getLocalStorage<string[]>("completed-tutorials", [])
      if (!completedTutorials.includes(tutorialId)) {
        completedTutorials.push(tutorialId)
        setLocalStorage("completed-tutorials", completedTutorials)
      }
    } catch (error) {
      console.error("Error saving tutorial completion:", error)
    }

    setIsVisible(false)

    if (onComplete) {
      onComplete()
    }
  }

  const toggleMinimize = () => {
    setHasInteracted(true)
    setIsMinimized(!isMinimized)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const getStepIcon = () => {
    if (!currentStep?.icon) return null

    switch (currentStep.icon) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "lightbulb":
        return <Lightbulb className="h-5 w-5 text-yellow-500" />
      case "sparkles":
        return <Sparkles className="h-5 w-5 text-purple-500" />
      case "zap":
        return <Zap className="h-5 w-5 text-orange-500" />
      default:
        return null
    }
  }

  const getCardPosition = () => {
    if (!targetElement || !currentStep?.position || currentStep.position === "center") {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }
    }

    // Define card dimensions with some padding for safety
    const cardWidth = 350
    const cardHeight = 300 // Increased from 250 to account for variable content height
    const margin = 20

    // Calculate viewport boundaries
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Default positions based on the specified position
    let top, left

    switch (currentStep.position) {
      case "top":
        top = targetElement.top - cardHeight - margin
        left = targetElement.left + targetElement.width / 2 - cardWidth / 2
        break
      case "right":
        top = targetElement.top + targetElement.height / 2 - cardHeight / 2
        left = targetElement.right + margin
        break
      case "bottom":
        top = targetElement.bottom + margin
        left = targetElement.left + targetElement.width / 2 - cardWidth / 2
        break
      case "left":
        top = targetElement.top + targetElement.height / 2 - cardHeight / 2
        left = targetElement.left - cardWidth - margin
        break
      default:
        top = targetElement.top + targetElement.height / 2 - cardHeight / 2
        left = targetElement.right + margin
    }

    // Ensure the card stays within viewport boundaries
    // Left boundary check
    if (left < margin) {
      left = margin
    }

    // Right boundary check
    if (left + cardWidth > viewportWidth - margin) {
      left = viewportWidth - cardWidth - margin
    }

    // Top boundary check
    if (top < margin) {
      top = margin
    }

    // Bottom boundary check
    if (top + cardHeight > viewportHeight - margin) {
      top = viewportHeight - cardHeight - margin
    }

    // Add additional check for small screens - center if card is too large for the viewport
    if (cardWidth > viewportWidth - 2 * margin || cardHeight > viewportHeight - 2 * margin) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: `${viewportWidth - 2 * margin}px`,
        maxHeight: `${viewportHeight - 2 * margin}px`,
        overflow: "auto",
      }
    }

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
    }
  }

  // Function to handle clicks on the backdrop - prevent propagation
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent the click from reaching elements underneath
    e.stopPropagation()
    // Don't close the tutorial when clicking the backdrop
    // Instead, toggle minimize state
    toggleMinimize()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Semi-transparent backdrop that doesn't block interaction with the site */}
      {!isMinimized && (
        <div
          className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-auto"
          onClick={handleBackdropClick}
          style={{ opacity: 0.2 }}
        />
      )}

      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.div
            key="minimized"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 right-4 -translate-y-1/2 z-[101] pointer-events-auto"
          >
            <Button
              size="lg"
              className="rounded-full p-3 shadow-lg flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80"
              onClick={(e) => {
                e.stopPropagation()
                toggleMinimize()
              }}
            >
              <Sparkles className="h-5 w-5" />
              <span>Continue Tutorial</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            style={getCardPosition() as any}
            className="w-[350px] max-w-[calc(100vw-40px)] z-[101] pointer-events-auto"
            ref={tutorialCardRef}
            onClick={(e) => e.stopPropagation()} // Prevent clicks from propagating through the card
          >
            <Card className="border-2 border-primary/20 shadow-xl overflow-hidden bg-background/95 backdrop-blur-sm">
              {/* Progress bar */}
              <div className="w-full h-1 bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: `${(currentStepIndex / validSteps.length) * 100}%` }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>

              {/* Header */}
              <div className="p-4 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-medium text-lg">{currentStep.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePause()
                    }}
                    title={isPaused ? "Resume tutorial" : "Pause tutorial"}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleMinimize()
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSkip()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex gap-3">
                  {getStepIcon() && <div className="flex-shrink-0 mt-1">{getStepIcon()}</div>}
                  <div className="space-y-3">
                    {currentStep.image && (
                      <div className="overflow-hidden rounded-md">
                        <img
                          src={currentStep.image || "/placeholder.svg"}
                          alt={currentStep.title}
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-foreground/90 leading-relaxed">{currentStep.content}</p>

                    {currentStep.action && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-3 p-3 bg-primary/10 rounded-md border border-primary/20 text-sm"
                      >
                        <div className="flex gap-2 items-start">
                          <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{currentStep.action}</span>
                        </div>
                      </motion.div>
                    )}

                    {targetNotFound && currentStep.targetSelector && (
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-md border border-yellow-500/20 text-sm">
                        <div className="flex gap-2 items-start">
                          <Info className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>
                            Element not found. You can still continue with the tutorial by clicking the Next button.
                          </span>
                        </div>
                      </div>
                    )}

                    {isPaused && (
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-md border border-yellow-500/20 text-sm">
                        <div className="flex gap-2 items-start">
                          <Pause className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span>Tutorial paused. You can interact with the site. Click the play button to resume.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {validSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        index === currentStepIndex ? "bg-primary" : "bg-primary/30",
                      )}
                      animate={{
                        scale: index === currentStepIndex ? [1, 1.3, 1] : 1,
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: index === currentStepIndex ? Number.POSITIVE_INFINITY : 0,
                        repeatDelay: 2,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentStepIndex(index)
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">
                    {currentStepIndex + 1}/{validSteps.length}
                  </span>
                </div>
                <div className="flex gap-2">
                  {currentStepIndex > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePrevious()
                      }}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNext()
                    }}
                    className={cn("relative overflow-hidden", !hasInteracted && "animate-pulse")}
                    ref={confettiRef}
                  >
                    {currentStepIndex < validSteps.length - 1 ? (
                      <>
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Complete
                        <CheckCircle className="ml-1 h-4 w-4" />
                      </>
                    )}
                    {!hasInteracted && (
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{
                          x: ["0%", "100%"],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatType: "loop",
                        }}
                      />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target element highlight - now with pointer-events-none to allow interaction */}
      {targetElement && currentStep?.targetSelector && !isPaused && !targetNotFound && (
        <motion.div
          className="absolute z-[99] rounded-md pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            boxShadow: animateHighlight
              ? [
                  "0 0 0 4px rgba(var(--primary), 0.3)",
                  "0 0 0 2px rgba(var(--primary), 0.7)",
                  "0 0 0 4px rgba(var(--primary), 0.3)",
                ]
              : "0 0 0 3px rgba(var(--primary), 0.5)",
          }}
          transition={{ duration: 1.5 }}
          style={{
            top: targetElement.top - 4 + window.scrollY,
            left: targetElement.left - 4,
            width: targetElement.width + 8,
            height: targetElement.height + 8,
          }}
        />
      )}

      {/* Keyboard shortcuts help - positioned to avoid overlap with tutorial */}
      {!isMinimized && (
        <div className="fixed bottom-4 right-4 z-[101] pointer-events-auto">
          <div
            className="bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md border border-border flex flex-col gap-2 text-xs text-muted-foreground"
            onClick={(e) => e.stopPropagation()} // Prevent clicks from propagating
          >
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">←</kbd>
              <span>Previous</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">→</kbd>
              <span>Next</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Space</kbd>
              <span>Pause</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Esc</kbd>
              <span>Minimize</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function TutorialTrigger({ tutorialId, children }: { tutorialId: string; children: React.ReactNode }) {
  const [showTutorial, setShowTutorial] = useState(false)

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation()
          setShowTutorial(true)
        }}
      >
        {children}
      </div>
      {showTutorial && (
        <Tutorial
          tutorialId={tutorialId}
          steps={tutorials.find((t) => t.id === tutorialId)?.steps || []}
          forceShow={true}
          onComplete={() => setShowTutorial(false)}
        />
      )}
    </>
  )
}

export function TutorialManager({
  tutorialId,
  forceShow = false,
  onComplete,
}: {
  tutorialId: string
  forceShow?: boolean
  onComplete?: () => void
}) {
  // Find the selected tutorial by ID
  const selectedTutorial = tutorials.find((t) => t.id === tutorialId)

  if (!selectedTutorial) {
    console.warn(`Tutorial with ID "${tutorialId}" not found.`)
    return null
  }

  return (
    <Tutorial tutorialId={tutorialId} steps={selectedTutorial.steps} forceShow={forceShow} onComplete={onComplete} />
  )
}
