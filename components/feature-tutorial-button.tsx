"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { Tutorial } from "./onboarding/tutorial-system"
import { tutorials } from "@/lib/tutorial-data"
import { usePathname } from "next/navigation"

// Map routes to tutorial IDs
const routeToTutorialMap: Record<string, string> = {
  "/": "dashboard",
  "/tasks": "tasks",
  "/calendar": "calendar",
  "/knowledge-base": "knowledge",
  "/finance": "finance",
  "/gantt": "gantt-chart",
  "/spotify": "spotify",
  "/bookmarks": "bookmarks",
  "/code-snippets": "code-snippets",
  "/assignments": "assignments",
  "/settings": "data-management",
}

export function FeatureTutorialButton() {
  const [showTutorial, setShowTutorial] = useState(false)
  const pathname = usePathname()

  // Find the appropriate tutorial for the current route
  const tutorialId = routeToTutorialMap[pathname] || null

  if (!tutorialId) return null

  const tutorial = tutorials.find((t) => t.id === tutorialId)

  if (!tutorial) return null

  return (
    <div className="fixed top-[40%] right-4 -translate-y-1/2 z-30">
      <Button
        size="sm"
        className="rounded-full shadow-md flex items-center gap-1.5 bg-primary/90 hover:bg-primary"
        onClick={() => setShowTutorial(true)}
      >
        <Sparkles className="h-4 w-4" />
        <span>Learn this feature</span>
      </Button>

      {showTutorial && (
        <Tutorial
          tutorialId={tutorialId}
          steps={tutorial.steps}
          forceShow={true}
          onComplete={() => setShowTutorial(false)}
        />
      )}
    </div>
  )
}
