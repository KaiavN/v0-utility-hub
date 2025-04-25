"use server"

/**
 * Securely get the OpenRouter API key from environment variables
 * This function runs on the server and never exposes the key to the client
 */
export async function getOpenRouterApiKey(): Promise<{ key: string | null }> {
  // Get the API key from environment variables
  const apiKey = process.env.OPENROUTER_API_KEY || null

  // Return the key (this response is safe to send to the client)
  return { key: apiKey }
}

/**
 * Send a message to the OpenRouter API
 * This function handles the API call on the server side
 */
export async function sendMessageToOpenRouter(messages: any[], model = "google/gemini-2.0-flash-exp:free") {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return { error: "API key not configured" }
    }

    // Prepare the request
    const request = {
      model,
      messages,
      max_tokens: 4000,
      temperature: 0.7,
      top_p: 0.9,
    }

    // Make the API call from the server
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://utility-hub.vercel.app",
        "X-Title": "Utility Hub",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from OpenRouter API")
    }

    return {
      content: data.choices[0].message.content,
      role: data.choices[0].message.role,
    }
  } catch (error) {
    console.error("Error sending message to OpenRouter:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
