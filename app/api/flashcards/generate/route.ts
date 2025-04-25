import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { noteTitle, noteContent } = await request.json()

    if (!noteTitle || !noteContent) {
      return NextResponse.json({ error: "Missing note title or content" }, { status: 400 })
    }

    // Create a simple system to extract flashcards from the note content
    const flashcards = []

    // First try to find Q&A patterns in the content
    const qaRegex = /Q:\s*(.*?)\s*\n+A:\s*(.*?)(?=\n+Q:|\n*$)/gs
    let match

    while ((match = qaRegex.exec(noteContent)) !== null) {
      if (match[1] && match[2]) {
        flashcards.push({
          front: match[1].trim(),
          back: match[2].trim(),
        })
      }
    }

    // If no Q&A patterns found, generate flashcards from headings and paragraphs
    if (flashcards.length === 0) {
      // Split content by lines
      const lines = noteContent.split("\n")
      let currentHeading = ""

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Check if line is a heading
        if (line.startsWith("# ")) {
          currentHeading = line.substring(2).trim()

          // Look for the next paragraph to use as the answer
          let answer = ""
          for (let j = i + 1; j < lines.length && !lines[j].startsWith("#"); j++) {
            if (lines[j].trim() && !lines[j].startsWith("- ") && !lines[j].startsWith("*")) {
              answer = lines[j].trim()
              break
            }
          }

          if (answer) {
            flashcards.push({
              front: `What is ${currentHeading}?`,
              back: answer,
            })
          }
        }

        // Check for bullet points which can make good flashcards
        if ((line.startsWith("- ") || line.startsWith("* ")) && line.length > 3) {
          const point = line.substring(2).trim()
          if (currentHeading && point) {
            flashcards.push({
              front: `What is one key point about ${currentHeading}?`,
              back: point,
            })
          }
        }
      }
    }

    // If still no flashcards, create some basic ones from the content
    if (flashcards.length === 0) {
      // Split content into paragraphs
      const paragraphs = noteContent.split("\n\n").filter((p) => p.trim().length > 0)

      for (let i = 0; i < Math.min(paragraphs.length, 5); i++) {
        const paragraph = paragraphs[i].trim()
        if (paragraph.length > 10) {
          flashcards.push({
            front: `What does the note say about: "${paragraph.substring(0, 30)}..."?`,
            back: paragraph,
          })
        }
      }

      // Add a general question about the note
      flashcards.push({
        front: `Summarize the key points of "${noteTitle}"`,
        back: "This note covers: " + paragraphs.map((p) => p.substring(0, Math.min(p.length, 50))).join("; "),
      })
    }

    // Limit to a reasonable number of flashcards
    const finalFlashcards = flashcards.slice(0, 15)

    return NextResponse.json({
      deckName: `${noteTitle} Flashcards`,
      flashcards: finalFlashcards,
    })
  } catch (error) {
    console.error("Error generating flashcards:", error)
    return NextResponse.json(
      {
        error: "Failed to generate flashcards",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
