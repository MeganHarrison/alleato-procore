"use client"

import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith("/auth")

  // Auth routes get no sidebar/header
  if (isAuthRoute) {
    return <>{children}</>
  }

  // All other routes get the full layout
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="bg-neutral-50 flex-1 w-full px-4 sm:px-6 md:px-8 pt-6 md:pt-8 pb-20">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
