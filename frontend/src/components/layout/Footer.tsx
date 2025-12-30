"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface FooterProps {
  className?: string
}

/**
 * Footer component for application layout
 *
 * Best practices implemented (2025):
 * - Mobile-first responsive design
 * - 8px grid system spacing (16px mobile → 24px desktop)
 * - Responsive typography (12px mobile → 14px desktop)
 * - Touch-friendly tap targets with adequate spacing
 * - Centered content on mobile, horizontal layout on desktop
 * - Minimal, unobtrusive design following modern UX patterns
 */
export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={cn(
        "w-full border-t border-gray-200 bg-white",
        "mt-auto", // Push to bottom of flex container
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Copyright */}
          <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            © {currentYear} Alleato AI. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Terms of Service
            </Link>
            <Link
              href="/support"
              className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
