"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import Footer from "@/components/layout/Footer";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthRoute = pathname?.startsWith("/auth");
  const isAIChatRoute = pathname === "/ai-chat";

  // Auth and AI Chat routes get no sidebar/header - they have their own layout
  if (isAuthRoute || isAIChatRoute) {
    return <>{children}</>;
  }

  // All other routes get the new sidebar layout
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <SiteHeader />
          <main className="flex-1 flex flex-col bg-background w-full pb-8 sm:pb-12 lg:pb-16">
            {children}
          </main>
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
