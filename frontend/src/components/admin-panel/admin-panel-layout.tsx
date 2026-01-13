"use client";

import { Sidebar } from "@/components/admin-panel/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

interface AdminPanelLayoutProps {
  children: React.ReactNode;
  projectId?: string;
}

export default function AdminPanelLayout({
  children,
  projectId
}: AdminPanelLayoutProps) {
  const sidebar = useStore(useSidebar, (x) => x);

  // During SSR/hydration, render with default collapsed state
  const isOpen = sidebar?.getOpenState() ?? false;
  const isDisabled = sidebar?.settings?.disabled ?? false;

  return (
    <>
      <Sidebar projectId={projectId} />
      <main
        className={cn(
          "min-h-screen bg-background transition-[margin-left] ease-in-out duration-300",
          !isDisabled && (!isOpen ? "lg:ml-[72px]" : "lg:ml-64")
        )}
      >
        {children}
      </main>
    </>
  );
}
