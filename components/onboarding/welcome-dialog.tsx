"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import { TutorialManager } from "./tutorial-system"

export function WelcomeDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    // Check if user has seen welcome dialog before
    const hasSeenWelcome = getLocalStorage<boolean>("has-seen-welcome", false)

    if (!hasSeenWelcome) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    setLocalStorage("has-seen-welcome", true)
    setIsOpen(false)
  }

  const handleStartTutorial = () => {
    setIsOpen(false)
    setShowTutorial(true)

    // Dispatch a custom event that can be captured by other components
    const event = new CustomEvent("start-tutorial", {
      detail: { tutorialId: "welcome" },
    })
    window.dispatchEvent(event)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Welcome to Utility Hub</DialogTitle>
            <DialogDescription>
              Your all-in-one productivity suite with tools for task management, note-taking, and more.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  title: "Task Management",
                  description: "Organize tasks with Gantt charts, boards, and lists",
                  icon: "📋",
                },
                {
                  title: "Knowledge Base",
                  description: "Store and organize your notes and documents",
                  icon: "📚",
                },
                {
                  title: "Calendar",
                  description: "Plan your schedule and manage events",
                  icon: "📅",
                },
                {
                  title: "Integrations",
                  description: "Connect with Spotify and other services",
                  icon: "🔄",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex flex-col items-center text-center p-4 rounded-lg border bg-background/50"
                >
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <h3 className="text-sm font-medium mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClose} className="sm:flex-1">
              Skip Tutorial
            </Button>
            <Button onClick={handleStartTutorial} className="sm:flex-1">
              Take a Quick Tour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showTutorial && (
        <TutorialManager tutorialId="welcome" forceShow={true} onComplete={() => setShowTutorial(false)} />
      )}
    </>
  )
}
