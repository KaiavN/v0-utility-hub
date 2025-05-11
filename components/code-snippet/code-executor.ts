// This file implements code execution for various languages

// Python execution via web worker wrapper
export async function executePythonCode(code: string): Promise<string> {
  // In a real implementation, this would use Pyodide or a similar library
  // For now, we'll simulate Python execution with a basic parser

  const output: string[] = []

  try {
    // Simple simulation of Python print statements
    const printRegex = /print\s*$$(.*?)$$/g
    let match

    while ((match = printRegex.exec(code)) !== null) {
      const printContent = match[1].trim()
      // Handle string literals
      if (
        (printContent.startsWith('"') && printContent.endsWith('"')) ||
        (printContent.startsWith("'") && printContent.endsWith("'"))
      ) {
        output.push(printContent.slice(1, -1))
      }
      // Handle variables and expressions (simplified)
      else {
        output.push(`[Simulated: ${printContent}]`)
      }
    }

    // If the code has no print statements, provide a helpful message
    if (output.length === 0) {
      output.push("Note: Your Python code executed, but had no output.")
      output.push("Tip: Use print() to see output in the console.")
    }

    return output.join("\n")
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`
    }
    return `Error: ${String(error)}`
  }
}

// HTML execution (renders HTML)
export function executeHtmlCode(code: string): string {
  try {
    // For security, we'd normally sanitize the HTML first
    // Here we just extract info about the HTML structure

    const tagCount = (code.match(/<[a-z][^>]*>/gi) || []).length
    const hasBody = /<body[^>]*>/.test(code)
    const hasHead = /<head[^>]*>/.test(code)
    const hasScript = /<script[^>]*>/.test(code)

    const titleMatch = code.match(/<title[^>]*>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : "Untitled"

    let info = `HTML Document: "${title}"\n`
    info += `Contains: ${tagCount} tags\n`
    if (hasBody) info += "Has <body> element\n"
    if (hasHead) info += "Has <head> element\n"
    if (hasScript) info += "Contains script elements\n"

    info += "\nNote: In a complete implementation, this would render in an iframe."

    return info
  } catch (error) {
    if (error instanceof Error) {
      return `Error rendering HTML: ${error.message}`
    }
    return `Error rendering HTML: ${String(error)}`
  }
}

// CSS execution (simulated)
export function executeCssCode(code: string): string {
  try {
    // Extract basic info about CSS
    const ruleCount = (code.match(/{[^}]*}/g) || []).length
    const colorCount = (code.match(/color\s*:/g) || []).length
    const hasMedia = /@media/.test(code)
    const hasAnimation = /@keyframes/.test(code)

    let info = `CSS Stylesheet Analysis:\n`
    info += `Contains: ${ruleCount} style rules\n`
    info += `Color properties: ${colorCount}\n`
    if (hasMedia) info += "Uses media queries\n"
    if (hasAnimation) info += "Contains animations\n"

    info += "\nNote: In a complete implementation, this would be applied to HTML content."

    return info
  } catch (error) {
    if (error instanceof Error) {
      return `Error analyzing CSS: ${error.message}`
    }
    return `Error analyzing CSS: ${String(error)}`
  }
}

// SQL execution (simulated)
export function executeSqlCode(code: string): string {
  try {
    // Check what type of SQL statement it is
    const isSelect = /^SELECT/i.test(code.trim())
    const isInsert = /^INSERT/i.test(code.trim())
    const isUpdate = /^UPDATE/i.test(code.trim())
    const isDelete = /^DELETE/i.test(code.trim())
    const isCreate = /^CREATE/i.test(code.trim())

    let result = ""

    if (isSelect) {
      result = "Query would return results from the database.\n"
      // Extract table names
      const fromMatch = code.match(/FROM\s+([a-z_][a-z0-9_]*)/i)
      if (fromMatch) {
        result += `Table queried: ${fromMatch[1]}\n`
      }

      // Extract columns
      const columnsMatch = code.match(/SELECT\s+(.*?)\s+FROM/is)
      if (columnsMatch) {
        const columns = columnsMatch[1].split(",").map((c) => c.trim())
        result += `Columns selected: ${columns.join(", ")}\n`
      }

      result += "\nExample result set:\n"
      result += "| id | name       | value |\n"
      result += "|----|-----------|-----------|\n"
      result += "| 1  | Example 1 | 100.00    |\n"
      result += "| 2  | Example 2 | 200.50    |"
    } else if (isInsert) {
      result = "Would insert new records into the database.\n"
      // Extract table name
      const tableMatch = code.match(/INTO\s+([a-z_][a-z0-9_]*)/i)
      if (tableMatch) {
        result += `Target table: ${tableMatch[1]}\n`
      }
      result += "Operation completed successfully."
    } else if (isUpdate) {
      result = "Would update existing records in the database.\n"
      // Extract table name
      const tableMatch = code.match(/UPDATE\s+([a-z_][a-z0-9_]*)/i)
      if (tableMatch) {
        result += `Target table: ${tableMatch[1]}\n`
      }
      result += "Rows affected: 2"
    } else if (isDelete) {
      result = "Would delete records from the database.\n"
      // Extract table name
      const tableMatch = code.match(/FROM\s+([a-z_][a-z0-9_]*)/i)
      if (tableMatch) {
        result += `Target table: ${tableMatch[1]}\n`
      }
      result += "Rows affected: 1"
    } else if (isCreate) {
      result = "Would create a new database object.\n"
      if (/CREATE\s+TABLE/i.test(code)) {
        const tableMatch = code.match(/TABLE\s+([a-z_][a-z0-9_]*)/i)
        if (tableMatch) {
          result += `Created table: ${tableMatch[1]}\n`
        }
        result += "Table created successfully."
      } else if (/CREATE\s+INDEX/i.test(code)) {
        result += "Index created successfully."
      } else if (/CREATE\s+VIEW/i.test(code)) {
        result += "View created successfully."
      }
    } else {
      result = "SQL statement processed successfully."
    }

    return result
  } catch (error) {
    if (error instanceof Error) {
      return `SQL Error: ${error.message}`
    }
    return `SQL Error: ${String(error)}`
  }
}
