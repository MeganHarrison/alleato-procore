"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { AnimatedBackground } from "@/components/motion/animated-background"

interface Tab {
  label: string
  href: string
  count?: number
  isActive?: boolean
}

interface PageTabsProps {
  tabs: Tab[]
  className?: string
}

export function PageTabs({ tabs, className }: PageTabsProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Find the active tab based on pathname
  const activeTab = tabs.find(tab => tab.isActive ?? pathname === tab.href)?.href || tabs[0]?.href

  return (
    <div className={cn("border-b bg-white", className)}>
      <div className="px-4 sm:px-6 lg:px-12">
        <nav className="flex py-3" aria-label="Tabs">
          <div className="rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">
            <AnimatedBackground
              defaultValue={activeTab}
              className="rounded-md bg-white shadow-sm dark:bg-zinc-700"
              transition={{
                ease: 'easeInOut',
                duration: 0.2,
              }}
              onValueChange={(value) => {
                if (value) {
                  router.push(value)
                }
              }}
            >
              {tabs.map((tab) => {
                const isActive = tab.isActive ?? pathname === tab.href
                return (
                  <button
                    key={tab.href}
                    data-id={tab.href}
                    type="button"
                    onClick={() => router.push(tab.href)}
                    aria-label={tab.label}
                    className={cn(
                      'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                      'text-gray-700 dark:text-gray-200',
                      'hover:text-gray-900 dark:hover:text-white'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        isActive
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </AnimatedBackground>
          </div>
        </nav>
      </div>
    </div>
  )
}