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

  // Auth routes get no sidebar/header - just raw content
  if (isAuthRoute) {
    return <>{children}</>
  }

  // All other routes get the full layout with proper container structure
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen overflow-x-hidden">
        <SiteHeader />
        {/* Main content container - no padding here, let PageContainer handle it */}
        <main className="flex-1 flex flex-col min-h-0 bg-neutral-50 w-full overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
