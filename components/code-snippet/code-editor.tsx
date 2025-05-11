"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Check, Play, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  initialCode: string
  language: string
  title?: string
  readOnly?: boolean
  onChange?: (code: string) => void
  onRun?: (output: string, error: string | null) => void
}

// Define languages that can be executed in the browser
const executableLanguages = ["javascript", "js", "typescript", "ts", "json", "python", "py", "html", "css"]

// Language-specific syntax checking
const checkSyntax = (code: string, language: string): { message: string | null; line?: number; col?: number } => {
  try {
    if (["javascript", "js", "typescript", "ts"].includes(language.toLowerCase())) {
      // For TypeScript, we strip type annotations before checking syntax
      const processedCode = language.toLowerCase().startsWith("type")
        ? code.replace(/:\s*\w+(\[\])?/g, "").replace(/<.*?>/g, "")
        : code
      new Function(processedCode)
    } else if (language.toLowerCase() === "json") {
      JSON.parse(code)
    } else if (["python", "py"].includes(language.toLowerCase())) {
      // Basic Python syntax checking using regex patterns
      // Check for mismatched indentation
      const lines = code.split("\n")
      let prevIndent = 0
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.trim() === "") continue

        const indent = line.search(/\S/)
        if (indent > prevIndent + 4) {
          return { message: `Indentation error`, line: i + 1, col: indent }
        }

        // Check for missing colons in if/for/while statements
        if (/^\s*(if|for|while|def|class).*[^:]$/.test(line)) {
          return { message: `Missing colon at the end of statement`, line: i + 1, col: line.length }
        }

        prevIndent = indent
      }
    } else if (language.toLowerCase() === "html") {
      // Basic HTML syntax checking
      const missingClosingTag = /<([a-z]+)[^>]*>[^<]*$/.exec(code)
      if (missingClosingTag) {
        return { message: `Missing closing tag for <${missingClosingTag[1]}>`, line: code.split("\n").length }
      }
    }
    return { message: null }
  } catch (error) {
    if (error instanceof Error) {
      // Extract line number from error message if possible
      const lineMatch = error.message.match(/line\s+(\d+)/i) || error.message.match(/position\s+(\d+)/i)
      const line = lineMatch ? Number.parseInt(lineMatch[1], 10) : undefined

      return { message: error.message, line }
    }
    return { message: String(error) }
  }
}

