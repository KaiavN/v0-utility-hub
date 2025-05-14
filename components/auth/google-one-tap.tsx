"use client"

import Script from "next/script"
import { createClient } from "@/utils/supabase/client"
import type { CredentialResponse } from "@/types/google-one-tap"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

const GoogleOneTap = () => {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)

  useEffect(() => {
    // Get the Google Client ID
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (clientId) {
      setGoogleClientId(clientId)
      console.log("Google Client ID is available")
    } else {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set")
    }

    // Initialize Supabase client after component mounts to avoid SSR issues
    const supabase = createClient()
    setIsInitialized(true)

    // Generate nonce for Google sign-in
    const generateNonce = async (): Promise<string[]> => {
      const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
      const encoder = new TextEncoder()
      const encodedNonce = encoder.encode(nonce)
      const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
      return [nonce, hashedNonce]
    }

    const initializeGoogleOneTap = async () => {
      if (!clientId) {
        console.error("Cannot initialize Google One Tap: Missing Client ID")
        return
      }

      try {
        console.log("Initializing Google One Tap")
        const [nonce, hashedNonce] = await generateNonce()

        // Store the current path to redirect back after login
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
          } catch (storageError) {
            console.warn("Error storing redirect path:", storageError)
          }
        }

        // Check if there's already an existing session before initializing the one-tap UI
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error("Error getting session", error)
        }

        if (data.session) {
          console.log("User already has a session")
          return
        }

        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: CredentialResponse) => {
              try {
                console.log("Google One Tap callback received")

                // Send id token returned in response.credential to supabase
                const { data, error } = await supabase.auth.signInWithIdToken({
                  provider: "google",
                  token: response.credential,
                  nonce,
                })

                if (error) {
                  console.error("Error logging in with Google One Tap", error)
                  toast({
                    title: "Login Failed",
                    description: error.message || "Failed to login with Google",
                    variant: "destructive",
                  })
                  throw error
                }

                console.log("Successfully logged in with Google One Tap")
                toast({
                  title: "Login Successful",
                  description: "You have been successfully logged in",
                })

                // Get the redirect path from session storage or default to home
                let redirectPath = "/"
                try {
                  if (typeof window !== "undefined" && window.sessionStorage) {
                    redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/"
                    sessionStorage.removeItem("redirectAfterLogin")
                  }
                } catch (storageError) {
                  console.warn("Error accessing sessionStorage:", storageError)
                }

                // Redirect to protected page
                router.push(redirectPath)
              } catch (error) {
                console.error("Error logging in with Google One Tap", error)
              }
            },
            nonce: hashedNonce,
            // With Chrome's removal of third-party cookies, we need to use FedCM instead
            use_fedcm_for_prompt: true,
          })

          // Display the One Tap UI
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.log(
                "One Tap UI was not displayed or was skipped",
                notification.getNotDisplayedReason() || notification.getSkippedReason(),
              )
            }
          })
        } else {
          console.error("Google accounts API not available")
        }
      } catch (error) {
        console.error("Error initializing Google One Tap", error)
      }
    }

    // Wait for both Supabase initialization and Google script loading
    if (isInitialized && window.google && window.google.accounts) {
      initializeGoogleOneTap()
    }
  }, [isInitialized, router])

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Google One Tap script loaded")
          // Force re-render to trigger the useEffect when Google is loaded
          setIsInitialized((prev) => !prev)
        }}
        onError={(e) => console.error("Error loading Google One Tap script", e)}
      />
      <div id="oneTap" className="fixed top-0 right-0 z-[100]" />

      {!googleClientId && (
        <div className="hidden">
          {/* This is just for debugging - won't be visible */}
          Missing Google Client ID: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set
        </div>
      )}
    </>
  )
}

export default GoogleOneTap
