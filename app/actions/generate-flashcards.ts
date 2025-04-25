"use server"

interface Flashcard {
  front: string
  back: string
}

interface FlashcardResult {
  success: boolean
  deckName?: string
  flashcards?: Flashcard[]
  error?: string
}

export async function generateFlashcards(noteTitle: string, noteContent: string): Promise<FlashcardResult> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY // Changed to server-side env var

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set.")
    }

    const prompt = `Generate flashcards from the following note. Each flashcard should have a question and an answer. Format the output as a JSON array of objects with "front" and "back" keys. Limit the number of flashcards to 15.
Note Title: ${noteTitle}
Note Content: ${noteContent}`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`, // Use server-side env var
        "Content-Type": "application/json",
        "HTTP-Referer": "https://utility-hub.vercel.app",
        "X-Title": "Utility Hub Assistant",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-thinking-exp:free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error("Error from OpenRouter API:", response.status, response.statusText)
      return { success: false, error: `OpenRouter API error: ${response.status} ${response.statusText}` }
    }

    const data = await response.json()
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response format from OpenRouter API:", data)
      return { success: false, error: "Invalid response format from AI model." }
    }

    let content = data.choices[0].message.content

    // Remove markdown code block delimiters
    content = content.replace(/```json\s*|```/g, "")

    try {
      // Attempt to parse the generated text as JSON
      const flashcards = JSON.parse(content) as Flashcard[]

      // Validate that the parsed data is an array of objects with "front" and "back" keys
      if (
        Array.isArray(flashcards) &&
        flashcards.every((item) => typeof item === "object" && item !== null && "front" in item && "back" in item)
      ) {
        return { success: true, deckName: noteTitle + " Flashcards", flashcards }
      } else {
        console.error("Parsed JSON does not match expected format:", flashcards)
        return { success: false, error: "Parsed JSON does not match expected flashcard format." }
      }
    } catch (jsonError: any) {
      console.error("Failed to parse generated JSON:", jsonError, "Content:", content)
      return { success: false, error: `Failed to parse generated flashcards: ${jsonError.message}` }
    }
  } catch (error: any) {
    console.error("Error generating flashcards:", error)
    return { success: false, error: "Failed to generate flashcards." }
  }
}