export function CodeEditor({ initialCode, language, title, readOnly = false, onChange, onRun }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [output, setOutput] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [syntaxError, setSyntaxError] = useState<{ message: string | null; line?: number; col?: number }>({
    message: null,
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const previousCodeRef = useRef(initialCode)
  const previousLanguageRef = useRef(language)

  // Determine if the language is executable
  const isExecutable = executableLanguages.includes(language.toLowerCase())

  // Update code when initialCode prop changes
  useEffect(() => {
    if (initialCode !== previousCodeRef.current) {
      setCode(initialCode)
      previousCodeRef.current = initialCode
    }
  }, [initialCode])

  // Update language when language prop changes
  useEffect(() => {
    if (language !== previousLanguageRef.current) {
      previousLanguageRef.current = language
    }
  }, [language])

  // Check for syntax errors
  useEffect(() => {
    if (isExecutable) {
      const error = checkSyntax(code, language)
      setSyntaxError(error)
    } else {
      setSyntaxError({ message: null })
    }
  }, [code, language, isExecutable])

  // Notify parent of code changes, but only when the user actually changes the code
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode)
      if (onChange && newCode !== previousCodeRef.current) {
        previousCodeRef.current = newCode
        onChange(newCode)
      }
    },
    [onChange],
  )

  // Run the code
  const runCode = useCallback(() => {
    if (syntaxError.message || !isExecutable) return

    setIsRunning(true)
    setOutput("")

    // Create a safe environment to run the code
    try {
      const originalConsole = { ...console }
      const logs: string[] = []

      // Override console methods
      console.log = (...args) => {
        logs.push(args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg))).join(" "))
        originalConsole.log(...args)
      }

      console.error = (...args) => {
        logs.push(
          `Error: ${args
            .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
            .join(" ")}`,
        )
        originalConsole.error(...args)
      }

      console.warn = (...args) => {
        logs.push(
          `Warning: ${args
            .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
            .join(" ")}`,
        )
        originalConsole.warn(...args)
      }

      // Execute the code
      let result
      if (["javascript", "js", "typescript", "ts"].includes(language.toLowerCase())) {
        // For TypeScript, we strip type annotations before execution
        const processedCode = language.toLowerCase().startsWith("type")
          ? code.replace(/:\s*\w+(\[\])?/g, "").replace(/<.*?>/g, "")
          : code
        result = new Function(processedCode)()
      } else if (language.toLowerCase() === "json") {
        result = JSON.stringify(JSON.parse(code), null, 2)
      } else if (["python", "py"].includes(language.toLowerCase())) {
        // Use a simple message for Python since we can't directly execute it in the browser
        logs.push("Python execution is simulated. In a full implementation, we would use Pyodide or a similar library.")
        logs.push("Sample output based on code analysis:")

        // Very basic simulation of Python output for demonstration
        if (code.includes("print(")) {
          const printMatches = code.match(/print\s*$$(.*?)$$/g) || []
          printMatches.forEach((match) => {
            const content = match.replace(/print\s*$$|$$/g, "").trim()
            if (content.startsWith('"') || content.startsWith("'")) {
              logs.push(content.slice(1, -1))
            } else {
              logs.push(`[Evaluated]: ${content}`)
            }
          })
        }

        if (code.includes("for ")) {
          logs.push("[Loop execution simulated]")
        }

        if (code.includes("if ")) {
          logs.push("[Conditional execution simulated]")
        }
      } else if (language.toLowerCase() === "html") {
        logs.push("HTML rendering would be displayed in an iframe in a full implementation.")

        // Extract title if present
        const titleMatch = code.match(/<title>(.*?)<\/title>/i)
        if (titleMatch) {
          logs.push(`Page title: ${titleMatch[1]}`)
        }

        // Count elements for basic info
        const elements = code.match(/<[a-z][^>]*>/gi) || []
        logs.push(`HTML document contains approximately ${elements.length} elements.`)
      } else if (language.toLowerCase() === "css") {
        logs.push("CSS styles would be applied to the HTML content in a full implementation.")

        // Count rules for basic info
        const rules = code.match(/\{[^}]*\}/g) || []
        logs.push(`CSS contains approximately ${rules.length} style rules.`)
      }

      // Restore original console
      console.log = originalConsole.log
      console.error = originalConsole.error
      console.warn = originalConsole.warn

      // Display the output
      const outputText = logs.join("\n") + (result !== undefined ? `\nResult: ${result}` : "")
      setOutput(outputText)

      if (onRun) {
        onRun(outputText, null)
      }
    } catch (error) {
      let errorMessage = "Unknown Error"
      if (error instanceof Error) {
        errorMessage = `Runtime Error: ${error.message}`
      } else {
        errorMessage = `Unknown Error: ${String(error)}`
      }

      setOutput(errorMessage)

      if (onRun) {
        onRun("", errorMessage)
      }
    } finally {
      setIsRunning(false)

      // Scroll to the bottom of the output
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight
      }
    }
  }, [code, language, syntaxError.message, isExecutable, onRun])

  // Handle tab key in textarea
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault()
        const start = e.currentTarget.selectionStart
        const end = e.currentTarget.selectionEnd

        // Insert tab at cursor position
        const newCode = code.substring(0, start) + "  " + code.substring(end)
        handleCodeChange(newCode)

        // Move cursor after the inserted tab
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 2
            textareaRef.current.selectionEnd = start + 2
          }
        }, 0)
      }
    },
    [code, handleCodeChange],
  )

  // Add line numbers and error highlighting to the editor
  const renderCodeWithLineNumbers = useCallback(() => {
    if (!code) return null

    const lines = code.split("\n")
    return (
      <div className="absolute top-0 left-0 w-full pointer-events-none">
        {lines.map((line, index) => (
          <div key={index} className={cn("flex", syntaxError.line === index + 1 && "bg-red-100/30 dark:bg-red-900/20")}>
            <div className="w-8 text-right px-2 text-xs opacity-50 select-none border-r border-muted">{index + 1}</div>
            <div className="px-2 whitespace-pre"> </div>
          </div>
        ))}
      </div>
    )
  }, [code, syntaxError])

  return (
    <Card className="border shadow-md">
      {title && (
        <CardHeader className="py-3 px-4 border-b bg-muted/30">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <div className="relative">
        {isExecutable && (
          <div className="absolute top-0 right-0 p-2 z-10 flex gap-2">
            {syntaxError.message ? (
              <div className="flex items-center gap-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3" />
                <span>Syntax Error {syntaxError.line ? `(Line ${syntaxError.line})` : ""}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                <Check className="h-3 w-3" />
                <span>Valid Syntax</span>
              </div>
            )}
          </div>
        )}
        <div className="relative font-mono text-sm">
          {renderCodeWithLineNumbers()}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full p-4 font-mono text-sm bg-muted/10 resize-none outline-none min-h-[200px] max-h-[400px] overflow-auto pl-10",
              readOnly && "opacity-80 cursor-not-allowed",
              syntaxError.message && isExecutable && "border-l-4 border-red-500",
            )}
            style={{ tabSize: 2 }}
            spellCheck="false"
            readOnly={readOnly}
          />
        </div>
      </div>

      {syntaxError.message && isExecutable && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
          <p className="font-medium">Syntax Error {syntaxError.line ? `(Line ${syntaxError.line})` : ""}:</p>
          <p className="mt-1 whitespace-pre-wrap">{syntaxError.message}</p>
        </div>
      )}

      <CardFooter className="flex justify-between items-center p-2 border-t bg-muted/20">
        <div className="text-xs text-muted-foreground">{language.toUpperCase()}</div>
        {isExecutable && (
          <Button
            size="sm"
            onClick={runCode}
            disabled={!!syntaxError.message || isRunning || readOnly}
            className={cn("gap-1", (!!syntaxError.message || readOnly) && "opacity-50 cursor-not-allowed")}
          >
            <Play className="h-3 w-3" />
            Run Code
          </Button>
        )}
      </CardFooter>

      {output && (
        <div className="border-t">
          <div className="px-4 py-2 bg-black text-white text-xs font-mono">
            <div className="text-xs text-gray-400 mb-1">Output:</div>
            <div ref={outputRef} className="whitespace-pre-wrap max-h-[200px] overflow-auto">
              {output}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
