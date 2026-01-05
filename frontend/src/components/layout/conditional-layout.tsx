"use client"

import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { AppSidebar } from "@/components/app-sidebar"
import Footer from "@/components/layout/Footer"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith("/auth")
  const isAIChatRoute = pathname === "/ai-chat"

  // Auth and AI Chat routes get no sidebar/header - just raw content
  if (isAuthRoute || isAIChatRoute) {
    return <>{children}</>
  }

  // All other routes get the full layout with proper container structure
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen overflow-x-hidden">
        <SiteHeader />
        {/* Main content container with bottom padding for breathing room */}
        <main className="flex-1 flex flex-col min-h-0 bg-neutral-50 w-full overflow-x-hidden pb-8 sm:pb-12 lg:pb-16">
          {children}
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}
