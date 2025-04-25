import { Loader2 } from "lucide-react"

export default function SpotifyLoading() {
  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading Spotify...</p>
      </div>
    </div>
  )
}
