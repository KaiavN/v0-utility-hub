"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HelpCircle, Search, BookOpen, Lightbulb, MessageCircle, Coffee, ExternalLink } from "lucide-react"
import { TutorialTrigger } from "../onboarding/tutorial-system"

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("")

  const tutorials = [
    { id: "welcome", title: "Getting Started", description: "Learn the basics of Utility Hub" },
    { id: "gantt-chart", title: "Gantt Chart", description: "How to use the Gantt chart tool" },
    { id: "knowledge-base", title: "Knowledge Base", description: "Organize your notes and documents" },
  ]

  const faqs = [
    {
      question: "How do I save my data?",
      answer:
        "Your data is automatically saved to your browser's local storage. You can also manually save by clicking the save button in the top navigation bar.",
    },
    {
      question: "Can I access my data on different devices?",
      answer:
        "Currently, data is stored locally on your device. To access on different devices, you'll need to create an account and enable cloud sync (coming soon).",
    },
    {
      question: "How do I change the theme?",
      answer:
        "Click the settings icon in the top right corner and select your preferred theme color and toggle between light and dark mode.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Your data is stored locally on your device and is not sent to any servers unless you enable cloud sync with an account.",
    },
  ]

  const filteredTutorials = searchQuery
    ? tutorials.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : tutorials

  const filteredFaqs = searchQuery
    ? faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : faqs

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="help-button">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Help</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle>Help Center</SheetTitle>
          <SheetDescription>Find tutorials, FAQs, and support resources</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="tutorials" className="flex-1 flex flex-col">
          <TabsList className="mx-6 mb-2">
            <TabsTrigger value="tutorials" className="flex-1">
              <BookOpen className="mr-2 h-4 w-4" />
              Tutorials
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex-1">
              <Lightbulb className="mr-2 h-4 w-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="support" className="flex-1">
              <MessageCircle className="mr-2 h-4 w-4" />
              Support
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="tutorials" className="p-6 pt-2 m-0">
              <div className="space-y-4">
                {filteredTutorials.length > 0 ? (
                  filteredTutorials.map((tutorial) => (
                    <TutorialTrigger key={tutorial.id} tutorialId={tutorial.id}>
                      <div className="cursor-pointer group rounded-lg border p-4 hover:bg-accent transition-colors">
                        <h3 className="font-medium group-hover:text-accent-foreground">{tutorial.title}</h3>
                        <p className="text-sm text-muted-foreground">{tutorial.description}</p>
                      </div>
                    </TutorialTrigger>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tutorials found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="faqs" className="p-6 pt-2 m-0">
              <div className="space-y-4">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No FAQs found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="support" className="p-6 pt-2 m-0">
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Support
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Need help with something specific? Reach out to our support team.
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => (window.location.href = "mailto:kaiav.nihalani@gmail.com")}
                  >
                    Send a Message
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Coffee className="mr-2 h-4 w-4" />
                    Support Development
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enjoying Utility Hub? Consider supporting the development.
                  </p>
                  <Button
                    className="w-full bg-[#2c4a7c] text-white hover:bg-[#1e3a6c] border-[#2c4a7c]"
                    onClick={() => window.open("https://ko-fi.com/T6T71DQ8YM", "_blank")}
                  >
                    Support on Ko-fi
                    <Coffee className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <SheetFooter className="p-6 pt-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <a href="https://github.com/yourusername/utility-hub" target="_blank" rel="noopener noreferrer">
              View Documentation
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
