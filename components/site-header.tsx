"use client"

import { useState, useEffect, Suspense } from "react"
import { GlobalSettings } from "@/components/global-settings"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { RoleSelector } from "@/components/role-selector"
import { GlobalSaveButton } from "@/components/global-save-button"
import { Button } from "@/components/ui/button"
import {
  Coffee,
  Search,
  Menu,
  X,
  HelpCircle,
  Sparkles,
  BookOpen,
  Star,
  ArrowRight,
  CheckCircle,
  Filter,
  Zap,
} from "lucide-react"
import { AuthButton } from "@/components/auth/auth-button"
import { useWindowSize } from "@/hooks/use-window-size"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname } from "next/navigation"
import { Tutorial } from "@/components/onboarding/tutorial-system"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { tutorials } from "@/lib/tutorial-data"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getLocalStorage } from "@/lib/local-storage"

interface SiteHeaderProps {
  onSettingsUpdate: (settings: any) => void
}

// Direct Ko-fi button implementation
function KofiButton() {
  const { width } = useWindowSize()
  const isMobile = width ? width < 768 : false

  return (
    <Button
      variant="outline"
      className={cn(
        "flex items-center gap-1 bg-[#2c4a7c] text-white hover:bg-[#1e3a6c] border-[#2c4a7c]",
        isMobile ? "w-full justify-center" : "",
      )}
      onClick={() => window.open("https://ko-fi.com/T6T71DQ8YM", "_blank")}
    >
      <Coffee className="h-4 w-4" />
      <span className={isMobile ? "inline" : "hidden sm:inline"}>Support on Ko-fi</span>
    </Button>
  )
}

export function SiteHeader({ onSettingsUpdate }: SiteHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { width } = useWindowSize()
  const isMobile = width ? width < 768 : false
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const [showTutorialBrowser, setShowTutorialBrowser] = useState(false)
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null)

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Listen for custom events to start tutorials
  useEffect(() => {
    const handleStartTutorial = (e: CustomEvent) => {
      if (e.detail?.tutorialId) {
        setActiveTutorial(e.detail.tutorialId)
      }
    }

    window.addEventListener("start-tutorial" as any, handleStartTutorial as any)
    return () => {
      window.removeEventListener("start-tutorial" as any, handleStartTutorial as any)
    }
  }, [])

  const handleTutorialComplete = () => {
    setActiveTutorial(null)
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 flex flex-col bg-background transition-all duration-200",
        isScrolled ? "shadow-sm" : "border-b",
      )}
      style={{ marginTop: "0" }}
    >
      {/* Top row - Search and right-aligned help/tutorials */}
      <div className="h-12 border-b">
        <div className="container h-full flex items-center justify-between">
          <div className="flex h-full items-center">
            <SidebarTrigger className="mr-2 md:hidden sidebar-nav" />
          </div>

          {/* Right-aligned help and tutorials */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => window.open("/help", "_self")}>
                      <HelpCircle className="h-4 w-4" />
                      <span>Help</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Access help resources and documentation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 relative"
                      onClick={() => setShowTutorialBrowser(true)}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Tutorials</span>
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Interactive tutorials to help you learn the app</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Mobile controls */}
          {isMobile && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="search-input" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex flex-col">
                  <div className="flex-1 space-y-4 py-4">
                    <div className="px-3">
                      <h2 className="text-lg font-semibold">Menu</h2>
                    </div>
                    <div className="space-y-1">{/* Knowledge Base link removed */}</div>
                    <div className="px-3 py-2">
                      <AuthButton />
                    </div>
                    <div className="px-3 py-2">
                      <KofiButton />
                    </div>
                    <div className="px-3 py-2">
                      <Suspense fallback={<div className="h-10"></div>}>
                        <RoleSelector />
                      </Suspense>
                    </div>
                    <div className="px-3 py-2">
                      <GlobalSaveButton />
                    </div>
                    <div className="px-3 py-2">
                      <GlobalSettings onSettingsUpdate={onSettingsUpdate} className="settings-button w-full" />
                    </div>
                    <div className="px-3 py-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                        onClick={() => window.open("/help", "_self")}
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Help
                      </Button>
                    </div>
                    <div className="px-3 py-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        size="sm"
                        onClick={() => setShowTutorialBrowser(true)}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Tutorials
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row - User actions */}
      {!isMobile && (
        <div className="h-10 border-b">
          <div className="container h-full flex items-center justify-end">
            <div className="flex items-center gap-2">
              <AuthButton />
              <KofiButton />
              <Suspense fallback={<div className="w-[120px]"></div>}>
                <RoleSelector />
              </Suspense>
              <GlobalSaveButton />
              <GlobalSettings onSettingsUpdate={onSettingsUpdate} className="settings-button" />
            </div>
          </div>
        </div>
      )}

      {/* Mobile search overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-background p-4 flex flex-col"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
              <div className="text-lg font-medium">Search</div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full h-12 pl-10 pr-4 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                autoFocus
              />
            </div>
            <div className="mt-4 flex-1 overflow-auto">
              {/* Search results would go here */}
              <div className="text-center text-muted-foreground py-8">Start typing to search</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Browser */}
      {showTutorialBrowser && (
        <EnhancedTutorialBrowser
          onClose={() => setShowTutorialBrowser(false)}
          onSelectTutorial={(tutorialId) => {
            setShowTutorialBrowser(false)
            setActiveTutorial(tutorialId)
          }}
        />
      )}

      {/* Active Tutorial */}
      {activeTutorial && (
        <Tutorial
          tutorialId={activeTutorial}
          steps={tutorials.find((t) => t.id === activeTutorial)?.steps || []}
          forceShow={true}
          onComplete={handleTutorialComplete}
        />
      )}
    </header>
  )
}

