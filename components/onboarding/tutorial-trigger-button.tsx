"use client"

import { Button, type ButtonProps } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { Tutorial } from "./tutorial-system"
import { tutorials } from "@/lib/tutorial-data"
import { cn } from "@/lib/utils"

interface TutorialTriggerButtonProps extends ButtonProps {
  tutorialId: string
  showIcon?: boolean
  label?: string
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function TutorialTriggerButton({
  tutorialId,
  showIcon = true,
  label = "Start Tutorial",
  variant = "outline",
  size = "sm",
  className,
  ...props
}: TutorialTriggerButtonProps) {
  const [showTutorial, setShowTutorial] = useState(false)

  // Find the tutorial by ID
  const tutorial = tutorials.find((t) => t.id === tutorialId)

  if (!tutorial) {
    console.warn(`Tutorial with ID "${tutorialId}" not found.`)
    return null
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn("gap-1.5", className)}
        onClick={() => setShowTutorial(true)}
        {...props}
      >
        {showIcon && <Sparkles className="h-4 w-4" />}
        {label}
      </Button>

      {showTutorial && (
        <Tutorial
          tutorialId={tutorialId}
          steps={tutorial.steps}
          forceShow={true}
          onComplete={() => setShowTutorial(false)}
        />
      )}
    </>
  )
}
