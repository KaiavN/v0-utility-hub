"use client"

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 p-2 max-w-[100px] ml-2 mb-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
      <span className="text-xs text-muted-foreground">typing...</span>
    </div>
  )
}
