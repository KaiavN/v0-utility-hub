"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAIAssistant } from "@/contexts/ai-assistant-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AISettingsDialog } from "./ai-settings-dialog"
import { DataEditApprovalDialog } from "./data-edit-approval-dialog"
import { Bot, X, Minimize, Maximize, Settings, Send, Trash, Loader2, HelpCircle, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

// Add a function to analyze message content and extract topics
function extractTopicsFromMessage(content: string): string[] {
  // Basic topic extraction based on keywords
  const topicKeywords: Record<string, string[]> = {
    task: ["task", "to-do", "todo", "todos", "to-dos", "reminder", "remind me", "schedule"],
    calendar: ["calendar", "event", "schedule", "appointment", "meeting", "date", "time"],
    note: ["note", "notes", "write down", "remember", "save this", "information"],
    project: ["project", "plan", "planning", "timeline", "milestone", "deadline"],
    finance: ["expense", "budget", "money", "finance", "payment", "invoice", "bill"],
    knowledge: ["information", "research", "study", "learn", "knowledge"],
    personal: ["personal", "private", "me", "my", "I need", "I want"],
    work: ["work", "job", "business", "professional", "client"],
    health: ["health", "exercise", "workout", "fitness", "diet", "nutrition"],
  }

  const foundTopics: string[] = []

  // Check for each topic by testing for its keywords
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        foundTopics.push(topic)
        break // Found this topic, move to next one
      }
    }
  })

  return [...new Set(foundTopics)] // Remove duplicates
}

// Function to analyze message and update user profile
function analyzeMessageForUserProfile(content: string, updateUserProfile: Function): void {
  try {
    // Extract topics from the message
    const topics = extractTopicsFromMessage(content)

    if (topics.length > 0) {
      // Update user profile with new topics
      updateUserProfile({
        interactions: {
          commonTopics: topics, // This will be merged with existing topics in the updateUserProfile function
        },
      })
    }

    // Analyze language style and preferences
    const prefersFormal = /please|kindly|would you|could you|thank you/i.test(content)
    const prefersDetailedResponses = content.length > 100 || /detail|explain|elaborate|comprehensive/i.test(content)
    const prefersQuickResponses = /quick|fast|brief|short|simple/i.test(content)

    // Only update if we have enough confidence
    if (prefersFormal || prefersDetailedResponses || prefersQuickResponses) {
      updateUserProfile({
        preferences: {
          ...(prefersFormal && { communicationStyle: "formal" }),
          ...(prefersDetailedResponses && { responseDetail: "detailed" }),
          ...(prefersQuickResponses && { responseDetail: "brief" }),
        },
      })
    }

    // Analyze for knowledge areas
    const knowledgePatterns = [
      { area: "programming", pattern: /code|programming|javascript|python|html|css|typescript|react|node/i },
      { area: "business", pattern: /business|client|project management|startup|company|enterprise/i },
      { area: "education", pattern: /study|school|college|university|course|assignment|homework|learn/i },
      { area: "health", pattern: /health|fitness|workout|diet|nutrition|exercise|medical|wellness/i },
      { area: "personal productivity", pattern: /productivity|efficient|organize|time management|focus/i },
    ]

    const detectedAreas = knowledgePatterns.filter(({ pattern }) => pattern.test(content)).map(({ area }) => area)

    if (detectedAreas.length > 0) {
      updateUserProfile({
        knowledgeAreas: detectedAreas,
      })
    }
  } catch (error) {
    console.error("Error analyzing message for user profile:", error)
  }
}

