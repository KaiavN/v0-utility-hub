/**
 * Client-side configuration
 * This file contains configuration that is available on the client side
 */

export const clientConfig = {
  // App URL - used for OAuth redirects and other absolute URLs
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : process.env.SITE_URL || "",

  // Feature flags
  features: {
    enableGoogleAuth: true,
    enableGitHubAuth: true,
    enableEmailAuth: true,
  },

  // Default settings
  defaults: {
    theme: "system" as "light" | "dark" | "system",
    language: "en",
  },

  // API endpoints
  api: {
    baseUrl: "/api",
  },
}
