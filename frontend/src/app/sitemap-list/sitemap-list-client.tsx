'use client'

/**
 * ============================================================================
 * AUTO-UPDATING SITEMAP LIST CLIENT
 * ============================================================================
 *
 * Client component for the sitemap list with search and interactivity
 */

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Search, ExternalLink, FileText, Folder, BarChart3 } from 'lucide-react'
import { Heading } from '@/components/ui/heading'
import type { RouteInfo } from '@/lib/auto-sitemap-utils'

interface SitemapListClientProps {
  categorized: Record<string, RouteInfo[]>
  stats: {
    total: number
    static: number
    dynamic: number
    categories: number
    byCategory: {
      name: string
      count: number
    }[]
  }
}

export default function SitemapListClient({
  categorized,
  stats,
}: SitemapListClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showStatsPanel, setShowStatsPanel] = useState(false)

  // Filter routes based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categorized

    const lowerQuery = searchQuery.toLowerCase()
    const filtered: Record<string, RouteInfo[]> = {}

    for (const [category, categoryRoutes] of Object.entries(categorized)) {
      const matchingRoutes = categoryRoutes.filter(
        r =>
          r.path.toLowerCase().includes(lowerQuery) ||
          r.title.toLowerCase().includes(lowerQuery) ||
          r.category.toLowerCase().includes(lowerQuery)
      )

      if (matchingRoutes.length > 0) {
        filtered[category] = matchingRoutes
      }
    }

    return filtered
  }, [categorized, searchQuery])

  const totalFilteredRoutes = Object.values(filteredCategories).reduce(
    (sum, routes) => sum + routes.length,
    0
  )

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search routes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatsPanel(!showStatsPanel)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showStatsPanel ? 'Hide' : 'Show'} Stats
          </Button>

          <Button asChild variant="outline" size="sm">
            <Link href="/sitemap.xml" target="_blank">
              <FileText className="h-4 w-4 mr-2" />
              XML Sitemap
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStatsPanel && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Routes</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.static}</div>
            <div className="text-sm text-muted-foreground">Static Routes</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.dynamic}</div>
            <div className="text-sm text-muted-foreground">Dynamic Routes</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {totalFilteredRoutes} of {stats.total} routes
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Routes by Category - Accordion Style */}
      <Accordion type="multiple" className="space-y-1">
        {Object.entries(filteredCategories).map(([category, categoryRoutes]) => (
          <AccordionItem
            key={category}
            value={category}
            className="border-0 px-0"
          >
            <AccordionTrigger className="hover:no-underline py-2">
              <div className="flex items-center gap-2 flex-1">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <Heading level={2} className="text-sm font-semibold">
                  {category}
                </Heading>
                <Badge variant="secondary" className="text-xs">
                  {categoryRoutes.length}
                </Badge>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <div className="space-y-1 pl-6">
                {categoryRoutes.map(route => {
                  // Dynamic routes can't be linked directly (they need actual IDs)
                  if (route.isDynamic) {
                    return (
                      <div
                        key={route.path}
                        className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground"
                      >
                        <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-mono">{route.path}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          Dynamic
                        </Badge>
                      </div>
                    )
                  }

                  // Static routes are clickable
                  return (
                    <Link
                      key={route.path}
                      href={route.path}
                      className="flex items-center gap-2 py-1.5 text-sm hover:text-primary transition-colors group"
                    >
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="font-mono flex-1">{route.path}</span>
                    </Link>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* No results */}
      {totalFilteredRoutes === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No routes found matching &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  )
}
