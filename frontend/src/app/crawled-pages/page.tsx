'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, ArrowUpDown, Search, X, FileText, Database, CheckCircle, Wrench } from 'lucide-react';
import type { Database as DbTypes } from '@/types/database.types';

type CrawledPage = DbTypes['public']['Tables']['crawled_pages']['Row'];

// Category definitions based on Procore URL structure
type Category =
  | 'project-tools'
  | 'company-tools'
  | 'portfolio-tools'
  | 'tutorials'
  | 'videos'
  | 'faq'
  | 'references'
  | 'api-docs'
  | 'other';

type SortColumn = 'page' | 'category' | 'tool' | 'chunks' | 'embeddings' | 'date';
type SortDirection = 'asc' | 'desc';

interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
}

const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  'project-tools': {
    label: 'Project Tools',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  'company-tools': {
    label: 'Company Tools',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
  },
  'portfolio-tools': {
    label: 'Portfolio Tools',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
  },
  tutorials: {
    label: 'Tutorials',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  videos: {
    label: 'Videos',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
  },
  faq: {
    label: 'FAQ',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  references: {
    label: 'References',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
  },
  'api-docs': {
    label: 'API Docs',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
  },
  other: {
    label: 'Other',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
  },
};

const PROCORE_TOOLS = [
  'budget', 'change-orders', 'commitments', 'contracts', 'daily-log',
  'direct-costs', 'directory', 'documents', 'drawings', 'emails',
  'forms', 'inspections', 'invoicing', 'meetings', 'observations',
  'photos', 'prime-contracts', 'punch-list', 'reports', 'rfis',
  'schedule', 'specifications', 'submittals', 'time-and-materials',
  'timecard', 'transmittals', 'home', 'admin', 'portfolio',
];

interface URLGroup {
  url: string;
  chunks: CrawledPage[];
  totalChunks: number;
  createdAt: string;
  sourceId: string;
  category: Category;
  toolName: string | null;
  embeddingPercentage: number;
}

function categorizeUrl(url: string): { category: Category; toolName: string | null } {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('/project-level/')) {
    const match = lowerUrl.match(/\/project-level\/([^/]+)/);
    return { category: 'project-tools', toolName: match?.[1] || null };
  }
  if (lowerUrl.includes('/company-level/')) {
    const match = lowerUrl.match(/\/company-level\/([^/]+)/);
    return { category: 'company-tools', toolName: match?.[1] || null };
  }
  if (lowerUrl.includes('/portfolio-level/') || lowerUrl.includes('/portfolio/')) {
    const match = lowerUrl.match(/\/portfolio(?:-level)?\/([^/]+)/);
    return { category: 'portfolio-tools', toolName: match?.[1] || null };
  }
  if (lowerUrl.includes('/tutorials/') || lowerUrl.includes('/tutorial')) {
    return { category: 'tutorials', toolName: null };
  }
  if (lowerUrl.includes('/video') || lowerUrl.includes('/videos/')) {
    return { category: 'videos', toolName: null };
  }
  if (lowerUrl.includes('/faq') || lowerUrl.includes('/frequently-asked')) {
    return { category: 'faq', toolName: null };
  }
  if (lowerUrl.includes('/references/') || lowerUrl.includes('/reference')) {
    return { category: 'references', toolName: null };
  }
  if (lowerUrl.includes('/api/') || lowerUrl.includes('/developers/') || lowerUrl.includes('developers.procore')) {
    return { category: 'api-docs', toolName: null };
  }
  for (const tool of PROCORE_TOOLS) {
    if (lowerUrl.includes(`/${tool}/`) || lowerUrl.includes(`/${tool}`)) {
      return { category: 'other', toolName: tool };
    }
  }
  return { category: 'other', toolName: null };
}

function extractPageTitle(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) return urlObj.hostname;
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return url;
  }
}

