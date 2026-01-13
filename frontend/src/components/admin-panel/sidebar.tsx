"use client";
import { Menu } from "@/components/admin-panel/menu";
import { SidebarToggle } from "@/components/admin-panel/sidebar-toggle";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface SidebarProps {
  projectId?: string;
}

export function Sidebar({ projectId }: SidebarProps) {
  const sidebar = useStore(useSidebar, (x) => x);

  // Default values for SSR/hydration
  const isOpen = sidebar?.isOpen ?? false;
  const toggleOpen = sidebar?.toggleOpen ?? (() => {});
  const getOpenState = sidebar?.getOpenState ?? (() => false);
  const setIsHover = sidebar?.setIsHover ?? (() => {});
  const isDisabled = sidebar?.settings?.disabled ?? false;
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300 bg-background border-r",
        !getOpenState() ? "w-[72px]" : "w-64",
        isDisabled && "hidden"
      )}
    >
      <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative h-full flex flex-col px-2 pt-4 pb-2 overflow-y-auto"
      >
        <Link href="/" className={cn("flex items-center mb-2", getOpenState() ? "justify-start px-1" : "justify-center")}>
          {getOpenState() ? (
            <Image
              src="/Alleato-Group-Logo_Dark.png"
              alt="Alleato Group"
              width={140}
              height={40}
              className="object-contain shrink-0 dark:hidden"
            />
          ) : (
            <Image
              src="/Alleato Favicon.png"
              alt="Alleato"
              width={28}
              height={28}
              className="object-contain shrink-0"
            />
          )}
          {getOpenState() && (
            <Image
              src="/Alleato-Group-Logo_Light.png"
              alt="Alleato Group"
              width={140}
              height={40}
              className="object-contain shrink-0 hidden dark:block"
            />
          )}
        </Link>
        <Menu isOpen={getOpenState()} projectId={projectId} />
      </div>
    </aside>
  );
}
