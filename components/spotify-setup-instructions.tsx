"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SPOTIFY_CONFIG } from "@/lib/spotify-config"

export function SpotifySetupInstructions() {
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Spotify Authentication Error</CardTitle>
        <CardDescription>
          There was an issue with the Spotify redirect URI. This usually happens when the redirect URI in your Spotify
          Developer Dashboard doesn't match the one used in the app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showInstructions ? (
          <div className="space-y-4 text-sm">
            <p>To fix this issue:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Go to the{" "}
                <a
                  href="https://developer.spotify.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Spotify Developer Dashboard
                </a>
              </li>
              <li>Select your application</li>
              <li>Click on "Edit Settings"</li>
              <li>Under "Redirect URIs", add the following URL:</li>
              <div className="bg-muted p-2 rounded-md font-mono text-xs break-all">{SPOTIFY_CONFIG.REDIRECT_URI}</div>
              <li>Click "Save" at the bottom</li>
              <li>Try connecting to Spotify again</li>
            </ol>
          </div>
        ) : (
          <p>Click below to see instructions on how to fix this issue.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={() => setShowInstructions(!showInstructions)}>
          {showInstructions ? "Hide Instructions" : "Show Instructions"}
        </Button>
      </CardFooter>
    </Card>
  )
}
