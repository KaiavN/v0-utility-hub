"use client"

import { useState } from "react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TutorialTrigger } from "@/components/onboarding/tutorial-system"
import { getLocalStorage } from "@/lib/local-storage"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"
import { ErrorBoundary } from "@/components/error-boundary"

interface FeatureIntroductionProps {
  featureId: string
  title: string
  description: string
  tutorialId?: string
  className?: string
}

export function FeatureIntroduction({
  featureId,
  title,
  description,
  tutorialId,
  className,
}: FeatureIntroductionProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      const dismissedFeatures = getLocalStorage<string[]>("dismissed-features", [])
      return dismissedFeatures.includes(featureId)
    } catch (e) {
      return false
    }
  })

  const handleDismiss = () => {
    try {
      const dismissedFeatures = getLocalStorage<string[]>("dismissed-features", [])
      if (!dismissedFeatures.includes(featureId)) {
        dismissedFeatures.push(featureId)
        localStorage.setItem("dismissed-features", JSON.stringify(dismissedFeatures))
      }
    } catch (e) {
      console.error("Failed to save dismissed state:", e)
    }
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          Dismiss
        </Button>

        <ErrorBoundary
          fallback={
            <Button variant="default" size="sm" disabled>
              Tutorial Unavailable
            </Button>
          }
        >
          {tutorialId ? (
            <TutorialTrigger tutorialId={tutorialId}>
              <Button variant="default" size="sm">
                Learn More
              </Button>
            </TutorialTrigger>
          ) : (
            <Button variant="default" size="sm" disabled>
              Coming Soon
            </Button>
          )}
        </ErrorBoundary>
      </CardFooter>
    </Card>
  )
}
