import { getSupabaseClient } from "@/lib/supabase-client"

/**
 * Ensures that a GitHub user's profile is properly created and synchronized
 * with their GitHub data after authentication
 */
export async function ensureGitHubUserProfile(userId: string): Promise<boolean> {
  try {
    console.log("Ensuring GitHub user profile for:", userId)
    const supabase = getSupabaseClient()

    // Get the user data
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError) {
      console.error("Error fetching user data:", userError)
      return false
    }

    if (!userData.user) {
      console.error("No user found with ID:", userId)
      return false
    }

    const user = userData.user

    // Check if this is a GitHub user
    if (user.app_metadata?.provider !== "github") {
      console.log("User is not a GitHub user, skipping profile sync")
      return false
    }

    // Get GitHub metadata
    const githubData = user.user_metadata

    if (!githubData) {
      console.warn("No GitHub metadata found for user:", userId)
      return false
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error checking for existing profile:", profileError)
    }

    // Prepare profile data from GitHub
    const profileData = {
      id: userId,
      email: user.email || "",
      display_name:
        githubData.full_name ||
        githubData.name ||
        githubData.preferred_username ||
        user.email?.split("@")[0] ||
        "GitHub User",
      avatar_url: githubData.avatar_url || null,
      updated_at: new Date().toISOString(),
      created_at: existingProfile?.created_at || new Date().toISOString(),
      role: existingProfile?.role || "user",
      github_username: githubData.preferred_username || githubData.user_name || null,
    }

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url,
          updated_at: profileData.updated_at,
          github_username: profileData.github_username,
        })
        .eq("id", userId)

      if (updateError) {
        console.error("Error updating GitHub profile:", updateError)
        return false
      }

      console.log("Updated GitHub profile for user:", userId)
    } else {
      // Create new profile
      const { error: insertError } = await supabase.from("profiles").insert([profileData])

      if (insertError) {
        console.error("Error creating GitHub profile:", insertError)
        return false
      }

      console.log("Created GitHub profile for user:", userId)
    }

    return true
  } catch (error) {
    console.error("Error in ensureGitHubUserProfile:", error)
    return false
  }
}

/**
 * Synchronizes a user's profile with their latest GitHub data
 */
export async function syncGitHubProfile(userId: string): Promise<boolean> {
  return ensureGitHubUserProfile(userId)
}
