"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FormContainerProps {
  children: React.ReactNode
  className?: string
  /**
   * Form max width based on UX best practices:
   * - 'narrow' (640px): Simple forms with few fields
   * - 'standard' (896px): Most forms - optimal line length for readability (default)
   * - 'wide' (1024px): Complex forms with multiple columns or tables
   */
  maxWidth?: "narrow" | "standard" | "wide"
}

const maxWidthClasses = {
  narrow: "max-w-2xl",    // 640px - Simple forms
  standard: "max-w-4xl",  // 896px - Standard forms (optimal)
  wide: "max-w-5xl",      // 1024px - Complex forms with tables
}

/**
 * FormContainer component for form pages
 *
 * Based on UX best practices (2025):
 * - Optimal form width: 600-900px for single-column forms
 * - Default max-width: 896px (max-w-4xl) - ideal for readability
 * - Centered layout with comfortable padding
 * - Mobile-responsive with 8px grid system padding (16px → 24px → 32px)
 * - Card-like appearance with white background, border, and subtle shadow
 * - Prevents horizontal overflow for mobile safety
 */
export function FormContainer({
  children,
  className,
  maxWidth = "standard",
}: FormContainerProps) {
  return (
    <div className={cn(
      "mx-auto w-full",
      maxWidthClasses[maxWidth],
      // White background with subtle shadow
      "bg-white rounded-lg shadow-sm",
      // Border
      "border border-gray-200",
      // Mobile-first responsive padding
      "px-4 sm:px-6 lg:px-8",
      // Vertical spacing
      "py-6 sm:py-8",
      // Prevent horizontal overflow
      "overflow-x-hidden",
      className
    )}>
      {children}
    </div>
  )
}
