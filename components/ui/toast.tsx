"use client"

import { Button } from "@/components/ui/button"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

export interface ToastActionElement extends React.ReactElement {
  onClick?: () => void
}

export interface ToastProps {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: "default" | "destructive"
  duration?: number
}

interface ToasterToast extends ToastProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const toastVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export const Toaster: React.FC = ({ children }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null

        return React.cloneElement(child, {
          className: cn("relative flex items-center gap-2 rounded-md border p-4 text-sm", child.props.className),
        })
      })}
    </div>
  )
}

export const Toast: React.FC<ToasterToast> = ({
  id,
  open,
  onOpenChange,
  title,
  description,
  action,
  variant = "default",
  duration = 5000,
}) => {
  const [show, setShow] = React.useState(open)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (open) {
      setShow(true)
      timerRef.current = setTimeout(() => {
        onOpenChange(false)
      }, duration)
    } else {
      clearTimeout(timerRef.current)
      setShow(false)
    }
  }, [open, duration])

  const toastClassName = cn(
    "relative flex items-center gap-2 rounded-md border p-4 text-sm",
    variant === "destructive"
      ? "bg-destructive text-destructive-foreground border-destructive"
      : "bg-primary text-primary-foreground border-primary",
  )

  if (!show) return null

  return (
    <motion.div
      className={toastClassName}
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="flex items-center gap-2">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className="text-muted-foreground">{description}</div>}
      </div>
      {action && (
        <Button variant="ghost" size="icon" onClick={action.props.onClick} className="ml-auto">
          {action}
        </Button>
      )}
    </motion.div>
  )
}
