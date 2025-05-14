import EnvVariablesDebug from "@/components/debug/env-variables-debug"

export default function EnvDebugPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>
      <EnvVariablesDebug />
    </div>
  )
}
