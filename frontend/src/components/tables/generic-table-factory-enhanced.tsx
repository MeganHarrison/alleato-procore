/**
 * ============================================================================
 * GENERIC DATA TABLE FACTORY - ENHANCED VERSION
 * ============================================================================
 *
 * ENHANCEMENTS OVER BASE VERSION:
 * 1. Virtual scrolling for large datasets (1000+ rows)
 * 2. Multi-column sorting with shift-click
 * 3. Advanced filtering (date ranges, number ranges, multi-select)
 * 4. Persistent state in localStorage
 * 5. Better loading and empty states
 *
 * PERFORMANCE:
 * - Handles 10,000+ rows smoothly with virtual scrolling
 * - Memoized sorting and filtering
 * - Optimized re-renders
 *
 * LOCATED AT: [frontend/src/components/tables/generic-table-factory-enhanced.tsx](frontend/src/components/tables/generic-table-factory-enhanced.tsx)
 */

'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import {
  Search,
  Download,
  Columns3,
  ChevronDown,
  Pencil,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  X,
  CalendarIcon,
} from 'lucide-react'

// ============================================================================
// TYPE DEFINITIONS - Sorting
// ============================================================================

export interface SortConfig {
  columnId: string
  direction: 'asc' | 'desc'
}

// ============================================================================
// TYPE DEFINITIONS - Advanced Filters
// ============================================================================

export interface DateRangeFilter {
  type: 'dateRange'
  id: string
  label: string
  field: string
}

export interface NumberRangeFilter {
  type: 'numberRange'
  id: string
  label: string
  field: string
  min?: number
  max?: number
  step?: number
}

export interface MultiSelectFilter {
  type: 'multiSelect'
  id: string
  label: string
  field: string
  options: { value: string; label: string }[]
}

export interface SingleSelectFilter {
  type: 'select'
  id: string
  label: string
  field: string
  options: { value: string; label: string }[]
}

export type AdvancedFilterConfig =
  | DateRangeFilter
  | NumberRangeFilter
  | MultiSelectFilter
  | SingleSelectFilter

// ============================================================================
// TYPE DEFINITIONS - Render Configuration (from base version)
// ============================================================================

