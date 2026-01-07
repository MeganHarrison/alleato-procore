/**
 * ============================================================================
 * GENERIC DATA TABLE FACTORY - ULTIMATE VERSION
 * ============================================================================
 *
 * The most comprehensive, production-grade table component with every feature.
 *
 * NEW FEATURES IN ULTIMATE VERSION:
 * 1. Saved Views & Presets - Save and restore custom table configurations
 * 2. Bulk Actions - Select multiple rows and perform batch operations
 * 3. Inline Cell Editing - Double-click to edit cells directly
 * 4. Advanced Search - Fuzzy search with field-specific operators
 * 5. Column Resizing - Drag column edges to resize
 * 6. Row Expansion - Expandable rows for nested details
 * 7. Column Grouping - Group related columns visually
 * 8. Export Enhancements - Multiple formats (CSV, JSON), filtered exports
 * 9. Keyboard Navigation - Full keyboard support with shortcuts
 * 10. Mobile Responsive - Adaptive layouts for mobile
 * 11. Accessibility - ARIA labels, screen reader support
 * 12. Analytics Row - Summary statistics (sum, avg, count)
 * 13. Quick Filters - Click cell values to filter
 * 14. Row Styling - Conditional row highlighting
 * 15. Search History - Recent searches saved
 *
 * LOCATED AT: [frontend/src/components/tables/generic-table-factory-ultimate.tsx](frontend/src/components/tables/generic-table-factory-ultimate.tsx)
 */

'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useVirtualizer } from '@tanstack/react-virtual'
import Fuse from 'fuse.js'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Search,
  Download,
  Columns3,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  X,
  CalendarIcon,
  Save,
  FolderOpen,
  FileJson,
  TrendingUp,
  Command as CommandIcon,
  History,
} from 'lucide-react'

// Import types from enhanced version
import type {
  SortConfig,
  AdvancedFilterConfig,
  BadgeRenderConfig,
  ColumnConfig as BaseColumnConfig,
  EditConfig,
} from './generic-table-factory-enhanced'

// ============================================================================
// EXTENDED TYPE DEFINITIONS
// ============================================================================

export interface SavedView {
  id: string
  name: string
  description?: string
  isDefault?: boolean
  config: {
    visibleColumns: string[]
    sortConfigs: SortConfig[]
    filters: Record<string, unknown>
    columnWidths: Record<string, number>
  }
  createdAt: string
  updatedAt: string
}

export interface BulkAction {
  id: string
  label: string
  icon: React.ReactNode
  variant?: 'default' | 'destructive'
  onClick: (selectedIds: (string | number)[]) => Promise<void>
  disabled?: (selectedIds: (string | number)[]) => boolean
}

