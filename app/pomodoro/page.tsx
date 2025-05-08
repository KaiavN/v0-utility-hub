"use client"

import { useState, useEffect, useRef } from "react"
import { Pause, Play, RefreshCw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { getLocalStorage, setLocalStorage } from "@/lib/local-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface PomodoroSettings {
  focusTime: number
  shortBreakTime: number
  longBreakTime: number
  longBreakInterval: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  alarmSound: boolean
  automaticMode: boolean // New setting for fully automatic mode
}

interface PomodoroSession {
  completedPomodoros: number
  totalFocusTime: number
  lastSessionDate: string
}

// Default settings to use if none are found in localStorage
const DEFAULT_SETTINGS: PomodoroSettings = {
  focusTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartPomodoros: true,
  alarmSound: true,
  automaticMode: false,
}

// Default session to use if none is found in localStorage
const DEFAULT_SESSION: PomodoroSession = {
  completedPomodoros: 0,
  totalFocusTime: 0,
  lastSessionDate: new Date().toISOString().split("T")[0],
}

export default function PomodoroPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS)
  const [session, setSession] = useState<PomodoroSession>(DEFAULT_SESSION)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focusTime * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<"focus" | "shortBreak" | "longBreak">("focus")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    try {
      // Load settings from localStorage with fallback to defaults
      const savedSettings = getLocalStorage<PomodoroSettings>("pomodoroSettings", null)
      const savedSession = getLocalStorage<PomodoroSession>("pomodoroSession", null)

      // Use saved settings if they exist and are valid, otherwise use defaults
      if (savedSettings && typeof savedSettings === "object" && "focusTime" in savedSettings) {
        setSettings(savedSettings)
        // Set initial timer based on loaded settings
        setTimeLeft(savedSettings.focusTime * 60)
      } else {
        console.warn("Invalid or missing pomodoro settings, using defaults")
        setSettings(DEFAULT_SETTINGS)
        // Ensure we save the default settings to localStorage
        setLocalStorage("pomodoroSettings", DEFAULT_SETTINGS)
      }

      // Use saved session if it exists and is valid, otherwise use defaults
      if (savedSession && typeof savedSession === "object" && "completedPomodoros" in savedSession) {
        setSession(savedSession)
      } else {
        console.warn("Invalid or missing pomodoro session, using defaults")
        setSession(DEFAULT_SESSION)
        // Ensure we save the default session to localStorage
        setLocalStorage("pomodoroSession", DEFAULT_SESSION)
      }

      // Create audio element
      audioRef.current = new Audio("/alarm.mp3")

      setIsInitialized(true)
    } catch (error) {
      console.error("Error initializing pomodoro:", error)
      // Ensure we have valid settings even if there was an error
      setSettings(DEFAULT_SETTINGS)
      setSession(DEFAULT_SESSION)
      setTimeLeft(DEFAULT_SETTINGS.focusTime * 60)
      setIsInitialized(true)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isInitialized) {
      setLocalStorage("pomodoroSettings", settings)
    }
  }, [settings, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      setLocalStorage("pomodoroSession", session)
    }
  }, [session, isInitialized])

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!)
            handleTimerComplete()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isActive])

  const handleTimerComplete = () => {
    if (settings.alarmSound) {
      playAlarmSound()
    }

    if (mode === "focus") {
      // Update session stats
      const updatedSession = {
        ...session,
        completedPomodoros: session.completedPomodoros + 1,
        totalFocusTime: session.totalFocusTime + settings.focusTime,
      }
      setSession(updatedSession)

      // Determine next break type
      const isLongBreak = updatedSession.completedPomodoros % settings.longBreakInterval === 0
      const nextMode = isLongBreak ? "longBreak" : "shortBreak"

      setMode(nextMode)
      setTimeLeft(isLongBreak ? settings.longBreakTime * 60 : settings.shortBreakTime * 60)

      toast({
        title: "Focus session completed!",
        description: `Time for a ${isLongBreak ? "long" : "short"} break.`,
      })

      // Auto start break if enabled or in automatic mode
      setIsActive(settings.automaticMode || settings.autoStartBreaks)
    } else {
      // Break is over, back to focus
      setMode("focus")
      setTimeLeft(settings.focusTime * 60)

      toast({
        title: "Break completed!",
        description: "Time to focus again.",
      })

      // Auto start pomodoro if enabled or in automatic mode
      setIsActive(settings.automaticMode || settings.autoStartPomodoros)
    }
  }

  const playAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((error) => {
        console.error("Error playing sound:", error)
      })
    }
  }

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)

    switch (mode) {
      case "focus":
        setTimeLeft(settings.focusTime * 60)
        break
      case "shortBreak":
        setTimeLeft(settings.shortBreakTime * 60)
        break
      case "longBreak":
        setTimeLeft(settings.longBreakTime * 60)
        break
    }
  }

  const changeMode = (newMode: "focus" | "shortBreak" | "longBreak") => {
    setIsActive(false)
    setMode(newMode)

    switch (newMode) {
      case "focus":
        setTimeLeft(settings.focusTime * 60)
        break
      case "shortBreak":
        setTimeLeft(settings.shortBreakTime * 60)
        break
      case "longBreak":
        setTimeLeft(settings.longBreakTime * 60)
        break
    }
  }

  const saveSettings = (newSettings: PomodoroSettings) => {
    setSettings(newSettings)
    resetTimer()
    setIsSettingsOpen(false)

    toast({
      title: "Settings saved",
      description: "Your pomodoro settings have been updated.",
    })
  }

  const resetSession = () => {
    setSession({
      completedPomodoros: 0,
      totalFocusTime: 0,
      lastSessionDate: new Date().toISOString().split("T")[0],
    })

    toast({
      title: "Session reset",
      description: "Your pomodoro session has been reset.",
    })
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    let totalSeconds

    switch (mode) {
      case "focus":
        totalSeconds = settings.focusTime * 60
        break
      case "shortBreak":
        totalSeconds = settings.shortBreakTime * 60
        break
      case "longBreak":
        totalSeconds = settings.longBreakTime * 60
        break
      default:
        totalSeconds = settings.focusTime * 60
    }

    return ((totalSeconds - timeLeft) / totalSeconds) * 100
  }

  // If not initialized yet, show a loading state
  if (!isInitialized) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Loading Pomodoro Timer...</h2>
            <p className="text-muted-foreground">Please wait while we set up your timer.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
        <p className="text-muted-foreground">Stay focused and take regular breaks</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pomodoro Timer</CardTitle>
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Timer Settings</DialogTitle>
                      <DialogDescription>Customize your pomodoro timer settings.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="focusTime">Focus Time (minutes)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            id="focusTime"
                            min={1}
                            max={60}
                            step={1}
                            value={[settings.focusTime]}
                            onValueChange={(value) => setSettings({ ...settings, focusTime: value[0] })}
                            className="flex-1"
                          />
                          <span className="w-12 text-center">{settings.focusTime}</span>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="shortBreakTime">Short Break (minutes)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            id="shortBreakTime"
                            min={1}
                            max={30}
                            step={1}
                            value={[settings.shortBreakTime]}
                            onValueChange={(value) => setSettings({ ...settings, shortBreakTime: value[0] })}
                            className="flex-1"
                          />
                          <span className="w-12 text-center">{settings.shortBreakTime}</span>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="longBreakTime">Long Break (minutes)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            id="longBreakTime"
                            min={5}
                            max={60}
                            step={1}
                            value={[settings.longBreakTime]}
                            onValueChange={(value) => setSettings({ ...settings, longBreakTime: value[0] })}
                            className="flex-1"
                          />
                          <span className="w-12 text-center">{settings.longBreakTime}</span>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="longBreakInterval">Long Break Interval</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            id="longBreakInterval"
                            min={1}
                            max={8}
                            step={1}
                            value={[settings.longBreakInterval]}
                            onValueChange={(value) => setSettings({ ...settings, longBreakInterval: value[0] })}
                            className="flex-1"
                          />
                          <span className="w-12 text-center">{settings.longBreakInterval}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoStartBreaks">Auto-start Breaks</Label>
                        <Switch
                          id="autoStartBreaks"
                          checked={settings.autoStartBreaks}
                          onCheckedChange={(checked) => setSettings({ ...settings, autoStartBreaks: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoStartPomodoros">Auto-start Pomodoros</Label>
                        <Switch
                          id="autoStartPomodoros"
                          checked={settings.autoStartPomodoros}
                          onCheckedChange={(checked) => setSettings({ ...settings, autoStartPomodoros: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="alarmSound">Alarm Sound</Label>
                        <Switch
                          id="alarmSound"
                          checked={settings.alarmSound}
                          onCheckedChange={(checked) => setSettings({ ...settings, alarmSound: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="automaticMode">Automatic Mode</Label>
                        <div className="space-y-1">
                          <Switch
                            id="automaticMode"
                            checked={settings.automaticMode}
                            onCheckedChange={(checked) =>
                              setSettings({
                                ...settings,
                                automaticMode: checked,
                                // If automatic mode is enabled, also enable auto-start breaks and pomodoros
                                autoStartBreaks: checked ? true : settings.autoStartBreaks,
                                autoStartPomodoros: checked ? true : settings.autoStartPomodoros,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Automatically cycles through work and break periods
                          </p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => saveSettings(settings)}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <Tabs
                defaultValue="focus"
                value={mode}
                onValueChange={(value: "focus" | "shortBreak" | "longBreak") => changeMode(value)}
                className="mb-6 w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="focus">Focus</TabsTrigger>
                  <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
                  <TabsTrigger value="longBreak">Long Break</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative mb-8 flex h-64 w-64 items-center justify-center rounded-full border-4 border-primary">
                <div
                  className="absolute inset-0 rounded-full bg-primary/10"
                  style={{
                    background: `conic-gradient(var(--primary) ${calculateProgress()}%, transparent ${calculateProgress()}%)`,
                    borderRadius: "100%",
                  }}
                />
                <div className="relative z-10 text-6xl font-bold">{formatTime(timeLeft)}</div>
              </div>

              <div className="flex gap-4">
                <Button size="lg" onClick={toggleTimer} className="h-12 w-12 rounded-full p-0">
                  {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <Button variant="outline" size="lg" onClick={resetTimer} className="h-12 w-12 rounded-full p-0">
                  <RefreshCw className="h-6 w-6" />
                </Button>
              </div>
              {settings.automaticMode && (
                <div className="mt-2 flex items-center justify-center">
                  <Badge variant="outline" className="bg-primary/10">
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Automatic Mode
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Session Stats</CardTitle>
              <CardDescription>Today's progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Completed Pomodoros</h3>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{session.completedPomodoros}</div>
                  <div className="text-sm text-muted-foreground">today</div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Focus Time</h3>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{session.totalFocusTime}</div>
                  <div className="text-sm text-muted-foreground">minutes</div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Current Streak</h3>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">
                    {Math.floor(session.completedPomodoros / settings.longBreakInterval)}
                  </div>
                  <div className="text-sm text-muted-foreground">sets</div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-2 font-medium">Pomodoro Technique</h3>
                <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Work for {settings.focusTime} minutes</li>
                  <li>Take a short {settings.shortBreakTime} minute break</li>
                  <li>Repeat 4 times</li>
                  <li>Take a longer {settings.longBreakTime} minute break</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={resetSession}>
                Reset Today's Stats
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
