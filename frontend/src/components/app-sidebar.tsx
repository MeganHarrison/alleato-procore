"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Navigation data
const getNavData = (projectId?: string) => {
  const projectUrl = (path: string) => projectId ? `/${projectId}/${path}` : `/${path}`

  return [
    {
      title: "Core Tools",
      items: [
        { title: "Home", url: projectId ? projectUrl("home") : "/" },
        { title: "360 Reporting", url: projectUrl("reporting") },
        { title: "Documents", url: projectUrl("documents") },
        { title: "Directory", url: projectUrl("directory") },
        { title: "Tables Directory", url: "/tables-directory" },
        { title: "Tasks", url: projectUrl("tasks") },
      ],
    },
    {
      title: "Project Management",
      items: [
        { title: "Emails", url: projectUrl("emails") },
        { title: "RFIs", url: projectUrl("rfis") },
        { title: "Submittals", url: projectUrl("submittals") },
        { title: "Transmittals", url: projectUrl("transmittals") },
        { title: "Punch List", url: projectUrl("punch-list") },
        { title: "Meetings", url: projectUrl("meetings") },
        { title: "Schedule", url: projectUrl("schedule") },
        { title: "Daily Log", url: projectUrl("daily-log") },
        { title: "Photos", url: projectUrl("photos") },
        { title: "Drawings", url: projectUrl("drawings") },
        { title: "Specifications", url: projectUrl("specifications") },
      ],
    },
    {
      title: "Financial Management",
      items: [
        { title: "Prime Contracts", url: projectUrl("prime-contracts") },
        { title: "Budget", url: projectUrl("budget") },
        { title: "Commitments", url: projectUrl("commitments") },
        { title: "Change Orders", url: projectUrl("change-orders") },
        { title: "Change Events", url: projectUrl("change-events") },
        { title: "Direct Costs", url: projectUrl("direct-costs") },
        { title: "Invoicing", url: projectUrl("invoices") },
      ],
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const params = useParams()
  const projectId = params?.projectId as string | undefined
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const navData = getNavData(projectId)

  return (
    <Sidebar collapsible="offcanvas" className="bg-white dark:bg-slate-950 border-r" {...props}>
      <SidebarHeader className="p-3">
        <Link href="/" className="flex items-center">
          {isCollapsed ? (
            <Image
              src="/Alleato Favicon.png"
              alt="Alleato"
              width={28}
              height={28}
              className="object-contain"
            />
          ) : (
            <>
              <Image
                src="/Alleato-Group-Logo_Dark.png"
                alt="Alleato Group"
                width={140}
                height={40}
                className="object-contain dark:hidden"
              />
              <Image
                src="/Alleato-Group-Logo_Light.png"
                alt="Alleato Group"
                width={140}
                height={40}
                className="object-contain hidden dark:block"
              />
            </>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {navData.map((group) => (
          <Collapsible
            key={group.title}
            title={group.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-xs font-semibold"
              >
                <CollapsibleTrigger>
                  {group.title}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.url || pathname?.startsWith(item.url + "/")}
                          className="text-xs h-7"
                        >
                          <Link href={item.url}>
                            {item.title}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