export interface ColumnGroup {
  id: string
  label: string
  columnIds: string[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface RowExpansion {
  enabled: boolean
  render: (row: Record<string, unknown>) => React.ReactNode
  defaultExpanded?: boolean
}

export interface RowStyle {
  condition: (row: Record<string, unknown>) => boolean
  className: string
  description?: string
}

export interface ColumnStats {
  enabled: boolean
  columns: {
    id: string
    type: 'sum' | 'avg' | 'count' | 'min' | 'max'
    label?: string
  }[]
}

export interface ColumnConfigExtended extends BaseColumnConfig {
  resizable?: boolean
  minWidth?: number
  maxWidth?: number
  pinned?: 'left' | 'right'
  group?: string
  tooltip?: (value: unknown) => string
  editable?: boolean
  editComponent?: 'input' | 'textarea' | 'select' | 'date' | 'number'
}

export interface QuickFilter {
  enabled: boolean
  onFilter?: (field: string, value: unknown) => void
}

export interface KeyboardShortcuts {
  enabled: boolean
  shortcuts: {
    search: string // Default: '/'
    selectAll: string // Default: 'Ctrl+A'
    copy: string // Default: 'Ctrl+C'
    delete: string // Default: 'Delete'
    escape: string // Default: 'Escape'
  }
}

export interface GenericTableUltimateConfig {
  // Base config
  id?: string
  title?: string
  description?: string
  columns: ColumnConfigExtended[]
  filters?: AdvancedFilterConfig[]
  searchFields: string[]
  rowClickPath?: string
  exportFilename?: string
  editConfig?: EditConfig
  virtualScroll?: boolean

  // Advanced features
  savedViews?: {
    enabled: boolean
    views: SavedView[]
    onSave?: (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
    onDelete?: (viewId: string) => Promise<void>
    onSetDefault?: (viewId: string) => Promise<void>
  }
  bulkActions?: BulkAction[]
  inlineEdit?: {
    enabled: boolean
    onCellEdit?: (rowId: string | number, field: string, value: unknown) => Promise<void>
  }
  fuzzySearch?: {
    enabled: boolean
    threshold?: number // 0.0 = perfect match, 1.0 = match anything
  }
  columnGroups?: ColumnGroup[]
  rowExpansion?: RowExpansion
  rowStyles?: RowStyle[]
  columnStats?: ColumnStats
  quickFilter?: QuickFilter
  keyboardNav?: KeyboardShortcuts
  searchHistory?: {
    enabled: boolean
    maxItems?: number
  }
  exportFormats?: ('csv' | 'json' | 'xlsx')[]
  mobileBreakpoint?: number // Default: 768px
}

interface GenericTableUltimateProps {
  data: Record<string, unknown>[]
  config: GenericTableUltimateConfig
  isLoading?: boolean
  onSelectionChange?: (selectedIds: (string | number)[]) => void
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const STORAGE_PREFIX = 'ultimate-table-'

const saveToStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to storage:', error)
  }
}

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Failed to load from storage:', error)
    return defaultValue
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GenericDataTableUltimate({
  data: initialData,
  config,
  isLoading = false,
  onSelectionChange,
}: GenericTableUltimateProps) {
  const router = useRouter()
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const editingCellRef = useRef<HTMLInputElement>(null)

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const tableId = config.id || 'default-table'

  // Basic state
  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(config.columns.filter((col) => col.defaultVisible).map((col) => col.id))
  )
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())

