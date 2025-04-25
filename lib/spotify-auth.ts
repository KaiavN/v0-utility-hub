import { cookies } from "next/headers"

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value

  return accessToken || null
}
