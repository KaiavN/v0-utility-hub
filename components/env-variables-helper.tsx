"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function EnvironmentVariablesHelper() {
  const [missingVars, setMissingVars] = useState<string[]>([])

  useEffect(() => {
    // Check for missing environment variables
    const requiredVars = [
      "STORAGE_NEXT_PUBLIC_SUPABASE_URL",
      "STORAGE_NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "STORAGE_SUPABASE_URL",
      "STORAGE_SUPABASE_SERVICE_ROLE_KEY",
    ]

    const missing = requiredVars.filter((varName) => {
      // For client-side vars, we can check directly
      if (varName.startsWith("NEXT_PUBLIC_")) {
        return !process.env[varName]
      }
      // For server-side vars, we'll need to check via an API endpoint
      return false
    })

    setMissingVars(missing)
  }, [])

  if (missingVars.length === 0) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Environment Variables Check</CardTitle>
        <CardDescription>Some required environment variables are missing or incorrectly configured.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTitle>Missing Environment Variables</AlertTitle>
          <AlertDescription>
            <p className="mb-2">The following environment variables need to be configured:</p>
            <ul className="list-disc pl-5 mb-4">
              {missingVars.map((varName) => (
                <li key={varName}>{varName}</li>
              ))}
            </ul>
            <p>
              Make sure to add these variables to your .env.local file or your deployment environment. Remember that all
              Supabase variables should have the STORAGE_ prefix.
            </p>
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => window.open("https://vercel.com/docs/concepts/projects/environment-variables", "_blank")}
          >
            Learn More About Environment Variables
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