function formatToolName(toolName: string | null): string {
  if (!toolName) return '';
  return toolName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function CrawledPagesPage() {
  const [urlGroups, setUrlGroups] = useState<URLGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCrawledPages = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from('crawled_pages')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const grouped = new Map<string, URLGroup>();

        data?.forEach((page) => {
          if (!grouped.has(page.url)) {
            const { category, toolName } = categorizeUrl(page.url);
            grouped.set(page.url, {
              url: page.url,
              chunks: [],
              totalChunks: 0,
              createdAt: page.created_at,
              sourceId: page.source_id,
              category,
              toolName,
              embeddingPercentage: 0,
            });
          }

          const group = grouped.get(page.url)!;
          group.chunks.push(page);
          group.totalChunks = group.chunks.length;

          if (page.created_at < group.createdAt) {
            group.createdAt = page.created_at;
          }
        });

        grouped.forEach((group) => {
          const chunksWithEmbeddings = group.chunks.filter(c => c.embedding !== null).length;
          group.embeddingPercentage = group.totalChunks > 0
            ? Math.round((chunksWithEmbeddings / group.totalChunks) * 100)
            : 0;
        });

        setUrlGroups(Array.from(grouped.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch crawled pages');
        console.error('Error fetching crawled pages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCrawledPages();
  }, []);

  const availableTools = useMemo(() => {
    const tools = new Set<string>();
    urlGroups.forEach(g => {
      if (g.toolName) tools.add(g.toolName);
    });
    return Array.from(tools).sort();
  }, [urlGroups]);

  const availableCategories = useMemo(() => {
    const counts = new Map<Category, number>();
    urlGroups.forEach(g => {
      counts.set(g.category, (counts.get(g.category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [urlGroups]);

  const overallStats = useMemo(() => {
    const totalPages = urlGroups.length;
    const totalChunks = urlGroups.reduce((sum, g) => sum + g.totalChunks, 0);
    const pagesWithEmbeddings = urlGroups.filter(g => g.embeddingPercentage === 100).length;
    const totalEmbeddings = urlGroups.reduce((sum, g) => {
      return sum + g.chunks.filter(c => c.embedding !== null).length;
    }, 0);
    const uniqueTools = new Set(urlGroups.map(g => g.toolName).filter(Boolean));

    return {
      totalPages,
      totalChunks,
      pagesWithEmbeddings,
      embeddingCoverage: totalChunks > 0 ? Math.round((totalEmbeddings / totalChunks) * 100) : 0,
      uniqueToolsCount: uniqueTools.size,
    };
  }, [urlGroups]);

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'date' ? 'desc' : 'asc');
    }
  }, [sortColumn]);

  const filteredAndSorted = useMemo(() => {
    return urlGroups
      .filter((group) => {
        const matchesSearch = group.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (group.toolName && group.toolName.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || group.category === selectedCategory;
        const matchesTool = selectedTool === 'all' || group.toolName === selectedTool;
        return matchesSearch && matchesCategory && matchesTool;
      })
      .sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        switch (sortColumn) {
          case 'page':
            return direction * extractPageTitle(a.url).localeCompare(extractPageTitle(b.url));
          case 'category':
            return direction * CATEGORY_CONFIG[a.category].label.localeCompare(CATEGORY_CONFIG[b.category].label);
          case 'tool':
            return direction * (a.toolName || 'zzz').localeCompare(b.toolName || 'zzz');
          case 'chunks':
            return direction * (a.totalChunks - b.totalChunks);
          case 'embeddings':
            return direction * (a.embeddingPercentage - b.embeddingPercentage);
          case 'date':
            return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          default:
            return 0;
        }
      });
  }, [urlGroups, searchQuery, selectedCategory, selectedTool, sortColumn, sortDirection]);

  const toggleRow = useCallback((url: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  }, []);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedTool('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedTool !== 'all' || searchQuery;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading crawled pages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 lg:px-12 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-sans font-light tracking-tight text-neutral-900 mb-3">
            Knowledge Base
          </h1>
          <p className="text-sm text-neutral-500">
            View and manage crawled Procore support documentation with embeddings for RAG
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
              <FileText className="h-4 w-4" />
              Total Pages
            </div>
            <div className="text-2xl font-bold text-gray-900">{overallStats.totalPages}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
              <Database className="h-4 w-4" />
              Total Chunks
            </div>
            <div className="text-2xl font-bold text-gray-900">{overallStats.totalChunks.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm font-medium text-gray-500 mb-1">Embedding Coverage</div>
            <div className="text-2xl font-bold text-gray-900">{overallStats.embeddingCoverage}%</div>
            <Progress value={overallStats.embeddingCoverage} className="mt-2 h-1.5" />
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
              <CheckCircle className="h-4 w-4" />
              Complete Pages
            </div>
            <div className="text-2xl font-bold text-gray-900">{overallStats.pagesWithEmbeddings}</div>
            <div className="text-xs text-muted-foreground">100% embedded</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
              <Wrench className="h-4 w-4" />
              Tools Covered
            </div>
            <div className="text-2xl font-bold text-gray-900">{overallStats.uniqueToolsCount}</div>
            <div className="text-xs text-muted-foreground">of {PROCORE_TOOLS.length} known</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search URLs or tool names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full lg:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map(([category, count]) => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_CONFIG[category].label} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full lg:w-48">
              <Select value={selectedTool} onValueChange={setSelectedTool}>
                <SelectTrigger>
                  <SelectValue placeholder="Tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tools</SelectItem>
                  {availableTools.map((tool) => (
                    <SelectItem key={tool} value={tool}>
                      {formatToolName(tool)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="lg:self-center">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredAndSorted.length} of {urlGroups.length} pages
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('page')}
                  >
                    <div className="flex items-center gap-1">
                      Page
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      Category
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('tool')}
                  >
                    <div className="flex items-center gap-1">
                      Tool
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 w-24"
                    onClick={() => handleSort('chunks')}
                  >
                    <div className="flex items-center gap-1">
                      Chunks
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 w-32"
                    onClick={() => handleSort('embeddings')}
                  >
                    <div className="flex items-center gap-1">
                      Embeddings
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Crawled
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {hasActiveFilters ? 'No pages match your filters' : 'No crawled pages found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSorted.map((group) => (
                    <Collapsible key={group.url} open={expandedRows.has(group.url)} onOpenChange={() => toggleRow(group.url)}>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              {expandedRows.has(group.url) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{extractPageTitle(group.url)}</span>
                            <a
                              href={group.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline truncate max-w-md"
                            >
                              {group.url}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`${CATEGORY_CONFIG[group.category].bgColor} ${CATEGORY_CONFIG[group.category].color} border-0`}
                          >
                            {CATEGORY_CONFIG[group.category].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {group.toolName ? (
                            <span className="text-sm">{formatToolName(group.toolName)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{group.totalChunks}</Badge>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                <div className="w-16">
                                  <Progress
                                    value={group.embeddingPercentage}
                                    className={`h-2 ${group.embeddingPercentage === 100 ? '[&>div]:bg-green-500' : group.embeddingPercentage > 0 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                                  />
                                </div>
                                <span className={`text-xs font-medium ${
                                  group.embeddingPercentage === 100 ? 'text-green-600' :
                                  group.embeddingPercentage > 0 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {group.embeddingPercentage}%
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {group.embeddingPercentage === 100
                                ? 'All chunks have embeddings'
                                : group.embeddingPercentage > 0
                                  ? 'Some chunks missing embeddings'
                                  : 'No embeddings generated'}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(group.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} className="p-0 border-0">
                          <CollapsibleContent>
                            <div className="px-12 py-4 bg-muted/30 border-t">
                              <div className="space-y-3">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">Source ID:</span>
                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                    {group.sourceId}
                                  </code>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Content Preview (First Chunk)</h4>
                                  <div className="bg-white p-3 rounded border text-sm text-muted-foreground max-h-40 overflow-y-auto">
                                    {group.chunks[0]?.content.slice(0, 500)}
                                    {(group.chunks[0]?.content.length || 0) > 500 && '...'}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {group.totalChunks} chunk{group.totalChunks !== 1 ? 's' : ''}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${group.embeddingPercentage === 100 ? 'border-green-300 text-green-700' : 'border-amber-300 text-amber-700'}`}
                                  >
                                    {group.chunks.filter(c => c.embedding !== null).length} with embeddings
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </TableCell>
                      </TableRow>
                    </Collapsible>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
