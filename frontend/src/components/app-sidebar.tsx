"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getBestAvatarUrl } from "@/lib/gravatar"
import type { User } from "@supabase/supabase-js"
import { toast } from "sonner"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import {
  coreTools,
  projectManagementTools,
  financialManagementTools,
  adminTools,
  buildToolUrl,
  isActivePath,
  extractProjectId,
} from "@/lib/navigation-config"

import { NavUser } from "@/components/nav-user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const supabase = createClient()

  // Extract project ID from URL path
  const projectId = React.useMemo(() => extractProjectId(pathname), [pathname])

  // Fetch current user on mount and listen for auth changes
  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Generate user data for NavUser component
  const userData = React.useMemo(() => {
    if (!user) return null

    const customAvatar = user.user_metadata?.avatar_url
    const userEmail = user.email || ""
    const avatarSrc = getBestAvatarUrl(customAvatar, userEmail)
    const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"

    return {
      name: displayName,
      email: userEmail,
      avatar: avatarSrc || "",
    }
  }, [user])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-1 hover:opacity-80 transition-opacity">
          <Image
            src="/favicon-light.png"
            alt="Alleato"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="font-semibold text-sidebar-foreground">Alleato</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* Core Tools */}
        {(() => {
          const visibleCoreTools = coreTools.filter((tool) => !tool.requiresProject || projectId)
          return visibleCoreTools.length > 0 ? (
            <SidebarGroup>
              <SidebarGroupLabel className="text-primary font-semibold">Core Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleCoreTools.map((tool) => {
                    const href = buildToolUrl(tool.path, projectId, tool.requiresProject)
                    const isActive = isActivePath(pathname, tool.path)

                    return (
                      <SidebarMenuItem key={tool.name}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={href}>
                            {tool.name}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null
        })()}

        {/* Project Management */}
        {(() => {
          const visibleProjectTools = projectManagementTools.filter((tool) => !tool.requiresProject || projectId)
          return visibleProjectTools.length > 0 ? (
            <SidebarGroup>
              <SidebarGroupLabel className="text-primary font-semibold">Project Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleProjectTools.map((tool) => {
                    const href = buildToolUrl(tool.path, projectId, tool.requiresProject)
                    const isActive = isActivePath(pathname, tool.path)

                    return (
                      <SidebarMenuItem key={tool.name}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={href}>
                            {tool.name}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null
        })()}

        {/* Financial Management */}
        {(() => {
          const visibleFinancialTools = financialManagementTools.filter((tool) => !tool.requiresProject || projectId)
          return visibleFinancialTools.length > 0 ? (
            <SidebarGroup>
              <SidebarGroupLabel className="text-primary font-semibold">Financial Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleFinancialTools.map((tool) => {
                    const href = buildToolUrl(tool.path, projectId, tool.requiresProject)
                    const isActive = isActivePath(pathname, tool.path)

                    return (
                      <SidebarMenuItem key={tool.name}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={href}>
                            {tool.name}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null
        })()}

        {/* Admin Tools */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">Admin Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminTools.map((tool) => {
                const href = tool.path
                const isActive = pathname === tool.path

                return (
                  <SidebarMenuItem key={tool.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={href}>
                        {tool.name}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {userData && (
        <SidebarFooter>
          <NavUser user={userData} />
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  )
}