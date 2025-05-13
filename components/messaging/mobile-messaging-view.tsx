"use client"

import { useMessaging } from "@/contexts/messaging-context"
import { ConversationList } from "./conversation-list"
import { ConversationView } from "./conversation-view"
import { useEffect, useState } from "react"

export function MobileMessagingView() {
  const { state } = useMessaging()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  if (!isMobile) {
    return null
  }

  return (
    <div className="md:hidden w-full h-full">
      {state.activeConversation ? <ConversationView /> : <ConversationList />}
    </div>
  )
}