export function AIChatWindow() {
  const {
    messages,
    isOpen,
    isMinimized,
    isSending,
    pendingDataEdit,
    isPendingApproval,
    settings,
    userProfile,
    sendMessage,
    clearMessages,
    minimizeChat,
    maximizeChat,
    toggleChat,
    approveDataEdit,
    rejectDataEdit,
    updateUserProfile,
  } = useAIAssistant()

  const [input, setInput] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [dataOperationStats, setDataOperationStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    lastOperation: null as null | { success: boolean; timestamp: number },
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [typingIndicator, setTypingIndicator] = useState(false)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, typingIndicator])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  // Show typing indicator when AI is responding
  useEffect(() => {
    if (isSending) {
      setTypingIndicator(true)
    } else {
      // Keep the indicator for a short time after response to make transition smoother
      const timer = setTimeout(() => {
        setTypingIndicator(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isSending])

  // Track data operation reliability
  useEffect(() => {
    // Monitor data operation reliability through system messages
    const dataMessages = messages.filter(
      (m) => m.role === "system" && (m.content.includes("data edit") || m.content.includes("Data edit")),
    )

    if (dataMessages.length > 0) {
      const successful = dataMessages.filter(
        (m) => m.content.includes("successful") || m.content.includes("Success") || m.content.includes("✅"),
      ).length

      const failed = dataMessages.length - successful

      setDataOperationStats({
        total: dataMessages.length,
        successful,
        failed,
        lastOperation:
          dataMessages.length > 0
            ? {
                success:
                  dataMessages[dataMessages.length - 1].content.includes("successful") ||
                  dataMessages[dataMessages.length - 1].content.includes("Success") ||
                  dataMessages[dataMessages.length - 1].content.includes("✅"),
                timestamp: dataMessages[dataMessages.length - 1].timestamp,
              }
            : null,
      })
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isSending) {
      // Analyze the message for user profiling before sending
      analyzeMessageForUserProfile(input, updateUserProfile)

      sendMessage(input)
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Quick message suggestions
  const suggestions = [
    "What tasks do I have due this week?",
    "Create a new project for website redesign",
    "Show me my upcoming meetings",
    "Add a new task to finish the report by Friday",
  ]

  const sendSuggestion = (suggestion: string) => {
    if (!isSending) {
      sendMessage(suggestion)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <Card
        className={cn(
          "fixed bottom-20 right-4 z-50 shadow-xl transition-all duration-300 border-primary/10",
          isMinimized ? "h-14 w-14 rounded-full" : "h-[600px] max-h-[80vh] w-[500px] md:w-[550px] rounded-2xl",
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 border-b bg-primary/5">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsHelpOpen(!isHelpOpen)}>
                    <HelpCircle className="h-4 w-4" />
                    <span className="sr-only">Help</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Help</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={isMinimized ? maximizeChat : minimizeChat}
                  >
                    {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
                    <span className="sr-only">{isMinimized ? "Maximize" : "Minimize"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isMinimized ? "Maximize" : "Minimize"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleChat}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[480px] px-4 py-4">
                {isHelpOpen && (
                  <div className="mb-6 bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium">AI Assistant Help</h3>
                        <p className="text-sm mt-1">
                          This AI assistant can help you manage your data and use the application more effectively.
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <span className="font-medium">Data Access:</span>{" "}
                            {settings.canAccessData ? "Enabled" : "Disabled"}
                          </p>
                          <p>
                            <span className="font-medium">Data Editing:</span>{" "}
                            {settings.canEditData ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                        <p className="text-sm mt-2">You can ask the assistant to help with tasks like:</p>
                        <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                          <li>Creating and managing tasks, notes, and other data</li>
                          <li>Finding information in your saved data</li>
                          <li>Getting help with using application features</li>
                          <li>Creating complex data entries across multiple features</li>
                        </ul>
                        <p className="text-sm mt-2">
                          Press Alt+A to quickly open or close the assistant from anywhere in the app.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-4">
                    <Bot className="h-16 w-16 text-primary/40 mb-4" />
                    <h3 className="font-medium text-lg">AI Assistant</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                      Ask me anything about your data or how to use this application.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-[320px]">
                      {suggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          className="justify-start text-left h-auto py-2 px-3"
                          onClick={() => sendSuggestion(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                      >
                        {message.role !== "user" && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "flex max-w-[75%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : message.role === "system"
                                ? "bg-muted/80 border border-border/50 rounded-tl-none"
                                : "bg-muted rounded-tl-none",
                          )}
                        >
                          <div className="whitespace-pre-wrap">
                            <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              message.role === "user"
                                ? "text-primary-foreground/80"
                                : message.role === "system"
                                  ? "text-muted-foreground/80"
                                  : "text-muted-foreground",
                            )}
                          >
                            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                          </div>
                        </div>
                        {message.role === "user" && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-secondary">U</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {typingIndicator && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex max-w-[75%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm bg-muted rounded-tl-none">
                          <div className="flex items-center gap-1">
                            <div
                              className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                            <div
                              className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
                              style={{ animationDelay: "600ms" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>

            <CardFooter className="p-3 pt-0 border-t bg-background">
              <form onSubmit={handleSubmit} className="flex w-full gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isSending ? "AI is thinking..." : "Type a message..."}
                  className="min-h-10 flex-1 resize-none rounded-xl"
                  disabled={isSending || isPendingApproval}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isSending || isPendingApproval}
                    className="h-10 w-10 rounded-xl"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="sr-only">{isSending ? "Sending..." : "Send"}</span>
                  </Button>

                  {messages.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={clearMessages}
                            className="h-10 w-10 rounded-xl"
                            disabled={isPendingApproval || isSending}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Clear chat</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clear chat</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </form>
            </CardFooter>
          </>
        )}
      </Card>

      <AISettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {/* Data Edit Approval Dialog */}
      <DataEditApprovalDialog
        open={isPendingApproval}
        onOpenChange={(open) => {
          if (!open) rejectDataEdit()
        }}
        operation={pendingDataEdit}
        onApprove={approveDataEdit}
        onReject={rejectDataEdit}
      />
    </>
  )
}
