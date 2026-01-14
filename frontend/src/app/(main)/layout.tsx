"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import Footer from "@/components/layout/Footer";

/**
 * Main layout with sidebar for all primary app routes.
 * Routes in (main)/ get the full app experience with sidebar, header, and footer.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
