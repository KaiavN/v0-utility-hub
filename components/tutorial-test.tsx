"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TutorialTrigger } from "@/components/onboarding/tutorial-system"

export function TutorialTest() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState("")

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tutorial Test Component</CardTitle>
          <CardDescription>Test interactions with the tutorial system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="counter">Counter: {count}</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="counter-decrement" onClick={() => setCount(count - 1)}>
                -
              </Button>
              <Button variant="outline" size="sm" className="counter-increment" onClick={() => setCount(count + 1)}>
                +
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-input">Text Input</Label>
            <Input
              id="text-input"
              className="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something..."
            />
          </div>
        </CardContent>
        <CardFooter>
          <TutorialTrigger tutorialId="welcome">
            <Button className="start-tutorial-button">Start Tutorial</Button>
          </TutorialTrigger>
        </CardFooter>
      </Card>
    </div>
  )
}
