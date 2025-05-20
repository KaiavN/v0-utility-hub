"use client"

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 p-2 text-muted-foreground text-sm">
      <div className="flex">
        <span className="animate-bounce">•</span>
        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
          •
        </span>
        <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>
          •
        </span>
      </div>
      <span>Someone is typing</span>
    </div>
  )
}
