"use client"

import * as React from "react"
import { ChevronRight, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProject } from "@/contexts/project-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Container } from "@/components/ui/container"
import { Stack } from "@/components/ui/stack"
import { Inline } from "@/components/ui/inline"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  // Content
  title: string
  titleContent?: React.ReactNode
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  
  // Layout options
  variant?: "default" | "executive" | "compact" | "budget"
  actions?: React.ReactNode
  className?: string
  
  // Project context
  showProjectName?: boolean
  preHeading?: {
    project?: string
    client?: string
  }
  
  // Status
  statusBadge?: React.ReactNode
  
  // Export functionality
  showExportButton?: boolean
  onExportCSV?: () => void
  onExportPDF?: () => void
  exportLabel?: string
}

/**
 * Unified PageHeader component that consolidates all page header variations
 * 
 * @example Default usage
 * ```tsx
 * <PageHeader title="Budget" description="Manage your project budget" />
 * ```
 * 
 * @example Executive variant with pre-heading
 * ```tsx
 * <PageHeader 
 *   variant="executive"
 *   preHeading={{ project: "Project Name", client: "Client Name" }}
 *   title="Financial Overview"
 * />
 * ```
 * 
 * @example With custom title content and status
 * ```tsx
 * <PageHeader 
 *   titleContent={
 *     <Inline>
 *       <Heading>Budget</Heading>
 *       <StatusBadge status="locked" />
 *     </Inline>
 *   }
 * />
 * ```
 */
export function PageHeader({
  title,
  titleContent,
  description,
  breadcrumbs,
  variant = "default",
  actions,
  className,
  showProjectName = false,
  preHeading,
  statusBadge,
  showExportButton = false,
  onExportCSV,
  onExportPDF,
  exportLabel = "Export",
}: PageHeaderProps) {
  const { selectedProject, isLoading } = useProject()
  
  // Show project name by default for non-executive variants when in project context
  const shouldShowProjectName = showProjectName || (variant !== "executive" && selectedProject)

  if (variant === "executive") {
    return (
      <div className={cn("bg-slate-50", className)}>
        <Container size="xl">
          <Stack gap="md" className="py-12">
            {preHeading && (preHeading.project || preHeading.client) && (
              <Text 
                size="sm" 
                tone="muted" 
                transform="uppercase" 
                className="tracking-wider"
              >
                {[preHeading.project, preHeading.client].filter(Boolean).join(" / ")}
              </Text>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-light tracking-tight">
              {title}
            </h1>
            {description && (
              <Text size="lg" tone="muted" className="max-w-3xl">
                {description}
              </Text>
            )}
            {actions && (
              <Inline gap="sm" className="pt-2">
                {actions}
              </Inline>
            )}
          </Stack>
        </Container>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className={cn("border-b", className)}>
        <div className="px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Inline gap="md" align="center">
              {titleContent || <Heading level={2}>{title}</Heading>}
              {statusBadge}
            </Inline>
            {actions && <Inline gap="sm">{actions}</Inline>}
          </div>
        </div>
      </div>
    )
  }

  // Default variant (includes budget variant behavior)
  return (
    <div className={cn(className)}>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex py-3" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((item, index) => (
                <li key={item.label} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                  )}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title and Actions */}
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            {/* Project Name */}
            {shouldShowProjectName && (
              <div className="mb-1">
                {isLoading ? (
                  <div className="h-5 w-48 bg-gray-200 animate-pulse rounded" />
                ) : selectedProject ? (
                  <div className="text-sm font-medium text-muted-foreground">
                    {selectedProject.number && (
                      <span>{selectedProject.number} · </span>
                    )}
                    <span>{selectedProject.name}</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Page Title */}
            {titleContent ? (
              titleContent
            ) : (
              <Inline gap="md" align="center">
                <h1 className="text-2xl sm:text-3xl lg:text-3xl font-semibold">
                  {title}
                </h1>
                {statusBadge}
              </Inline>
            )}

            {/* Description */}
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          {(actions || showExportButton) && (
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              {showExportButton && (onExportCSV || onExportPDF) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {exportLabel}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onExportCSV && (
                      <DropdownMenuItem onClick={onExportCSV}>
                        Export as CSV
                      </DropdownMenuItem>
                    )}
                    {onExportPDF && (
                      <DropdownMenuItem onClick={onExportPDF}>
                        Export as PDF
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// For backwards compatibility, export as ProjectPageHeader too
export { PageHeader as ProjectPageHeader }