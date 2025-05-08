"use client"

import * as React from "react"
import { X } from "lucide-react"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        className,
      )}
      {...props}
    />
  ),
)
ToastViewport.displayName = "ToastViewport"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const toastVariantsMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  duration?: number
  onOpenChange?: (open: boolean) => void
}

export interface ToastActionElement extends React.ReactElement {
  onClick?: () => void
}

interface ToasterToast extends ToastProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps & { id?: string; open?: boolean }>(
  ({ className, variant, title, description, action, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        variants={toastVariantsMotion}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
        {...props}
      >
        <div className="grid gap-1">
          {title && <ToastTitle>{title}</ToastTitle>}
          {description && <ToastDescription>{description}</ToastDescription>}
        </div>
        {action}
        <ToastClose />
      </motion.div>
    )
  },
)
Toast.displayName = "Toast"

const ToastTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("text-sm font-semibold", className)} {...props} />,
)
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("text-sm opacity-90", className)} {...props} />,
)
ToastDescription.displayName = "ToastDescription"

const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
        className,
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  ),
)
ToastClose.displayName = "ToastClose"

const Toaster = ({ children }: { children: React.ReactNode }) => {
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

export { Toaster, Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose }
