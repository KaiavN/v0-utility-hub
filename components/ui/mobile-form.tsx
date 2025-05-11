"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MobileFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string
  description?: string
  submitText?: string
  cancelText?: string
  onCancel?: () => void
  isSubmitting?: boolean
  children: React.ReactNode
}

export function MobileForm({
  className,
  title,
  description,
  submitText = "Save",
  cancelText = "Cancel",
  onCancel,
  isSubmitting = false,
  children,
  ...props
}: MobileFormProps) {
  return (
    <form className={cn("space-y-6 pb-6", className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      <div className="space-y-4">{children}</div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="mt-2 sm:mt-0">
            {cancelText}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="relative">
          {isSubmitting && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-primary rounded-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <svg
                className="animate-spin h-5 w-5 text-primary-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </motion.div>
          )}
          <span className={isSubmitting ? "opacity-0" : ""}>{submitText}</span>
        </Button>
      </div>
    </form>
  )
}
