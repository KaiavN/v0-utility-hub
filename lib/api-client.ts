/**
 * API client for making requests to our backend
 * Centralizes fetch logic and error handling
 */

type ApiOptions = {
  method?: string
  body?: any
  headers?: Record<string, string>
}

export async function apiRequest<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  console.log(`apiRequest: ${options.method || "GET"} ${endpoint} starting`)

  const { method = "GET", body, headers = {} } = options

  const requestOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include", // Important for cookies
  }

  if (body) {
    requestOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`/api${endpoint}`, requestOptions)
    console.log(`apiRequest: ${method} ${endpoint} response status: ${response.status}`)

    const contentType = response.headers.get("content-type")

    // Handle empty responses
    if (!contentType || !contentType.includes("application/json")) {
      if (!response.ok) {
        console.error(`apiRequest: ${method} ${endpoint} failed with status ${response.status}`)
        throw new Error(`Request failed with status ${response.status}`)
      }
      return {} as T
    }

    const data = await response.json()

    if (!response.ok) {
      console.error(`apiRequest: ${method} ${endpoint} failed with status ${response.status}`, data)
      throw new Error(data.error || "Something went wrong")
    }

    console.log(`apiRequest: ${method} ${endpoint} completed successfully`)
    return data as T
  } catch (error) {
    console.error(`apiRequest: ${method} ${endpoint} threw an error:`, error)
    throw error
  }
}

// Auth-specific API methods
export const authApi = {
  login: (email: string, password: string) => apiRequest("/auth/login", { method: "POST", body: { email, password } }),

  signup: (email: string, displayName: string, password: string) =>
    apiRequest("/auth/signup", { method: "POST", body: { email, displayName, password } }),

  logout: () => apiRequest("/auth/logout", { method: "POST" }),

  getSession: () => apiRequest("/auth/session"),

  getProfile: () => apiRequest("/auth/profile"),

  resetPassword: (email: string) => apiRequest("/auth/reset-password", { method: "POST", body: { email } }),

  updateProfile: (data: any) => apiRequest("/auth/profile", { method: "PUT", body: data }),
}

// Other API namespaces can be added here
