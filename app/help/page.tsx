"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  HelpCircle,
  BookOpen,
  Mail,
  Sparkles,
  ExternalLink,
  FileText,
  MessageSquare,
  CheckCircle,
  ArrowRight,
} from "lucide-react"
import { Tutorial } from "@/components/onboarding/tutorial-system"
import { tutorials } from "@/lib/tutorial-data"
import { getLocalStorage } from "@/lib/local-storage"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

export default function HelpPage() {
  const [showTutorial, setShowTutorial] = useState(false)
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null)
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([])
  const [featuredTutorials, setFeaturedTutorials] = useState<typeof tutorials>([])
  const [showTutorialBrowser, setShowTutorialBrowser] = useState(false)

  useEffect(() => {
    // Load completed tutorials from local storage
    const completed = getLocalStorage<string[]>("completed-tutorials", [])
    setCompletedTutorials(completed || [])

    // Get featured tutorials (first 3 from getting-started)
    const featured = tutorials.filter((t) => t.category === "getting-started").slice(0, 3)
    setFeaturedTutorials(featured)
  }, [])

  const handleStartTutorial = (tutorialId = "welcome") => {
    setActiveTutorial(tutorialId)
    setShowTutorial(true)
  }

  const handleTutorialComplete = () => {
    setShowTutorial(false)
    setActiveTutorial(null)

    // Refresh completed tutorials
    const completed = getLocalStorage<string[]>("completed-tutorials", [])
    setCompletedTutorials(completed || [])
  }

  const handleContactSupport = () => {
    window.location.href = "mailto:kaiav.nihalani@gmail.com"
  }

  // Calculate completion stats
  const totalTutorials = tutorials.length
  const completedCount = completedTutorials.length
  const completionPercentage = totalTutorials > 0 ? Math.round((completedCount / totalTutorials) * 100) : 0

  return (
    <div className="container max-w-5xl py-8 px-4 md:px-6 space-y-8">
      <div className="flex flex-col items-center text-center space-y-2 mb-8">
        <HelpCircle className="h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground max-w-2xl">
          Find answers to common questions, learn how to use features, and get support when you need it.
        </p>
      </div>

      {/* Tutorial progress card */}
      <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Your Learning Progress
          </CardTitle>
          <CardDescription>Track your progress through our interactive tutorials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tutorial Completion</span>
                <span className="text-sm text-muted-foreground">
                  {completedCount} of {totalTutorials} completed
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">{completionPercentage}% complete</p>

              <Button className="mt-4 w-full md:w-auto" onClick={() => handleStartTutorial()}>
                {completedCount === 0 ? "Start First Tutorial" : "Continue Learning"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 grid grid-cols-1 gap-3">
              <h3 className="text-sm font-medium">Recommended Tutorials:</h3>
              {featuredTutorials.map((tutorial) => (
                <motion.div
                  key={tutorial.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-background/80 cursor-pointer hover:border-primary transition-colors"
                  whileHover={{ x: 5 }}
                  onClick={() => handleStartTutorial(tutorial.id)}
                >
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm truncate">{tutorial.title}</h4>
                      {completedTutorials.includes(tutorial.id) && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{tutorial.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-primary/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Interactive Tutorials
            </CardTitle>
            <CardDescription>Learn how to use the app with step-by-step interactive guides</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our interactive tutorials will walk you through each feature of the application with hands-on guidance.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => handleStartTutorial()}>
              Start Tutorials
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              User Guide
            </CardTitle>
            <CardDescription>Comprehensive documentation for all features</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Detailed documentation covering all aspects of the application, from basic usage to advanced features.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => window.open("/help/guide", "_self")}>
              View User Guide
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Contact Support
            </CardTitle>
            <CardDescription>Get help from our support team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Can't find what you're looking for? Contact our support team for personalized assistance.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleContactSupport}>
              Email Support
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="guide">User Guide</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tutorials
                  .filter((t) => t.category === "getting-started")
                  .slice(0, 3)
                  .map((tutorial, index) => (
                    <div key={tutorial.id} className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <span>{index + 1}.</span> {tutorial.title}
                        {completedTutorials.includes(tutorial.id) && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary"
                        onClick={() => handleStartTutorial(tutorial.id)}
                      >
                        Start Tutorial
                      </Button>
                    </div>
                  ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setShowTutorialBrowser(true)}>
                  View All Tutorials
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tutorials
                  .filter((t) => t.category === "features")
                  .slice(0, 4)
                  .map((tutorial, index) => (
                    <div key={tutorial.id} className="space-y-2">
                      <h3 className="font-medium">{tutorial.title}</h3>
                      <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary"
                        onClick={() => handleStartTutorial(tutorial.id)}
                      >
                        Start Tutorial
                      </Button>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find answers to common questions about the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Is my data secure?</AccordionTrigger>
                  <AccordionContent>
                    Yes, your data is stored securely in your browser's local storage or in your account if you're
                    signed in. We use encryption for sensitive information and never share your data with third parties
                    without your consent.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Can I access my data on multiple devices?</AccordionTrigger>
                  <AccordionContent>
                    Yes, if you create an account and sign in, your data will be synchronized across all your devices.
                    Without an account, data is stored locally on each device.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How do I back up my data?</AccordionTrigger>
                  <AccordionContent>
                    Go to Settings and select "Export Data" to create a backup file of all your data. You can import
                    this file later using the "Import Data" option if needed.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Is there a mobile app available?</AccordionTrigger>
                  <AccordionContent>
                    The application is fully responsive and works well on mobile browsers. You can also add it to your
                    home screen for an app-like experience on most mobile devices.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>How do I reset my password?</AccordionTrigger>
                  <AccordionContent>
                    Click on "Forgot Password" on the login screen and follow the instructions sent to your email
                    address to reset your password.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>Can I use the app offline?</AccordionTrigger>
                  <AccordionContent>
                    Many features work offline and will sync when you're back online. However, some features that
                    require internet connectivity, like the Spotify integration, will not be available offline.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleContactSupport}>
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
              <Button variant="outline" onClick={() => window.open("/help/faqs", "_self")}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View All FAQs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Guide</CardTitle>
              <CardDescription>Comprehensive documentation for all features and tools.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => window.open("/help/guide#getting-started", "_self")}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Getting Started</span>
                    <span className="text-sm text-muted-foreground">Account setup, navigation, and basic usage</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => window.open("/help/guide#task-management", "_self")}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Task Management</span>
                    <span className="text-sm text-muted-foreground">
                      Creating tasks, setting deadlines, and tracking progress
                    </span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => window.open("/help/guide#calendar", "_self")}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Calendar</span>
                    <span className="text-sm text-muted-foreground">Managing events, schedules, and reminders</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => window.open("/help/guide#knowledge-base", "_self")}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Knowledge Base</span>
                    <span className="text-sm text-muted-foreground">Organizing notes, documents, and information</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => window.open("/help/guide#finance", "_self")}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Finance Tracker</span>
                    <span className="text-sm text-muted-foreground">
                      Tracking expenses, budgeting, and financial analysis
                    </span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => window.open("/help/guide#settings", "_self")}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Settings & Preferences</span>
                    <span className="text-sm text-muted-foreground">
                      Customizing the app, data management, and account settings
                    </span>
                  </div>
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => window.open("/help/guide", "_self")}>
                <BookOpen className="mr-2 h-4 w-4" />
                View Full User Guide
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Active Tutorial */}
      {showTutorial && activeTutorial && (
        <Tutorial
          tutorialId={activeTutorial}
          steps={tutorials.find((t) => t.id === activeTutorial)?.steps || []}
          forceShow={true}
          onComplete={handleTutorialComplete}
        />
      )}
    </div>
  )
}
