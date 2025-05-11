"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export function HelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Help Center" data-help-button>
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <HelpCircle className="h-6 w-6" />
              Help Center
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="faq" className="mt-4">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="faq">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>How do I save my data?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>
                        Your data is automatically saved to your browser's local storage. For additional backup options,
                        go to Settings and use the Export Data feature to download a backup file.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Can I access my data on multiple devices?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>
                        Yes! Enable cloud sync in Settings to access your data across all your devices. You'll need to
                        be logged in with the same account on each device.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>How do I create recurring workouts?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>
                        When creating a new workout, check the "Make recurring" option and select your preferred
                        schedule. The system will automatically create new instances of this workout according to your
                        schedule.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Is my data private?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>
                        Yes, your data is stored locally on your device and, if enabled, in your personal cloud storage.
                        We do not share your data with third parties.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>How do I customize the interface?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>
                        Go to Settings and look for the Appearance section. You can toggle between light and dark mode,
                        adjust text size, and customize other visual preferences.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="guides">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Getting Started Guide</CardTitle>
                      <CardDescription>A comprehensive introduction to the application</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">
                        This guide will walk you through the basic features and help you set up your workspace.
                      </p>
                      <Button
                        onClick={() => {
                          setOpen(false)
                          document.dispatchEvent(
                            new CustomEvent("open-tutorial", {
                              detail: { tutorialId: "getting-started" },
                            }),
                          )
                        }}
                      >
                        Open Tutorial
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Workout Tracker Guide</CardTitle>
                      <CardDescription>Learn how to track your fitness progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">
                        This guide explains how to create workouts, track exercises, and monitor your fitness progress
                        over time.
                      </p>
                      <Button
                        onClick={() => {
                          setOpen(false)
                          document.dispatchEvent(
                            new CustomEvent("open-tutorial", {
                              detail: { tutorialId: "workout-tracker" },
                            }),
                          )
                        }}
                      >
                        Open Tutorial
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Data Backup & Recovery</CardTitle>
                      <CardDescription>Protect your important information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">
                        Learn how to back up your data and restore it if needed, ensuring you never lose important
                        information.
                      </p>
                      <Button
                        onClick={() => {
                          setOpen(false)
                          document.dispatchEvent(
                            new CustomEvent("open-tutorial", {
                              detail: { tutorialId: "data-backup" },
                            }),
                          )
                        }}
                      >
                        Open Tutorial
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle>Need Additional Help?</CardTitle>
                  <CardDescription>We're here to assist you</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    If you're experiencing issues or have questions that aren't covered in our guides and FAQs, please
                    reach out to our support team.
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Email Support</h3>
                      <p className="text-sm text-muted-foreground">Send us an email at support@example.com</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Community Forum</h3>
                      <p className="text-sm text-muted-foreground">
                        Join our community forum to connect with other users and find solutions.
                      </p>
                      <Button variant="link" className="p-0 h-auto mt-2">
                        Visit Forum
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Feature Requests</h3>
                      <p className="text-sm text-muted-foreground">Have an idea for improving the app? Let us know!</p>
                      <Button variant="link" className="p-0 h-auto mt-2">
                        Submit Request
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
