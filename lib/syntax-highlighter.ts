// Basic syntax highlighting helper

export interface SyntaxToken {
  type: "keyword" | "string" | "number" | "comment" | "function" | "variable" | "operator" | "punctuation" | "text"
  content: string
}

// Update the language-specific keywords to include Python's specific keywords properly
const languageKeywords: Record<string, string[]> = {
  javascript: [
    "var",
    "let",
    "const",
    "function",
    "class",
    "extends",
    "return",
    "if",
    "else",
    "for",
    "while",
    "do",
    "switch",
    "case",
    "default",
    "break",
    "continue",
    "try",
    "catch",
    "finally",
    "throw",
    "new",
    "delete",
    "typeof",
    "instanceof",
    "void",
    "this",
    "super",
    "import",
    "export",
    "from",
    "as",
    "async",
    "await",
    "yield",
    "true",
    "false",
    "null",
    "undefined",
  ],
  typescript: [
    "var",
    "let",
    "const",
    "function",
    "class",
    "extends",
    "return",
    "if",
    "else",
    "for",
    "while",
    "do",
    "switch",
    "case",
    "default",
    "break",
    "continue",
    "try",
    "catch",
    "finally",
    "throw",
    "new",
    "delete",
    "typeof",
    "instanceof",
    "void",
    "this",
    "super",
    "import",
    "export",
    "from",
    "as",
    "async",
    "await",
    "yield",
    "true",
    "false",
    "null",
    "undefined",
    "interface",
    "type",
    "namespace",
    "enum",
    "any",
    "number",
    "string",
    "boolean",
    "symbol",
    "never",
    "unknown",
    "readonly",
    "keyof",
    "is",
    "implements",
    "abstract",
  ],
  html: [
    "html",
    "head",
    "body",
    "div",
    "span",
    "p",
    "a",
    "img",
    "ul",
    "ol",
    "li",
    "table",
    "tr",
    "td",
    "th",
    "form",
    "input",
    "button",
    "select",
    "option",
    "textarea",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "script",
    "style",
    "link",
    "meta",
    "title",
    "header",
    "footer",
    "main",
    "section",
    "article",
    "aside",
    "nav",
  ],
  css: [
    "body",
    "div",
    "span",
    "p",
    "a",
    "img",
    "ul",
    "ol",
    "li",
    "table",
    "tr",
    "td",
    "th",
    "form",
    "input",
    "button",
    "select",
    "option",
    "textarea",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "color",
    "background",
    "margin",
    "padding",
    "border",
    "font",
    "text",
    "display",
    "position",
    "width",
    "height",
    "top",
    "right",
    "bottom",
    "left",
    "float",
    "clear",
    "overflow",
    "z-index",
    "opacity",
    "transition",
    "transform",
  ],
  python: [
    "def",
    "class",
    "from",
    "import",
    "as",
    "if",
    "elif",
    "else",
    "for",
    "while",
    "try",
    "except",
    "finally",
    "with",
    "return",
    "yield",
    "break",
    "continue",
    "pass",
    "raise",
    "True",
    "False",
    "None",
    "and",
    "or",
    "not",
    "is",
    "in",
    "lambda",
    "nonlocal",
    "global",
    "assert",
    "del",
    "async",
    "await",
    "self",
    "print",
    "range",
    "len",
    "dict",
    "list",
    "tuple",
    "set",
    "str",
    "int",
    "float",
    "bool",
  ],
  sql: [
    "select",
    "from",
    "where",
    "and",
    "or",
    "not",
    "order",
    "by",
    "group",
    "having",
    "insert",
    "into",
    "values",
    "update",
    "set",
    "delete",
    "create",
    "table",
    "alter",
    "drop",
    "index",
    "view",
    "join",
    "inner",
    "outer",
    "left",
    "right",
    "full",
    "on",
    "as",
    "distinct",
    "count",
    "sum",
    "avg",
    "min",
    "max",
  ],
  json: ["true", "false", "null"],
}

