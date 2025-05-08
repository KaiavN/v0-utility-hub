"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Database } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DbRepairButton() {
  const [isRepairing, setIsRepairing] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    integrityResult?: any
    normalizeResult?: any
    error?: string
  } | null>(null)

  const runDatabaseRepair = async () => {
    setIsRepairing(true)
    setResult(null)

    try {
      const response = await fetch("/api/auth/repair-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || "Failed to repair database",
        })
        return
      }

      setResult({
        success: true,
        integrityResult: data.integrityResult,
        normalizeResult: data.normalizeResult,
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsRepairing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={runDatabaseRepair} disabled={isRepairing} variant="outline" className="flex items-center gap-2">
        <Database className="h-4 w-4" />
        {isRepairing ? "Repairing..." : "Repair Auth Database"}
      </Button>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <div className="flex items-start gap-2">
            {result.success ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
            <div>
              <AlertTitle>{result.success ? "Database Repair Successful" : "Database Repair Failed"}</AlertTitle>
              <AlertDescription className="mt-2">
                {result.error ? (
                  <p>{result.error}</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {result.integrityResult && (
                      <div>
                        <p>
                          <strong>Integrity Check:</strong>
                        </p>
                        <ul className="list-disc pl-5">
                          <li>Missing profiles: {result.integrityResult.missing_profiles}</li>
                          <li>Orphaned profiles: {result.integrityResult.orphaned_profiles}</li>
                          <li>Fixed profiles: {result.integrityResult.fixed_profiles}</li>
                          {result.integrityResult.errors?.length > 0 && (
                            <li>Errors: {result.integrityResult.errors.join(", ")}</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {result.normalizeResult && (
                      <div>
                        <p>
                          <strong>Email Normalization:</strong>
                        </p>
                        <ul className="list-disc pl-5">
                          <li>Updated emails: {result.normalizeResult.updated_count}</li>
                          {result.normalizeResult.errors?.length > 0 && (
                            <li>Errors: {result.normalizeResult.errors.join(", ")}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
    </div>
  )
}
