"use client"

import { AuthConfigChecker } from "@/components/debug/auth-config-checker"

export default function AuthDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      <AuthConfigChecker />
    </div>
  )
}