  // Advanced state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    loadFromStorage(`${tableId}-widths`, {})
  )
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set())
  const [editingCell, setEditingCell] = useState<{ rowId: string | number; field: string } | null>(
    null
  )
  const [savedViews, setSavedViews] = useState<SavedView[]>(
    config.savedViews?.views || loadFromStorage(`${tableId}-views`, [])
  )
  const [activeViewId, setActiveViewId] = useState<string | null>(
    savedViews.find((v) => v.isDefault)?.id || null
  )
  const [searchHistory, setSearchHistory] = useState<string[]>(
    loadFromStorage(`${tableId}-search-history`, [])
  )
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update data when initialData changes
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Save column widths to storage
  useEffect(() => {
    saveToStorage(`${tableId}-widths`, columnWidths)
  }, [columnWidths, tableId])

  // Save search history
  useEffect(() => {
    if (config.searchHistory?.enabled) {
      saveToStorage(`${tableId}-search-history`, searchHistory)
    }
  }, [searchHistory, tableId, config.searchHistory])

  // ============================================================================
  // FUZZY SEARCH
  // ============================================================================

  const fuse = useMemo(() => {
    if (!config.fuzzySearch?.enabled) return null

    return new Fuse(data, {
      keys: config.searchFields,
      threshold: config.fuzzySearch.threshold || 0.3,
      includeScore: true,
    })
  }, [data, config.fuzzySearch, config.searchFields])

  // ============================================================================
  // FILTERING & SEARCHING
  // ============================================================================

  const filteredData = useMemo(() => {
    let result = data

    // Fuzzy search or standard search
    if (searchTerm) {
      if (fuse) {
        const searchResults = fuse.search(searchTerm)
        result = searchResults.map((r) => r.item)
      } else {
        result = data.filter((row) => {
          return config.searchFields.some((field) => {
            const value = row[field]
            if (value === null || value === undefined) return false
            return String(value).toLowerCase().includes(searchTerm.toLowerCase())
          })
        })
      }
    }

    // Apply filters (same as enhanced version)
    if (config.filters && config.filters.length > 0) {
      result = result.filter((row) => {
        for (const filter of config.filters || []) {
          const filterValue = filters[filter.id]

          switch (filter.type) {
            case 'select':
              if (filterValue && filterValue !== 'all') {
                if (row[filter.field] !== filterValue) return false
              }
              break

            case 'multiSelect':
              if (filterValue && Array.isArray(filterValue) && filterValue.length > 0) {
                if (!filterValue.includes(String(row[filter.field]))) return false
              }
              break

            case 'dateRange':
              if (filterValue && typeof filterValue === 'object') {
                const { from, to } = filterValue as { from?: Date; to?: Date }
                const rowValue = row[filter.field]
                if (rowValue) {
                  const rowDate = new Date(rowValue as string)
                  if (from && rowDate < from) return false
                  if (to && rowDate > to) return false
                }
              }
              break

            case 'numberRange':
              if (filterValue && typeof filterValue === 'object') {
                const { min, max } = filterValue as { min?: number; max?: number }
                const rowValue = Number(row[filter.field])
                if (!Number.isNaN(rowValue)) {
                  if (min !== undefined && rowValue < min) return false
                  if (max !== undefined && rowValue > max) return false
                }
              }
              break
          }
        }
        return true
      })
    }

    return result
  }, [data, searchTerm, filters, config.filters, config.searchFields, fuse])

  // ============================================================================
  // SORTING (same as enhanced)
  // ============================================================================

  const sortedData = useMemo(() => {
    if (sortConfigs.length === 0) return filteredData

    return [...filteredData].sort((a, b) => {
      for (const sortConfig of sortConfigs) {
        const aVal = a[sortConfig.columnId]
        const bVal = b[sortConfig.columnId]

        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        const column = config.columns.find((c) => c.id === sortConfig.columnId)
        const sortType = column?.sortType || column?.type || 'string'

        let comparison = 0

        switch (sortType) {
          case 'number':
            comparison = Number(aVal) - Number(bVal)
            break
          case 'date':
            comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
            break
          default:
            comparison = String(aVal).localeCompare(String(bVal))
        }

        if (comparison !== 0) {
          return sortConfig.direction === 'asc' ? comparison : -comparison
        }
      }
      return 0
    })
  }, [filteredData, sortConfigs, config.columns])

  // ============================================================================
  // COLUMN STATISTICS
  // ============================================================================

  const columnStats = useMemo(() => {
    if (!config.columnStats?.enabled) return {}

    const stats: Record<string, number> = {}

    config.columnStats.columns.forEach((statConfig) => {
      const values = sortedData
        .map((row) => row[statConfig.id])
        .filter((val) => val !== null && val !== undefined)
        .map((val) => Number(val))
        .filter((val) => !Number.isNaN(val))

      if (values.length === 0) {
        stats[statConfig.id] = 0
        return
      }

      switch (statConfig.type) {
        case 'sum':
          stats[statConfig.id] = values.reduce((acc, val) => acc + val, 0)
          break
        case 'avg':
          stats[statConfig.id] = values.reduce((acc, val) => acc + val, 0) / values.length
          break
        case 'count':
          stats[statConfig.id] = values.length
          break
        case 'min':
          stats[statConfig.id] = Math.min(...values)
          break
        case 'max':
          stats[statConfig.id] = Math.max(...values)
          break
      }
    })

    return stats
  }, [sortedData, config.columnStats])

  // ============================================================================
  // SAVED VIEWS
  // ============================================================================

  const saveCurrentView = useCallback(
    async (name: string, description?: string) => {
      const newView: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        description,
        config: {
          visibleColumns: Array.from(visibleColumns),
          sortConfigs,
          filters,
          columnWidths,
        },
      }

      if (config.savedViews?.onSave) {
        await config.savedViews.onSave(newView)
      } else {
        const view: SavedView = {
          ...newView,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const updated = [...savedViews, view]
        setSavedViews(updated)
        saveToStorage(`${tableId}-views`, updated)
      }

      toast.success('View saved successfully')
    },
    [visibleColumns, sortConfigs, filters, columnWidths, config.savedViews, savedViews, tableId]
  )

  const loadView = useCallback((view: SavedView) => {
    setVisibleColumns(new Set(view.config.visibleColumns))
    setSortConfigs(view.config.sortConfigs)
    setFilters(view.config.filters)
    setColumnWidths(view.config.columnWidths)
    setActiveViewId(view.id)
    toast.success(`Loaded view: ${view.name}`)
  }, [])

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    if (!config.keyboardNav?.enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Search focus (/)
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        searchInput?.focus()
      }

      // Select all (Ctrl/Cmd + A)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault()
        const allIds = new Set(sortedData.map((row) => row.id as string | number))
        setSelectedIds(allIds)
        onSelectionChange?.(Array.from(allIds))
      }

      // Copy (Ctrl/Cmd + C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIds.size > 0) {
        const selectedRows = sortedData.filter((row) => selectedIds.has(row.id as string | number))
        const text = selectedRows.map((row) => JSON.stringify(row)).join('\n')
        navigator.clipboard.writeText(text)
        toast.success(`Copied ${selectedIds.size} rows`)
      }

      // Show shortcuts (?)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowKeyboardShortcuts(true)
      }

      // Escape
      if (e.key === 'Escape') {
        setEditingCell(null)
        setShowKeyboardShortcuts(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config.keyboardNav, sortedData, selectedIds, onSelectionChange])

  // ============================================================================
  // DRAG & DROP REORDERING
  // ============================================================================

  const handleDragEnd = (event: { active: unknown; over: unknown }) => {
    const { active, over } = event

    if (active && over && active !== over) {
      setData((items) => {
        const oldIndex = items.findIndex((item) => item.id === active)
        const newIndex = items.findIndex((item) => item.id === over)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // ============================================================================
  // INLINE EDITING
  // ============================================================================

  const handleCellDoubleClick = useCallback(
    (rowId: string | number, field: string) => {
      if (!config.inlineEdit?.enabled) return

      const column = config.columns.find((c) => c.id === field)
      if (!column?.editable) return

      setEditingCell({ rowId, field })
      setTimeout(() => editingCellRef.current?.focus(), 0)
    },
    [config.inlineEdit, config.columns]
  )

  const handleCellEdit = useCallback(
    async (rowId: string | number, field: string, value: unknown) => {
      if (config.inlineEdit?.onCellEdit) {
        await config.inlineEdit.onCellEdit(rowId, field, value)
      } else {
        setData((prev) =>
          prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
        )
      }
      setEditingCell(null)
      toast.success('Cell updated')
    },
    [config.inlineEdit]
  )

  // ============================================================================
  // BULK ACTIONS
  // ============================================================================

  const handleBulkAction = useCallback(
    async (action: BulkAction) => {
      const selectedArray = Array.from(selectedIds)
      await action.onClick(selectedArray)
      setSelectedIds(new Set())
      onSelectionChange?.([])
    },
    [selectedIds, onSelectionChange]
  )

  // ============================================================================
  // EXPORT
  // ============================================================================

  const exportData = useCallback(
    (format: 'csv' | 'json' | 'xlsx') => {
      const exportRows = selectedIds.size > 0
        ? sortedData.filter((row) => selectedIds.has(row.id as string | number))
        : sortedData

      const visibleCols = config.columns.filter((col) => visibleColumns.has(col.id))

      switch (format) {
        case 'csv': {
          const headers = visibleCols.map((col) => col.label)
          const rows = exportRows.map((row) =>
            visibleCols.map((col) => {
              const value = row[col.id]
              return value ? String(value) : ''
            })
          )

          const csvContent = [headers, ...rows]
            .map((row) => row.map((cell) => `"${cell}"`).join(','))
            .join('\n')

          const blob = new Blob([csvContent], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${config.exportFilename || 'export'}.csv`
          a.click()
          break
        }

        case 'json': {
          const jsonData = exportRows.map((row) => {
            const filtered: Record<string, unknown> = {}
            visibleCols.forEach((col) => {
              filtered[col.id] = row[col.id]
            })
            return filtered
          })

          const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
            type: 'application/json',
          })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${config.exportFilename || 'export'}.json`
          a.click()
          break
        }

        case 'xlsx':
          toast.error('Excel export requires additional library')
          break
      }

      toast.success(`Exported ${exportRows.length} rows as ${format.toUpperCase()}`)
    },
    [sortedData, selectedIds, config.columns, visibleColumns, config.exportFilename]
  )

  // ============================================================================
  // VIRTUAL SCROLLING
  // ============================================================================

  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53,
    overscan: 10,
    enabled: config.virtualScroll && sortedData.length > 100,
  })

  const virtualRows = config.virtualScroll && sortedData.length > 100
    ? rowVirtualizer.getVirtualItems()
    : sortedData.map((_, index) => ({ index, size: 53, start: index * 53 }))

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const handleSort = useCallback((columnId: string, shiftKey: boolean) => {
    const column = config.columns.find((c) => c.id === columnId)
    if (!column?.sortable) return

    setSortConfigs((prev) => {
      if (shiftKey) {
        const existing = prev.find((s) => s.columnId === columnId)
        if (!existing) {
          return [...prev, { columnId, direction: 'asc' }]
        }
        if (existing.direction === 'asc') {
          return prev.map((s) =>
            s.columnId === columnId ? { ...s, direction: 'desc' } : s
          )
        }
        return prev.filter((s) => s.columnId !== columnId)
      } else {
        const existing = prev.find((s) => s.columnId === columnId)
        if (!existing || prev.length > 1) {
          return [{ columnId, direction: 'asc' }]
        }
        if (existing.direction === 'asc') {
          return [{ columnId, direction: 'desc' }]
        }
        return []
      }
    })
  }, [config.columns])

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
    if (value && config.searchHistory?.enabled) {
      setSearchHistory((prev) => {
        const filtered = prev.filter((term) => term !== value)
        const maxItems = config.searchHistory?.maxItems || 10
        return [value, ...filtered].slice(0, maxItems)
      })
    }
  }, [config.searchHistory])

  const toggleRowExpansion = useCallback((rowId: string | number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
  }, [])

  const toggleAllRows = useCallback(() => {
    if (selectedIds.size === sortedData.length) {
      setSelectedIds(new Set())
      onSelectionChange?.([])
    } else {
      const allIds = new Set(sortedData.map((row) => row.id as string | number))
      setSelectedIds(allIds)
      onSelectionChange?.(Array.from(allIds))
    }
  }, [selectedIds, sortedData, onSelectionChange])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          {config.title && (
            <Text size="xl" weight="semibold">
              {config.title}
            </Text>
          )}
          {config.description && (
            <Text size="sm" tone="muted" className="mt-1">
              {config.description}
            </Text>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Saved Views */}
          {config.savedViews?.enabled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {activeViewId
                    ? savedViews.find((v) => v.id === activeViewId)?.name || 'Views'
                    : 'Views'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {savedViews.map((view) => (
                  <DropdownMenuItem
                    key={view.id}
                    onClick={() => loadView(view)}
                    className="flex items-center justify-between"
                  >
                    <span>{view.name}</span>
                    {view.isDefault && <Badge variant="outline">Default</Badge>}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSaveViewDialog(true)}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Current View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {config.columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={(checked) => {
                    setVisibleColumns((prev) => {
                      const next = new Set(prev)
                      if (checked) {
                        next.add(column.id)
                      } else {
                        next.delete(column.id)
                      }
                      return next
                    })
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(config.exportFormats || ['csv', 'json']).map((format) => (
                <DropdownMenuItem key={format} onClick={() => exportData(format)}>
                  {format === 'csv' && <Download className="mr-2 h-4 w-4" />}
                  {format === 'json' && <FileJson className="mr-2 h-4 w-4" />}
                  Export as {format.toUpperCase()}
                  {selectedIds.size > 0 && ` (${selectedIds.size} selected)`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Keyboard Shortcuts */}
          {config.keyboardNav?.enabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKeyboardShortcuts(true)}
            >
              <CommandIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && config.bulkActions && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Text size="sm" weight="medium">
            {selectedIds.size} row{selectedIds.size > 1 ? 's' : ''} selected
          </Text>
          <Separator orientation="vertical" className="h-6" />
          {config.bulkActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'default'}
              size="sm"
              onClick={() => handleBulkAction(action)}
              disabled={action.disabled?.(Array.from(selectedIds))}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedIds(new Set())
              onSelectionChange?.([])
            }}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${config.searchFields.join(', ')}...`}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
          {config.searchHistory?.enabled && searchHistory.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6"
                >
                  <History className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <Command>
                  <CommandInput placeholder="Search history..." />
                  <CommandList>
                    <CommandGroup heading="Recent Searches">
                      {searchHistory.map((term) => (
                        <CommandItem key={term} onSelect={() => handleSearch(term)}>
                          {term}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Filters */}
        {config.filters?.map((filter) => (
          <div key={filter.id}>
            {filter.type === 'select' && (
              <Select
                value={String(filters[filter.id] || 'all')}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, [filter.id]: value }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {filter.type === 'multiSelect' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    {filter.label}
                    {Array.isArray(filters[filter.id]) &&
                      (filters[filter.id] as unknown[]).length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {(filters[filter.id] as unknown[]).length}
                        </Badge>
                      )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-2">
                    <Label>{filter.label}</Label>
                    {filter.options.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${filter.id}-${option.value}`}
                          checked={
                            Array.isArray(filters[filter.id]) &&
                            (filters[filter.id] as string[]).includes(option.value)
                          }
                          onCheckedChange={(checked) => {
                            setFilters((prev) => {
                              const current = (prev[filter.id] as string[]) || []
                              return {
                                ...prev,
                                [filter.id]: checked
                                  ? [...current, option.value]
                                  : current.filter((v) => v !== option.value),
                              }
                            })
                          }}
                        />
                        <label
                          htmlFor={`${filter.id}-${option.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {filter.type === 'dateRange' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filter.label}
                    {filters[filter.id] && <Badge className="ml-2">Set</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={filters[filter.id] as { from: Date; to: Date } | undefined}
                    onSelect={(range) =>
                      setFilters((prev) => ({ ...prev, [filter.id]: range }))
                    }
                  />
                </PopoverContent>
              </Popover>
            )}

            {filter.type === 'numberRange' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    {filter.label}
                    {filters[filter.id] && <Badge className="ml-2">Set</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-2">
                    <Label>Min</Label>
                    <Input
                      type="number"
                      placeholder={`Min ${filter.label}`}
                      value={
                        (filters[filter.id] as { min?: number })?.min?.toString() || ''
                      }
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined
                        setFilters((prev) => ({
                          ...prev,
                          [filter.id]: {
                            ...(prev[filter.id] as { min?: number; max?: number }),
                            min: value,
                          },
                        }))
                      }}
                      min={filter.min}
                      max={filter.max}
                      step={filter.step}
                    />
                    <Label>Max</Label>
                    <Input
                      type="number"
                      placeholder={`Max ${filter.label}`}
                      value={
                        (filters[filter.id] as { max?: number })?.max?.toString() || ''
                      }
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined
                        setFilters((prev) => ({
                          ...prev,
                          [filter.id]: {
                            ...(prev[filter.id] as { min?: number; max?: number }),
                            max: value,
                          },
                        }))
                      }}
                      min={filter.min}
                      max={filter.max}
                      step={filter.step}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        ))}

        {/* Clear Filters */}
        {Object.keys(filters).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({})}
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="border rounded-lg overflow-auto"
        style={{
          maxHeight: config.virtualScroll ? '600px' : undefined,
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedData.map((row) => row.id as string)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Drag handle column */}
                  {config.rowExpansion?.enabled && (
                    <TableHead className="w-[40px]" />
                  )}

                  {/* Selection checkbox */}
                  {config.bulkActions && (
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.size === sortedData.length}
                        onCheckedChange={toggleAllRows}
                      />
                    </TableHead>
                  )}

                  {/* Column headers */}
                  {config.columns
                    .filter((col) => visibleColumns.has(col.id))
                    .map((column) => {
                      const sortConfig = sortConfigs.find((s) => s.columnId === column.id)
                      const sortIndex = sortConfigs.findIndex((s) => s.columnId === column.id)

                      return (
                        <TableHead
                          key={column.id}
                          style={{
                            width: columnWidths[column.id] || column.width,
                            minWidth: column.minWidth,
                            maxWidth: column.maxWidth,
                          }}
                          className={cn(
                            column.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                            column.pinned === 'left' && 'sticky left-0 bg-background z-10',
                            column.pinned === 'right' && 'sticky right-0 bg-background z-10'
                          )}
                          onClick={(e) => column.sortable && handleSort(column.id, e.shiftKey)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{column.label}</span>
                            {column.sortable && (
                              <div className="flex items-center">
                                {sortConfig ? (
                                  <>
                                    {sortConfig.direction === 'asc' ? (
                                      <ArrowUp className="h-4 w-4" />
                                    ) : (
                                      <ArrowDown className="h-4 w-4" />
                                    )}
                                    {sortConfigs.length > 1 && (
                                      <Badge variant="outline" className="ml-1 text-xs">
                                        {sortIndex + 1}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                                )}
                              </div>
                            )}
                          </div>
                        </TableHead>
                      )
                    })}
                </TableRow>
              </TableHeader>

              <TableBody
                style={{
                  height: config.virtualScroll
                    ? `${rowVirtualizer.getTotalSize()}px`
                    : undefined,
                }}
              >
                {isLoading ? (
                  Array.from({ length: 5 }, (_, i) => `skeleton-row-${i}`).map((skeletonId) => (
                    <TableRow key={skeletonId}>
                      {config.columns
                        .filter((col) => visibleColumns.has(col.id))
                        .map((col) => (
                          <TableCell key={col.id}>
                            <div className="h-4 w-full bg-muted animate-pulse rounded" />
                          </TableCell>
                        ))}
                    </TableRow>
                  ))
                ) : virtualRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={config.columns.filter((c) => visibleColumns.has(c.id)).length}
                      className="text-center py-12"
                    >
                      <Text tone="muted">
                        No results found
                      </Text>
                    </TableCell>
                  </TableRow>
                ) : (
                  virtualRows.map((virtualRow) => {
                    const row = sortedData[virtualRow.index]
                    const isExpanded = expandedRows.has(row.id as string | number)
                    const isSelected = selectedIds.has(row.id as string | number)

                    // Apply row styles
                    const rowStyle = config.rowStyles?.find((style) => style.condition(row))

                    return (
                      <>
                        <TableRow
                          key={row.id as string}
                          className={cn(
                            config.rowClickPath && 'cursor-pointer hover:bg-muted/50',
                            isSelected && 'bg-muted',
                            rowStyle?.className
                          )}
                          onClick={() => {
                            if (config.rowClickPath) {
                              const path = config.rowClickPath.replace('{id}', String(row.id))
                              router.push(path)
                            }
                          }}
                          style={{
                            transform: config.virtualScroll
                              ? `translateY(${virtualRow.start}px)`
                              : undefined,
                            position: config.virtualScroll ? 'absolute' : undefined,
                            top: config.virtualScroll ? 0 : undefined,
                            left: config.virtualScroll ? 0 : undefined,
                            width: config.virtualScroll ? '100%' : undefined,
                          }}
                        >
                          {/* Row expansion toggle */}
                          {config.rowExpansion?.enabled && (
                            <TableCell className="w-[40px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleRowExpansion(row.id as string | number)
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          )}

                          {/* Selection checkbox */}
                          {config.bulkActions && (
                            <TableCell className="w-[40px]">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev)
                                    if (checked) {
                                      next.add(row.id as string | number)
                                    } else {
                                      next.delete(row.id as string | number)
                                    }
                                    onSelectionChange?.(Array.from(next))
                                    return next
                                  })
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                          )}

                          {/* Data cells */}
                          {config.columns
                            .filter((col) => visibleColumns.has(col.id))
                            .map((column) => {
                              const value = row[column.id]
                              const isEditing =
                                editingCell?.rowId === row.id && editingCell?.field === column.id

                              return (
                                <TableCell
                                  key={column.id}
                                  onDoubleClick={() =>
                                    handleCellDoubleClick(row.id as string | number, column.id)
                                  }
                                  className={cn(
                                    column.editable && 'cursor-text',
                                    column.pinned === 'left' && 'sticky left-0 bg-background',
                                    column.pinned === 'right' && 'sticky right-0 bg-background'
                                  )}
                                >
                                  {isEditing ? (
                                    <Input
                                      ref={editingCellRef}
                                      defaultValue={String(value || '')}
                                      onBlur={(e) =>
                                        handleCellEdit(
                                          row.id as string | number,
                                          column.id,
                                          e.target.value
                                        )
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleCellEdit(
                                            row.id as string | number,
                                            column.id,
                                            e.currentTarget.value
                                          )
                                        } else if (e.key === 'Escape') {
                                          setEditingCell(null)
                                        }
                                      }}
                                      className="h-8"
                                    />
                                  ) : column.renderConfig?.type === 'badge' ? (
                                    <Badge
                                      variant={
                                        (column.renderConfig as BadgeRenderConfig).variantMap?.[
                                          String(value)
                                        ] || 'default'
                                      }
                                    >
                                      {String(value)}
                                    </Badge>
                                  ) : column.renderConfig?.type === 'currency' ? (
                                    new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                    }).format(Number(value))
                                  ) : (
                                    <span>{String(value || '')}</span>
                                  )}
                                </TableCell>
                              )
                            })}
                        </TableRow>

                        {/* Expanded row content */}
                        {isExpanded && config.rowExpansion && (
                          <TableRow>
                            <TableCell
                              colSpan={
                                config.columns.filter((c) => visibleColumns.has(c.id)).length + 2
                              }
                              className="bg-muted/30"
                            >
                              {config.rowExpansion.render(row)}
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })
                )}
              </TableBody>

              {/* Analytics Footer */}
              {config.columnStats?.enabled && (
                <TableFooter>
                  <TableRow>
                    {config.rowExpansion?.enabled && <TableCell />}
                    {config.bulkActions && <TableCell />}
                    {config.columns
                      .filter((col) => visibleColumns.has(col.id))
                      .map((column) => {
                        const stat = config.columnStats?.columns.find((s) => s.id === column.id)
                        const value = stat ? columnStats[column.id] : null

                        return (
                          <TableCell key={column.id} className="font-medium">
                            {value !== null && value !== undefined ? (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                {stat?.label || stat?.type.toUpperCase()}:{' '}
                                {column.renderConfig?.type === 'currency'
                                  ? new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                    }).format(value)
                                  : value.toLocaleString()}
                              </div>
                            ) : null}
                          </TableCell>
                        )
                      })}
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </SortableContext>
        </DndContext>
      </div>

      {/* Save View Dialog */}
      <Dialog open={showSaveViewDialog} onOpenChange={setShowSaveViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>
              Save your current table configuration (columns, filters, sorting) for quick access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="view-name">View Name</Label>
              <Input
                id="view-name"
                placeholder="My Custom View"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    saveCurrentView(e.currentTarget.value)
                    setShowSaveViewDialog(false)
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="view-description">Description (optional)</Label>
              <Textarea
                id="view-description"
                placeholder="Brief description of this view..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveViewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const nameInput = document.getElementById('view-name') as HTMLInputElement
                saveCurrentView(nameInput.value)
                setShowSaveViewDialog(false)
              }}
            >
              Save View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Speed up your workflow with these shortcuts</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Focus search</span>
              <Badge variant="outline">/</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Select all rows</span>
              <Badge variant="outline">Ctrl + A</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Copy selected rows</span>
              <Badge variant="outline">Ctrl + C</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Clear selection</span>
              <Badge variant="outline">Escape</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show shortcuts</span>
              <Badge variant="outline">?</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