export interface BadgeRenderConfig {
  type: 'badge'
  variantMap?: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'>
  defaultVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export interface CurrencyRenderConfig {
  type: 'currency'
  prefix?: string
  showDecimals?: boolean
}

export interface TruncateRenderConfig {
  type: 'truncate'
  maxLength: number
}

export interface ArrayRenderConfig {
  type: 'array'
  itemType?: 'badge' | 'text'
  separator?: string
}

export interface JsonRenderConfig {
  type: 'json'
  maxLength: number
}

export interface NestedRenderConfig {
  type: 'nested'
  path: string
  fallback?: string
}

export type RenderConfig =
  | BadgeRenderConfig
  | CurrencyRenderConfig
  | TruncateRenderConfig
  | ArrayRenderConfig
  | JsonRenderConfig
  | NestedRenderConfig

// ============================================================================
// TYPE DEFINITIONS - Table Configuration
// ============================================================================

export interface ColumnConfig {
  id: string
  label: string
  defaultVisible: boolean
  type?: 'text' | 'date' | 'badge' | 'number' | 'email'
  renderConfig?: RenderConfig
  sortable?: boolean
  sortType?: 'string' | 'number' | 'date'
  width?: number
}

export interface EditConfig {
  tableName: string
  editableFields?: string[]
  requiresDialog?: boolean
}

export interface GenericTableConfig {
  id?: string // For localStorage persistence
  title?: string
  description?: string
  columns: ColumnConfig[]
  filters?: AdvancedFilterConfig[]
  searchFields: string[]
  rowClickPath?: string
  exportFilename?: string
  editConfig?: EditConfig
  virtualScroll?: boolean // Enable virtual scrolling for large datasets
  pageSize?: number // Items per page (if not using virtual scroll)
}

interface GenericDataTableProps {
  data: Record<string, unknown>[]
  config: GenericTableConfig
  isLoading?: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const STORAGE_KEY_PREFIX = 'enhanced-table-state-'

const saveTableState = (
  tableId: string,
  state: {
    visibleColumns: string[]
    sortConfigs: SortConfig[]
    filters: Record<string, unknown>
  }
) => {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${tableId}`, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save table state:', error)
  }
}

const loadTableState = (tableId: string) => {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tableId}`)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Failed to load table state:', error)
    return null
  }
}

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// ============================================================================
// SKELETON LOADER
// ============================================================================

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, idx) => (
        <TableRow key={idx}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <TableCell key={colIdx}>
              <div className="h-4 bg-muted animate-pulse rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GenericDataTableEnhanced({
  data: initialData,
  config,
  isLoading = false,
}: GenericDataTableProps) {
  const router = useRouter()
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const tableId = config.id || slugify(config.title || 'table')
  const savedState = useMemo(() => loadTableState(tableId), [tableId])

  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, unknown>>(savedState?.filters || {})
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(
      savedState?.visibleColumns ||
        config.columns.filter((col) => col.defaultVisible).map((col) => col.id)
    )
  )
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>(savedState?.sortConfigs || [])
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update data when initialData changes
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Save state to localStorage
  useEffect(() => {
    saveTableState(tableId, {
      visibleColumns: Array.from(visibleColumns),
      sortConfigs,
      filters,
    })
  }, [tableId, visibleColumns, sortConfigs, filters])

  // ============================================================================
  // FILTERING LOGIC
  // ============================================================================

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Search filter
      if (searchTerm) {
        const matchesSearch = config.searchFields.some((field) => {
          const value = row[field]
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
        if (!matchesSearch) return false
      }

      // Advanced filters
      if (config.filters) {
        for (const filter of config.filters) {
          const filterValue = filters[filter.id]

          switch (filter.type) {
            case 'select': {
              if (filterValue && filterValue !== 'all') {
                const rowValue = row[filter.field]
                if (rowValue !== filterValue) return false
              }
              break
            }

            case 'multiSelect': {
              if (filterValue && Array.isArray(filterValue) && filterValue.length > 0) {
                const rowValue = row[filter.field]
                if (!filterValue.includes(String(rowValue))) return false
              }
              break
            }

            case 'dateRange': {
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
            }

            case 'numberRange': {
              if (filterValue && typeof filterValue === 'object') {
                const { min, max } = filterValue as { min?: number; max?: number }
                const rowValue = Number(row[filter.field])
                if (!isNaN(rowValue)) {
                  if (min !== undefined && rowValue < min) return false
                  if (max !== undefined && rowValue > max) return false
                }
              }
              break
            }
          }
        }
      }

      return true
    })
  }, [data, searchTerm, filters, config.searchFields, config.filters])

  // ============================================================================
  // SORTING LOGIC
  // ============================================================================

  const sortedData = useMemo(() => {
    if (sortConfigs.length === 0) return filteredData

    return [...filteredData].sort((a, b) => {
      for (const sortConfig of sortConfigs) {
        const aVal = a[sortConfig.columnId]
        const bVal = b[sortConfig.columnId]

        // Handle null/undefined
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        // Get column config to determine sort type
        const column = config.columns.find((c) => c.id === sortConfig.columnId)
        const sortType = column?.sortType || column?.type || 'string'

        let comparison = 0

        switch (sortType) {
          case 'number':
            comparison = Number(aVal) - Number(bVal)
            break
          case 'date':
            comparison =
              new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
            break
          default: // string
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
  // VIRTUAL SCROLLING
  // ============================================================================

  const rowVirtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53, // Approximate row height in pixels
    overscan: 10, // Render 10 extra rows above and below viewport
    enabled: config.virtualScroll && sortedData.length > 100,
  })

  const virtualRows = config.virtualScroll ? rowVirtualizer.getVirtualItems() : null
  const totalHeight = config.virtualScroll ? rowVirtualizer.getTotalSize() : undefined

  // ============================================================================
  // RENDERING HELPERS
  // ============================================================================

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    try {
      return format(new Date(date), 'MMM dd, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  const renderWithConfig = (value: unknown, renderConfig: RenderConfig) => {
    switch (renderConfig.type) {
      case 'badge': {
        const strValue = String(value || '')
        const variant =
          renderConfig.variantMap?.[strValue] || renderConfig.defaultVariant || 'outline'
        return <Badge variant={variant}>{strValue || 'N/A'}</Badge>
      }
      case 'currency': {
        const numValue = Number(value)
        if (!value || Number.isNaN(numValue)) return 'N/A'
        const formatted =
          renderConfig.showDecimals !== false
            ? numValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : numValue.toLocaleString()
        return `${renderConfig.prefix || '$'}${formatted}`
      }
      case 'truncate': {
        const text = String(value || '')
        if (!text) return 'N/A'
        return text.length > renderConfig.maxLength
          ? `${text.substring(0, renderConfig.maxLength)}...`
          : text
      }
      case 'array': {
        if (!value || !Array.isArray(value)) return 'N/A'
        if (renderConfig.itemType === 'badge') {
          return (
            <div className="flex gap-1 flex-wrap">
              {value.map((item, idx) => (
                <Badge key={`${String(item)}-${idx}`} variant="outline" className="text-xs">
                  {String(item)}
                </Badge>
              ))}
            </div>
          )
        }
        return value.join(renderConfig.separator || ', ')
      }
      case 'json': {
        if (!value) return 'N/A'
        try {
          const text = JSON.stringify(value)
          return text.length > renderConfig.maxLength
            ? `${text.substring(0, renderConfig.maxLength)}...`
            : text
        } catch {
          return 'Invalid JSON'
        }
      }
      case 'nested': {
        const parts = renderConfig.path.split('.')
        let result: unknown = value

        for (const part of parts) {
          if (result && typeof result === 'object' && part in result) {
            result = (result as Record<string, unknown>)[part]
          } else {
            return renderConfig.fallback || 'N/A'
          }
        }

        return result ? String(result) : renderConfig.fallback || 'N/A'
      }
      default:
        return String(value || 'N/A')
    }
  }

  const renderCellContent = (column: ColumnConfig, row: Record<string, unknown>) => {
    const value = row[column.id]

    if (column.renderConfig) {
      return renderWithConfig(value, column.renderConfig)
    }

    switch (column.type) {
      case 'date':
        return formatDate(value as string)
      case 'badge':
        return <Badge variant="outline">{value ? String(value) : 'N/A'}</Badge>
      case 'email':
        return value ? (
          <a href={`mailto:${value}`} className="text-primary hover:underline">
            <Text as="span" size="sm">
              {String(value)}
            </Text>
          </a>
        ) : (
          <Text as="span" tone="muted" size="sm">
            N/A
          </Text>
        )
      case 'number':
        return value !== null && value !== undefined ? Number(value).toLocaleString() : 'N/A'
      default:
        return value ? String(value) : 'N/A'
    }
  }

  // ============================================================================
  // ACTION HANDLERS
  // ============================================================================

  const handleSort = (columnId: string, shiftKey: boolean) => {
    const column = config.columns.find((c) => c.id === columnId)
    if (!column?.sortable) return

    setSortConfigs((prev) => {
      if (shiftKey) {
        // Multi-column sort
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
        // Single column sort
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
  }

  const exportToCSV = () => {
    const headers = config.columns
      .filter((col) => visibleColumns.has(col.id))
      .map((col) => col.label)

    const rows = sortedData.map((row) =>
      config.columns
        .filter((col) => visibleColumns.has(col.id))
        .map((col) => {
          const value = row[col.id]
          if (col.type === 'date') {
            return formatDate(value as string)
          }
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
    a.download = config.exportFilename || 'export.csv'
    a.click()
  }

  const handleRowClick = (row: Record<string, unknown>) => {
    if (config.rowClickPath) {
      const path = config.rowClickPath.replace('{id}', String(row.id))
      router.push(path)
    }
  }

  const handleEditClick = (row: Record<string, unknown>, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingRow({ ...row })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingRow || !config.editConfig) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/table-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: config.editConfig.tableName,
          id: editingRow.id,
          data: editingRow,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save changes')
      }

      setData((prevData) =>
        prevData.map((row) => (row.id === editingRow.id ? editingRow : row))
      )

      toast.success('Changes saved successfully')

      setIsEditDialogOpen(false)
      setEditingRow(null)
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldChange = (fieldId: string, value: unknown) => {
    if (!editingRow) return
    setEditingRow({ ...editingRow, [fieldId]: value })
  }

  const clearAllFilters = () => {
    setFilters({})
    setSearchTerm('')
    toast.success('Filters cleared')
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchTerm) count++
    Object.values(filters).forEach((value) => {
      if (value && value !== 'all') {
        if (Array.isArray(value) && value.length > 0) count++
        else if (typeof value === 'object') count++
        else count++
      }
    })
    return count
  }, [searchTerm, filters])

  // ============================================================================
  // RENDER
  // ============================================================================

  const visibleColumnConfigs = config.columns.filter((col) => visibleColumns.has(col.id))

  return (
    <div className="space-y-4">
      {/* Header */}
      {config.title && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl">{config.title}</h1>
            {config.description && (
              <p className="text-sm text-muted-foreground">{config.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {sortedData.length} of {data.length} {config.title?.toLowerCase() || 'items'}
            {sortConfigs.length > 0 && (
              <Badge variant="outline" className="ml-2">
                Sorted by {sortConfigs.length}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Filters & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${config.title?.toLowerCase() || 'items'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced Filters */}
            {config.filters?.map((filter) => {
              switch (filter.type) {
                case 'select':
                  return (
                    <Select
                      key={filter.id}
                      value={String(filters[filter.id] || 'all')}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, [filter.id]: value }))
                      }
                    >
                      <SelectTrigger className="w-[160px]">
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
                  )

                case 'multiSelect':
                  return (
                    <Popover key={filter.id}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="border-dashed">
                          <Filter className="h-4 w-4 mr-2" />
                          {filter.label}
                          {filters[filter.id] &&
                            Array.isArray(filters[filter.id]) &&
                            (filters[filter.id] as string[]).length > 0 && (
                              <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                                {(filters[filter.id] as string[]).length}
                              </Badge>
                            )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0" align="start">
                        <div className="p-2">
                          {filter.options.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted rounded"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  filters[filter.id] &&
                                  Array.isArray(filters[filter.id]) &&
                                  (filters[filter.id] as string[]).includes(option.value)
                                }
                                onChange={(e) => {
                                  const currentValues = (filters[filter.id] as string[]) || []
                                  const newValues = e.target.checked
                                    ? [...currentValues, option.value]
                                    : currentValues.filter((v) => v !== option.value)
                                  setFilters((prev) => ({ ...prev, [filter.id]: newValues }))
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )

                case 'dateRange':
                  return (
                    <Popover key={filter.id}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="border-dashed">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {filter.label}
                          {filters[filter.id] && (
                            <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                              Set
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4" align="start">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>From Date</Label>
                            <Calendar
                              mode="single"
                              selected={
                                filters[filter.id]
                                  ? (filters[filter.id] as { from?: Date }).from
                                  : undefined
                              }
                              onSelect={(date) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  [filter.id]: { ...(prev[filter.id] as object), from: date },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>To Date</Label>
                            <Calendar
                              mode="single"
                              selected={
                                filters[filter.id]
                                  ? (filters[filter.id] as { to?: Date }).to
                                  : undefined
                              }
                              onSelect={(date) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  [filter.id]: { ...(prev[filter.id] as object), to: date },
                                }))
                              }
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setFilters((prev) => {
                                const newFilters = { ...prev }
                                delete newFilters[filter.id]
                                return newFilters
                              })
                            }
                          >
                            Clear
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )

                case 'numberRange':
                  return (
                    <Popover key={filter.id}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="border-dashed">
                          <Filter className="h-4 w-4 mr-2" />
                          {filter.label}
                          {filters[filter.id] && (
                            <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                              Set
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px]" align="start">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Min Value</Label>
                            <Input
                              type="number"
                              step={filter.step || 1}
                              value={
                                filters[filter.id]
                                  ? (filters[filter.id] as { min?: number }).min || ''
                                  : ''
                              }
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  [filter.id]: {
                                    ...(prev[filter.id] as object),
                                    min: e.target.value ? parseFloat(e.target.value) : undefined,
                                  },
                                }))
                              }
                              placeholder={filter.min?.toString()}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Max Value</Label>
                            <Input
                              type="number"
                              step={filter.step || 1}
                              value={
                                filters[filter.id]
                                  ? (filters[filter.id] as { max?: number }).max || ''
                                  : ''
                              }
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  [filter.id]: {
                                    ...(prev[filter.id] as object),
                                    max: e.target.value ? parseFloat(e.target.value) : undefined,
                                  },
                                }))
                              }
                              placeholder={filter.max?.toString()}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setFilters((prev) => {
                                const newFilters = { ...prev }
                                delete newFilters[filter.id]
                                return newFilters
                              })
                            }
                          >
                            Clear
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )

                default:
                  return null
              }
            })}

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear filters ({activeFilterCount})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Export Button */}
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {/* Column Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="h-4 w-4 mr-2" />
                  Columns
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {config.columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={visibleColumns.has(column.id)}
                    onCheckedChange={(checked) => {
                      const newVisibleColumns = new Set(visibleColumns)
                      if (checked) {
                        newVisibleColumns.add(column.id)
                      } else {
                        newVisibleColumns.delete(column.id)
                      }
                      setVisibleColumns(newVisibleColumns)
                    }}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="rounded-sm border"
        style={{
          maxHeight: config.virtualScroll ? '600px' : undefined,
          overflow: config.virtualScroll ? 'auto' : undefined,
        }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {visibleColumnConfigs.map((col) => (
                <TableHead
                  key={col.id}
                  onClick={(e) => handleSort(col.id, e.shiftKey)}
                  className={col.sortable ? 'cursor-pointer select-none hover:bg-muted/50' : ''}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && (
                      <div className="ml-auto">
                        {(() => {
                          const sortConfig = sortConfigs.find((s) => s.columnId === col.id)
                          if (sortConfig) {
                            return sortConfig.direction === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          }
                          return <ArrowUpDown className="h-4 w-4 opacity-30" />
                        })()}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
              {config.editConfig && <TableHead className="w-[80px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton columns={visibleColumnConfigs.length} />
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnConfigs.length + (config.editConfig ? 1 : 0)}
                  className="h-24 text-center"
                >
                  No {config.title?.toLowerCase() || 'items'} found.
                </TableCell>
              </TableRow>
            ) : config.virtualScroll && virtualRows ? (
              <>
                <tr style={{ height: `${totalHeight}px` }}>
                  <td />
                </tr>
                {virtualRows.map((virtualRow) => {
                  const row = sortedData[virtualRow.index]
                  return (
                    <TableRow
                      key={row.id as string}
                      data-index={virtualRow.index}
                      className={
                        config.rowClickPath
                          ? 'cursor-pointer hover:bg-muted/50 transition-colors'
                          : ''
                      }
                      onClick={() => handleRowClick(row)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {visibleColumnConfigs.map((col) => (
                        <TableCell key={col.id}>{renderCellContent(col, row)}</TableCell>
                      ))}
                      {config.editConfig && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEditClick(row, e)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </>
            ) : (
              sortedData.map((row) => (
                <TableRow
                  key={row.id as string}
                  className={
                    config.rowClickPath ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''
                  }
                  onClick={() => handleRowClick(row)}
                >
                  {visibleColumnConfigs.map((col) => (
                    <TableCell key={col.id}>{renderCellContent(col, row)}</TableCell>
                  ))}
                  {config.editConfig && (
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => handleEditClick(row, e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {config.editConfig && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {config.title?.slice(0, -1) || 'Item'}</DialogTitle>
              <DialogDescription>
                Make changes to this record. Click save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {editingRow &&
                config.columns
                  .filter(
                    (col) =>
                      col.id !== 'id' && col.id !== 'created_at' && col.id !== 'updated_at'
                  )
                  .map((col) => {
                    const value = editingRow[col.id]
                    const isEditable =
                      !config.editConfig?.editableFields ||
                      config.editConfig.editableFields.includes(col.id)

                    if (!isEditable) return null

                    return (
                      <div key={col.id} className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor={col.id} className="text-right pt-2">
                          {col.label}
                        </Label>
                        <div className="col-span-3">
                          {col.type === 'date' ? (
                            <Input
                              id={col.id}
                              type="date"
                              value={value ? String(value).split('T')[0] : ''}
                              onChange={(e) => handleFieldChange(col.id, e.target.value)}
                            />
                          ) : col.type === 'number' ? (
                            <Input
                              id={col.id}
                              type="number"
                              step="0.01"
                              value={value ? Number(value) : ''}
                              onChange={(e) =>
                                handleFieldChange(col.id, parseFloat(e.target.value))
                              }
                            />
                          ) : col.type === 'email' ? (
                            <Input
                              id={col.id}
                              type="email"
                              value={String(value || '')}
                              onChange={(e) => handleFieldChange(col.id, e.target.value)}
                            />
                          ) : (
                            <Textarea
                              id={col.id}
                              value={String(value || '')}
                              onChange={(e) => handleFieldChange(col.id, e.target.value)}
                              rows={3}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingRow(null)
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