// Simple tokenizer for basic syntax highlighting
export function tokenize(code: string, language: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  const lowerLang = language.toLowerCase()
  const keywords = languageKeywords[lowerLang] || []

  // Very basic tokenization - this would be replaced with a proper parser in a real implementation
  const lines = code.split("\n")

  for (const line of lines) {
    // Process each line
    let currentIndex = 0

    while (currentIndex < line.length) {
      const remainingLine = line.slice(currentIndex)

      // Check for comments
      if (
        (lowerLang === "javascript" || lowerLang === "typescript" || lowerLang === "css") &&
        remainingLine.startsWith("//")
      ) {
        tokens.push({ type: "comment", content: line.slice(currentIndex) })
        break
      }

      // Check for strings
      if (remainingLine.startsWith('"') || remainingLine.startsWith("'")) {
        const quote = remainingLine[0]
        let endIndex = 1
        while (endIndex < remainingLine.length && remainingLine[endIndex] !== quote) {
          if (remainingLine[endIndex] === "\\") endIndex += 2
          else endIndex++
        }

        tokens.push({
          type: "string",
          content: remainingLine.slice(0, endIndex + 1),
        })

        currentIndex += endIndex + 1
        continue
      }

      // Check for numbers
      const numberMatch = remainingLine.match(/^\d+(\.\d+)?/)
      if (numberMatch) {
        tokens.push({ type: "number", content: numberMatch[0] })
        currentIndex += numberMatch[0].length
        continue
      }

      // Check for keywords
      const wordMatch = remainingLine.match(/^[a-zA-Z_]\w*/)
      if (wordMatch) {
        const word = wordMatch[0]
        if (keywords.includes(word)) {
          tokens.push({ type: "keyword", content: word })
        } else if (remainingLine.slice(word.length).match(/^\s*\(/)) {
          tokens.push({ type: "function", content: word })
        } else {
          tokens.push({ type: "variable", content: word })
        }

        currentIndex += word.length
        continue
      }

      // Check for operators
      const operatorMatch = remainingLine.match(/^[+\-*/%=&|<>!?:]+/)
      if (operatorMatch) {
        tokens.push({ type: "operator", content: operatorMatch[0] })
        currentIndex += operatorMatch[0].length
        continue
      }

      // Check for punctuation
      const punctuationMatch = remainingLine.match(/^[.,;(){}[\]]/)
      if (punctuationMatch) {
        tokens.push({ type: "punctuation", content: punctuationMatch[0] })
        currentIndex += punctuationMatch[0].length
        continue
      }

      // Default case: just add the character as text
      tokens.push({ type: "text", content: remainingLine[0] })
      currentIndex++
    }

    // Add a newline token
    tokens.push({ type: "text", content: "\n" })
  }

  return tokens
}

// Update the checkSyntax function to return line numbers when possible:
export function checkSyntax(code: string, language: string): { error: string | null; line?: number } {
  try {
    if (language.toLowerCase() === "javascript") {
      new Function(code)
    } else if (language.toLowerCase() === "json") {
      JSON.parse(code)
    } else if (language.toLowerCase() === "python") {
      // Basic Python syntax checking
      const lines = code.split("\n")

      // Check for common Python syntax errors
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Check for missing colons in Python blocks
        if (/^(if|elif|else|for|while|def|class|try|except|finally|with).*[^\s:]$/.test(line)) {
          return { error: "Missing colon at the end of statement", line: i + 1 }
        }

        // Check for invalid indentation
        const indent = lines[i].search(/\S|$/)
        if (i > 0 && lines[i - 1].trim() && indent % 4 !== 0) {
          return { error: "Invalid indentation", line: i + 1 }
        }
      }
    }
    return { error: null }
  } catch (error) {
    if (error instanceof Error) {
      // Try to extract line number information from the error message
      const lineMatch = error.message.match(/line\s+(\d+)/) || error.message.match(/position\s+(\d+)/)
      if (lineMatch) {
        return { error: error.message, line: Number.parseInt(lineMatch[1], 10) }
      }
      return { error: error.message }
    }
    return { error: String(error) }
  }
}
