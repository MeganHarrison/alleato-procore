"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
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
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("border-b bg-white", className)}>
      <Container>
        <Stack gap="md">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1">
                {breadcrumbs.map((item) => (
                  <li key={item.href || item.label} className="flex items-center gap-1">
                    {breadcrumbs.indexOf(item) > 0 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <Text size="sm" weight="medium" as="span">
                        {item.label}
                      </Text>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Title and Actions */}
          <Inline justify="between" align="start" wrap className="gap-4">
            <Stack gap="sm" className="min-w-0 flex-1">
              <Heading level={1} className="break-words">
                {title}
              </Heading>
              {description && (
                <Text size="base" tone="muted" className="break-words">
                  {description}
                </Text>
              )}
            </Stack>
            {actions && (
              <Inline gap="sm" wrap className="flex-shrink-0">
                {actions}
              </Inline>
            )}
          </Inline>
        </Stack>
      </Container>
    </div>
  )
}
