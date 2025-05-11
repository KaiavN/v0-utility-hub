"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lightbulb, Database, Shield, Clock } from "lucide-react"

export function FAQsContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
          <CardDescription>Find answers to common questions about using Utility Hub</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="data">Data & Storage</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is Utility Hub?</AccordionTrigger>
                  <AccordionContent>
                    Utility Hub is a comprehensive web application that provides various productivity tools in one
                    place. It includes features like task management, calendar, finance tracking, knowledge base, and
                    more - all designed to work offline and store data locally in your browser.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Is Utility Hub free to use?</AccordionTrigger>
                  <AccordionContent>
                    Yes, Utility Hub is completely free to use. All features are available without any subscription. If
                    you find it useful, you can support the development through Ko-fi.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>How do I get started with Utility Hub?</AccordionTrigger>
                  <AccordionContent>
                    You can start using Utility Hub right away without any setup. Simply navigate to the features you
                    want to use from the sidebar. For a guided introduction, click on the "Tutorials" button in the
                    header to access interactive walkthroughs of each feature.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Can I use Utility Hub on mobile devices?</AccordionTrigger>
                  <AccordionContent>
                    Yes, Utility Hub is fully responsive and works on mobile devices. The interface adapts to smaller
                    screens to provide a good user experience on smartphones and tablets.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="data">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="data-1">
                  <AccordionTrigger>
                    <span className="flex items-center">
                      <Database className="mr-2 h-4 w-4" />
                      How is my data stored?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    Your data is stored locally in your browser's localStorage. This means your information stays on
                    your device and is not sent to any servers unless you explicitly enable cloud sync with an account.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-2">
                  <AccordionTrigger>
                    <span className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Is my data secure?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    Since your data is stored locally on your device, it's as secure as your device. The app doesn't
                    send your data to any servers by default. For sensitive information like passwords, we recommend
                    using the built-in encryption features.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-3">
                  <AccordionTrigger>How do I back up my data?</AccordionTrigger>
                  <AccordionContent>
                    You can back up your data by going to Settings and using the "Export Data" option. This will
                    download a JSON file containing all your data that you can store safely. To restore from a backup,
                    use the "Import Data" option.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-4">
                  <AccordionTrigger>Can I access my data across different devices?</AccordionTrigger>
                  <AccordionContent>
                    By default, your data is stored locally on each device. To access the same data across multiple
                    devices, you can either:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Create an account and enable cloud sync (coming soon)</li>
                      <li>Manually export your data from one device and import it on another</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="features">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="features-1">
                  <AccordionTrigger>What features are available in Utility Hub?</AccordionTrigger>
                  <AccordionContent>
                    Utility Hub includes a wide range of features:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Task and project management with Gantt charts</li>
                      <li>Calendar and scheduling</li>
                      <li>Finance tracking and budgeting</li>
                      <li>Knowledge base and note-taking</li>
                      <li>Recipe manager</li>
                      <li>Code snippet storage</li>
                      <li>Bookmark manager</li>
                      <li>Password manager (with encryption)</li>
                      <li>Spotify integration</li>
                      <li>And many more!</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="features-2">
                  <AccordionTrigger>How does the Spotify integration work?</AccordionTrigger>
                  <AccordionContent>
                    The Spotify integration allows you to control your Spotify playback directly from Utility Hub.
                    You'll need to connect your Spotify account by clicking on the Spotify section and following the
                    authentication process. Once connected, you can search for songs, control playback, and manage
                    playlists.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="features-3">
                  <AccordionTrigger>Can I customize the app for my specific needs?</AccordionTrigger>
                  <AccordionContent>
                    Yes, Utility Hub is designed to be customizable. You can:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Choose between light and dark mode</li>
                      <li>Select your role (student or professional) to optimize the interface</li>
                      <li>Customize the dashboard to show your most-used features</li>
                      <li>Set up personal preferences in each module</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="troubleshooting">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="trouble-1">
                  <AccordionTrigger>
                    <span className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      My data disappeared after clearing browser cache
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    Since Utility Hub stores data in your browser's localStorage, clearing your browser cache or cookies
                    will remove this data. We strongly recommend regularly exporting your data as a backup from the
                    Settings page. If you've lost data, you can restore from a previous backup using the Import feature.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="trouble-2">
                  <AccordionTrigger>The app is running slowly. What can I do?</AccordionTrigger>
                  <AccordionContent>
                    If the app is running slowly, try these steps:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Clear your browser cache (but export your data first!)</li>
                      <li>Check if you have a large amount of data stored (especially images)</li>
                      <li>Try using a different browser</li>
                      <li>Disable any browser extensions that might be interfering</li>
                      <li>Make sure your browser is updated to the latest version</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="trouble-3">
                  <AccordionTrigger>How do I report a bug or request a feature?</AccordionTrigger>
                  <AccordionContent>
                    If you encounter a bug or have a feature request, please email support at kaiav.nihalani@gmail.com
                    with details about the issue or feature you'd like to see. Include information about your browser,
                    device, and steps to reproduce any bugs.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="trouble-4">
                  <AccordionTrigger>The Spotify integration isn't working</AccordionTrigger>
                  <AccordionContent>
                    If you're having trouble with the Spotify integration:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Make sure you have an active Spotify Premium account</li>
                      <li>Try disconnecting and reconnecting your account</li>
                      <li>Check if you have an active Spotify session on another device</li>
                      <li>Ensure you've granted all the necessary permissions during authentication</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        <span>Can't find what you're looking for? Contact support at kaiav.nihalani@gmail.com</span>
      </div>
    </div>
  )
}
