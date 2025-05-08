import { cookies } from "next/headers"

// Check if the user is authenticated based on cookies
export function isAuthenticated() {
  const cookieStore = cookies()
  const userCookie = cookieStore.get("utility-hub-user")

  return !!userCookie?.value
}

// Get the current user from cookies
export function getCurrentUser() {
  const cookieStore = cookies()
  const userCookie = cookieStore.get("utility-hub-user")

  if (!userCookie?.value) {
    return null
  }

  try {
    return JSON.parse(userCookie.value)
  } catch (error) {
    console.error("Failed to parse user cookie:", error)
    return null
  }
}
