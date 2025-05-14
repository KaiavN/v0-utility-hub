import { AuthCard } from "@/components/auth/auth-buttons"

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-3xl font-bold mb-8">Sign In</h1>
      <AuthCard />
    </div>
  )
}