// Enhanced tutorial browser with better UI/UX
function EnhancedTutorialBrowser({
  onClose,
  onSelectTutorial,
}: { onClose: () => void; onSelectTutorial: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([])
  const [featuredTutorial, setFeaturedTutorial] = useState(tutorials[0])
  const [hoveredTutorial, setHoveredTutorial] = useState<string | null>(null)

  useEffect(() => {
    // Load completed tutorials from local storage
    const completed = getLocalStorage<string[]>("completed-tutorials", [])
    setCompletedTutorials(completed || [])

    // Set a random featured tutorial from the getting-started category
    const gettingStartedTutorials = tutorials.filter((t) => t.category === "getting-started")
    if (gettingStartedTutorials.length > 0) {
      const randomIndex = Math.floor(Math.random() * gettingStartedTutorials.length)
      setFeaturedTutorial(gettingStartedTutorials[randomIndex])
    }
  }, [])

  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchesSearch =
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "completed") return matchesSearch && completedTutorials.includes(tutorial.id)
    if (activeTab === "incomplete") return matchesSearch && !completedTutorials.includes(tutorial.id)
    return matchesSearch && tutorial.category === activeTab
  })

  // Calculate completion stats
  const totalTutorials = tutorials.length
  const completedCount = completedTutorials.length
  const completionPercentage = totalTutorials > 0 ? Math.round((completedCount / totalTutorials) * 100) : 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-background rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border"
      >
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-primary/10 to-transparent">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Interactive Tutorials
            </h2>
            <p className="text-muted-foreground mt-1">
              Learn how to use Utility Hub with step-by-step interactive guides
            </p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress overview */}
        <div className="p-6 border-b bg-muted/30">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Progress stats */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Your Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {completedCount} of {totalTutorials} completed
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${completionPercentage}%` }} />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{completionPercentage}% complete</div>
            </div>

            {/* Featured tutorial */}
            <div className="flex-1 bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{featuredTutorial.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{featuredTutorial.description}</p>
                  <Button size="sm" className="mt-3" onClick={() => onSelectTutorial(featuredTutorial.id)}>
                    Start This Tutorial
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tutorials..."
              className="w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap md:flex-nowrap">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("all")}
              className="rounded-full"
            >
              All
            </Button>
            <Button
              variant={activeTab === "getting-started" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("getting-started")}
              className="rounded-full"
            >
              <BookOpen className="mr-1 h-4 w-4" />
              Getting Started
            </Button>
            <Button
              variant={activeTab === "features" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("features")}
              className="rounded-full"
            >
              <Sparkles className="mr-1 h-4 w-4" />
              Features
            </Button>
            <Button
              variant={activeTab === "advanced" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("advanced")}
              className="rounded-full"
            >
              <Zap className="mr-1 h-4 w-4" />
              Advanced
            </Button>
            <Button
              variant={activeTab === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("completed")}
              className="rounded-full"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Completed
            </Button>
          </div>
        </div>

        {/* Tutorial list */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTutorials.map((tutorial) => (
              <motion.div
                key={tutorial.id}
                className={cn(
                  "group border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-primary hover:shadow-md",
                  completedTutorials.includes(tutorial.id)
                    ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10"
                    : "",
                  hoveredTutorial === tutorial.id ? "ring-2 ring-primary ring-offset-2" : "",
                )}
                onClick={() => onSelectTutorial(tutorial.id)}
                onMouseEnter={() => setHoveredTutorial(tutorial.id)}
                onMouseLeave={() => setHoveredTutorial(null)}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {tutorial.category === "getting-started" && <BookOpen className="h-4 w-4 text-blue-500" />}
                      {tutorial.category === "features" && <Sparkles className="h-4 w-4 text-purple-500" />}
                      {tutorial.category === "advanced" && <Zap className="h-4 w-4 text-orange-500" />}
                      <h3 className="font-medium">{tutorial.title}</h3>
                    </div>
                    {completedTutorials.includes(tutorial.id) && (
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tutorial.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <BookOpen className="mr-1 h-3 w-3" />
                      {tutorial.steps.length} steps
                      {tutorial.estimatedTime && (
                        <>
                          <span className="mx-1">•</span>
                          {tutorial.estimatedTime}
                        </>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredTutorials.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Star className="h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No tutorials found</h3>
                <p className="max-w-md mt-1">Try adjusting your search or filter to find tutorials.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("")
                    setActiveTab("all")
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  )
}
