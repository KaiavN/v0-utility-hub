"use client"

import Script from "next/script"
import { createClient } from "@/utils/supabase/client"
import type { CredentialResponse } from "@/types/google-one-tap"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

const GoogleOneTap = () => {
  const supabase = createClient()
  const router = useRouter()

  // generate nonce to use for google id token sign-in
  const generateNonce = async (): Promise<string[]> => {
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    const encoder = new TextEncoder()
    const encodedNonce = encoder.encode(nonce)
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    return [nonce, hashedNonce]
  }

  useEffect(() => {
    const initializeGoogleOneTap = () => {
      console.log("Initializing Google One Tap")

      const handleLoad = async () => {
        try {
          const [nonce, hashedNonce] = await generateNonce()
          console.log("Nonce generated")

          // Store the current path to redirect back after login
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
            } catch (storageError) {
              console.warn("Error storing redirect path:", storageError)
            }
          }

          // check if there's already an existing session before initializing the one-tap UI
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
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              callback: async (response: CredentialResponse) => {
                try {
                  console.log("Google One Tap callback received")

                  // send id token returned in response.credential to supabase
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

                  // redirect to protected page
                  router.push(redirectPath)
                } catch (error) {
                  console.error("Error logging in with Google One Tap", error)
                }
              },
              nonce: hashedNonce,
              // with chrome's removal of third-party cookies, we need to use FedCM instead
              use_fedcm_for_prompt: true,
            })

            // Display the One Tap UI
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                console.log("One Tap UI was not displayed or was skipped", notification)
              }
            })
          } else {
            console.error("Google accounts API not available")
          }
        } catch (error) {
          console.error("Error initializing Google One Tap", error)
        }
      }

      // Check if document is already loaded
      if (document.readyState === "complete") {
        handleLoad()
      } else {
        window.addEventListener("load", handleLoad)
        return () => window.removeEventListener("load", handleLoad)
      }
    }

    initializeGoogleOneTap()
  }, [router])

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => console.log("Google One Tap script loaded")}
        onError={(e) => console.error("Error loading Google One Tap script", e)}
      />
      <div id="oneTap" className="fixed top-0 right-0 z-[100]" />
    </>
  )
}

export default GoogleOneTap
