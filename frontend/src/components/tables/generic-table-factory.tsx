/**
 * ============================================================================
 * GENERIC DATA TABLE FACTORY
 * ============================================================================
 *
 * PURPOSE:
 * This is a powerful, reusable table component that eliminates the need to
 * write custom table components for each data type. Instead, you configure
 * it with a simple object that defines columns, filters, and behavior.
 *
 * CORE PHILOSOPHY:
 * - Configuration over implementation
 * - Serializable config (no functions passed as props)
 * - Feature-rich out of the box
 * - Type-safe with TypeScript
 *
 * KEY FEATURES:
 * 1. Search - Text search across multiple fields
 * 2. Filtering - Dropdown filters with custom options
 * 3. Column Visibility - Show/hide columns dynamically
 * 4. Export - CSV export of filtered data
 * 5. Inline Editing - Edit rows with dialog interface
 * 6. Row Navigation - Click rows to navigate to detail pages
 * 7. Flexible Rendering - Badges, currency, dates, arrays, nested objects
 * 8. View Modes - Table, Card, and List views
 * 9. Column Sorting - Click headers to sort ascending/descending
 * 10. Row Selection - Checkboxes for bulk operations
 * 11. Three-dot Menu - Dropdown actions for each row
 *
 * USAGE EXAMPLE:
 * ```tsx
 * <GenericDataTable
 *   data={risks}
 *   config={{
 *     title: "Risks",
 *     columns: [
 *       { id: 'title', label: 'Title', defaultVisible: true, type: 'text', isPrimary: true },
 *       { id: 'status', label: 'Status', defaultVisible: true, type: 'badge' },
 *       { id: 'cost', label: 'Cost Impact', defaultVisible: true,
 *         renderConfig: { type: 'currency', prefix: '$' } }
 *     ],
 *     searchFields: ['title', 'description'],
 *     rowClickPath: "/risks/{id}",
 *     editConfig: { tableName: 'risks' },
 *     enableViewSwitcher: true,
 *     enableRowSelection: true,
 *     enableSorting: true,
 *   }}
 * />
 * ```
 *
 * ARCHITECTURE:
 * - Client component (uses hooks and browser APIs)
 * - Local state management for UI (search, filters, column visibility)
 * - Memoized filtering for performance
 * - API calls for persistence (edit functionality)
 *
 * LOCATED AT: [frontend/src/components/tables/generic-table-factory.tsx](frontend/src/components/tables/generic-table-factory.tsx)
 */

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Search,
  Download,
  Columns3,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  Table2,
  LayoutGrid,
  List,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPE DEFINITIONS - View Mode
// ============================================================================

export type ViewMode = 'table' | 'card' | 'list'

// ============================================================================
// TYPE DEFINITIONS - Render Configuration
// ============================================================================
// These types define how table cells should be rendered. They are all
// serializable (no functions) so they can be passed as props and potentially
// stored in configuration files or databases.

/**
 * Badge Render Configuration
 *
 * Renders cell value as a Badge component with color-coded variants.
 * Useful for status fields, priority levels, categories, etc.
 *
 * Example:
 * ```tsx
 * {
 *   type: 'badge',
 *   variantMap: {
 *     'critical': 'destructive',  // Red badge
 *     'high': 'default',           // Primary color
 *     'medium': 'secondary',       // Gray badge
 *     'low': 'outline'             // Outlined badge
 *   },
 *   defaultVariant: 'outline'      // Fallback if value not in map
 * }
 * ```
 */
export interface BadgeRenderConfig {
  type: 'badge'
  variantMap?: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'>
  defaultVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

/**
 * Currency Render Configuration
 *
 * Formats numbers as currency with locale-aware thousand separators.
 *
 * Example:
 * ```tsx
 * { type: 'currency', prefix: '$', showDecimals: true }
 * // Renders: 1234.56 → "$1,234.56"
 * ```
 */
export interface CurrencyRenderConfig {
  type: 'currency'
  prefix?: string        // Default: '$'
  showDecimals?: boolean // Default: true (2 decimal places)
}

/**
 * Truncate Render Configuration
 *
 * Truncates long text with ellipsis. Useful for descriptions, notes, etc.
 *
 * Example:
 * ```tsx
 * { type: 'truncate', maxLength: 50 }
 * // Renders: "This is a very long text..." (50 chars max)
 * ```
 */
export interface TruncateRenderConfig {
  type: 'truncate'
  maxLength: number
}

/**
 * Array Render Configuration
 *
 * Renders array values as badges or comma-separated text.
 * Useful for tags, categories, assignees, etc.
 *
 * Example:
 * ```tsx
 * { type: 'array', itemType: 'badge' }
 * // Renders: ['tag1', 'tag2'] → <Badge>tag1</Badge> <Badge>tag2</Badge>
 *
 * { type: 'array', itemType: 'text', separator: ' | ' }
 * // Renders: ['tag1', 'tag2'] → "tag1 | tag2"
 * ```
 */
export interface ArrayRenderConfig {
  type: 'array'
  itemType?: 'badge' | 'text' // How to render each item
  separator?: string           // For text type (default: ', ')
}

/**
 * JSON Render Configuration
 *
 * Stringifies JSON objects and truncates if needed.
 * Useful for metadata, settings, or debug fields.
 *
 * Example:
 * ```tsx
 * { type: 'json', maxLength: 100 }
 * // Renders: { foo: 'bar' } → '{"foo":"bar"}'
 * ```
 */
export interface JsonRenderConfig {
  type: 'json'
  maxLength: number
}

/**
 * Nested Object Render Configuration
 *
 * Accesses nested properties using dot notation.
 * Useful for related data or metadata fields.
 *
 * Example:
 * ```tsx
 * { type: 'nested', path: 'document_metadata.title', fallback: 'Untitled' }
 * // Accesses: row.document_metadata.title
 * // If not found, displays: 'Untitled'
 * ```
 */
export interface NestedRenderConfig {
  type: 'nested'
  path: string      // Dot notation path: "user.profile.name"
  fallback?: string // Default value if path not found
}

/**
 * Union type of all render configurations.
 * Used in ColumnConfig to specify custom rendering.
 */
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

/**
 * Column Configuration
 *
 * Defines a single table column's behavior and rendering.
 *
 * Fields:
 * - id: The key in the data object (e.g., 'status', 'created_at')
 * - label: Display name in table header
 * - defaultVisible: Whether column shows by default (user can toggle)
 * - type: Basic type-based rendering (text, date, badge, number, email)
 * - renderConfig: Advanced rendering (overrides type if provided)
 * - sortable: Whether column can be sorted (default: true)
 * - isPrimary: Used for card/list view to determine primary display
 * - isSecondary: Used for card/list view to determine secondary display
 */
export interface ColumnConfig {
  id: string
  label: string
  defaultVisible: boolean
  type?: 'text' | 'date' | 'badge' | 'number' | 'email'
  renderConfig?: RenderConfig
  sortable?: boolean
  isPrimary?: boolean
  isSecondary?: boolean
}

/**
 * Filter Configuration
 *
 * Defines a dropdown filter for the table.
 *
 * Example:
 * ```tsx
 * {
 *   id: 'status-filter',
 *   label: 'Status',
 *   field: 'status', // Which field to filter on
 *   options: [
 *     { value: 'open', label: 'Open' },
 *     { value: 'closed', label: 'Closed' }
 *   ]
 * }
 * ```
 */
export interface FilterConfig {
  id: string
  label: string
  field: string // Field in data to filter
  options: { value: string; label: string }[]
}

/**
 * Edit Configuration
 *
 * Enables inline editing functionality for the table.
 * When provided, an "Actions" column with edit button appears.
 *
 * Fields:
 * - tableName: Supabase table name for API updates
 * - editableFields: Optional whitelist of editable fields
 *   (if omitted, all columns except id, created_at, updated_at are editable)
 * - requiresDialog: Whether to always use dialog (default: true)
 */
export interface EditConfig {
  tableName: string
  editableFields?: string[]
  requiresDialog?: boolean
}

/**
 * Row Action Configuration
 *
 * Defines custom actions in the three-dot dropdown menu.
 */
export interface RowActionConfig {
  id: string
  label: string
  icon?: 'pencil' | 'trash' | 'external'
  variant?: 'default' | 'destructive'
}

/**
 * Main Table Configuration
 *
 * The complete configuration object passed to GenericDataTable.
 *
 * Required Fields:
 * - columns: Array of column definitions
 * - searchFields: Which fields to include in text search
 *
 * Optional Fields:
 * - title: Table title (h1)
 * - description: Subtitle text
 * - filters: Dropdown filters
 * - rowClickPath: Navigation path template (e.g., "/risks/{id}")
 * - exportFilename: CSV export filename (default: "export.csv")
 * - editConfig: Enable editing functionality
 * - enableViewSwitcher: Enable table/card/list view toggle
 * - defaultViewMode: Initial view mode
 * - enableRowSelection: Enable row checkboxes
 * - enableSorting: Enable column sorting
 * - defaultSortColumn: Initial sort column
 * - defaultSortDirection: Initial sort direction
 * - rowActions: Custom row actions
 * - onDelete: Enable delete functionality
 */
export interface GenericTableConfig {
  title?: string
  description?: string
  columns: ColumnConfig[]
  filters?: FilterConfig[]
  searchFields: string[]
  rowClickPath?: string
  exportFilename?: string
  editConfig?: EditConfig
  enableViewSwitcher?: boolean
  defaultViewMode?: ViewMode
  enableRowSelection?: boolean
  enableSorting?: boolean
  defaultSortColumn?: string
  defaultSortDirection?: 'asc' | 'desc'
  rowActions?: RowActionConfig[]
  onDelete?: boolean
}

/**
 * Component Props
 *
 * - data: Array of row objects (must have 'id' field)
 * - config: Table configuration object
 * - onSelectionChange: Callback when selection changes
 * - onDeleteRow: Callback when delete action is triggered
 */
interface GenericDataTableProps {
  data: Record<string, unknown>[]
  config: GenericTableConfig
  onSelectionChange?: (selectedIds: (string | number)[]) => void
  onDeleteRow?: (id: string | number) => Promise<{ error?: string }>
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GenericDataTable({ data: initialData, config, onSelectionChange, onDeleteRow }: GenericDataTableProps) {
  const router = useRouter()

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Local copy of data (updated when edits are saved)
  const [data, setData] = useState(initialData)

  // Search term from input field
  const [searchTerm, setSearchTerm] = useState('')

  // Active filter values (key: filter.id, value: selected option)
  const [filters, setFilters] = useState<Record<string, string>>({})

  // Which columns are currently visible (Set for O(1) lookup)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(config.columns.filter(col => col.defaultVisible).map(col => col.id))
  )

  // Current row being edited (null when dialog is closed)
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null)

  // Edit dialog open state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Loading state for save operation
  const [isSaving, setIsSaving] = useState(false)

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>(config.defaultViewMode || 'table')

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(config.defaultSortColumn || null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(config.defaultSortDirection || 'asc')

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | number | null>(null)

  // ============================================================================
  // FILTERING, SEARCH & SORTING LOGIC
  // ============================================================================

  /**
   * Memoized filtered and sorted data
   */
  const processedData = useMemo(() => {
    // Step 1: Filter data
    let result = data.filter(row => {
      // Search filter: Check if any searchField contains searchTerm
      const matchesSearch = config.searchFields.some(field => {
        const value = row[field]
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(searchTerm.toLowerCase())
      })

      if (searchTerm && !matchesSearch) return false

      // Custom filters: Check if row matches all active filters
      if (config.filters) {
        for (const filter of config.filters) {
          const filterValue = filters[filter.id]
          if (filterValue && filterValue !== 'all') {
            const rowValue = row[filter.field]
            if (rowValue !== filterValue) return false
          }
        }
      }

      return true
    })

    // Step 2: Sort data
    if (sortColumn && config.enableSorting !== false) {
      result = [...result].sort((a, b) => {
        const valueA = a[sortColumn]
        const valueB = b[sortColumn]

        // Handle null/undefined
        if (valueA == null && valueB == null) return 0
        if (valueA == null) return sortDirection === 'asc' ? 1 : -1
        if (valueB == null) return sortDirection === 'asc' ? -1 : 1

        // Handle different types
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA
        }

        // String comparison
        const strA = String(valueA).toLowerCase()
        const strB = String(valueB).toLowerCase()
        return sortDirection === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA)
      })
    }

    return result
  }, [data, searchTerm, filters, config.searchFields, config.filters, sortColumn, sortDirection, config.enableSorting])

  // ============================================================================
  // SORTING HANDLERS
  // ============================================================================

  const handleSort = (columnId: string) => {
    if (config.enableSorting === false) return

    const column = config.columns.find(c => c.id === columnId)
    if (column?.sortable === false) return

    if (sortColumn === columnId) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (columnId: string) => {
    if (config.enableSorting === false) return null

    const column = config.columns.find(c => c.id === columnId)
    if (column?.sortable === false) return null

    if (sortColumn !== columnId) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
    }

    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="ml-1 h-3.5 w-3.5" />
    )
  }

  // ============================================================================
  // ROW SELECTION HANDLERS
  // ============================================================================

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(processedData.map(row => row.id as string | number))
      setSelectedIds(allIds)
      onSelectionChange?.(Array.from(allIds))
    } else {
      setSelectedIds(new Set())
      onSelectionChange?.([])
    }
  }

  const handleSelectRow = (id: string | number, checked: boolean) => {
    const newSelection = new Set(selectedIds)
    if (checked) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    setSelectedIds(newSelection)
    onSelectionChange?.(Array.from(newSelection))
  }

  const isAllSelected = processedData.length > 0 && selectedIds.size === processedData.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < processedData.length

  // ============================================================================
  // RENDERING HELPERS
  // ============================================================================

  /**
   * Format Date Helper
   */
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    try {
      return format(new Date(date), 'MMM dd, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  /**
   * Render With Config
   */
  const renderWithConfig = (value: unknown, renderConfig: RenderConfig) => {
    switch (renderConfig.type) {
      case 'badge': {
        const strValue = String(value || '')
        const variant = renderConfig.variantMap?.[strValue] || renderConfig.defaultVariant || 'outline'
        return <Badge variant={variant}>{strValue || 'N/A'}</Badge>
      }

      case 'currency': {
        const numValue = Number(value)
        if (!value || Number.isNaN(numValue)) return 'N/A'
        const formatted = renderConfig.showDecimals !== false
          ? numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

  /**
   * Render Cell Content
   */
  const renderCellContent = (column: ColumnConfig, row: Record<string, unknown>) => {
    const value = row[column.id]

    if (column.renderConfig) {
      return renderWithConfig(value, column.renderConfig)
    }

    switch (column.type) {
      case 'date':
        return formatDate(value as string)

      case 'badge':
        return (
          <Badge variant="outline">
            {value ? String(value) : 'N/A'}
          </Badge>
        )

      case 'email':
        return value ? (
          <a href={`mailto:${value}`} className="text-primary hover:underline">
            <Text as="span" size="sm">{String(value)}</Text>
          </a>
        ) : (
          <Text as="span" tone="muted" size="sm">N/A</Text>
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

  const exportToCSV = () => {
    const headers = config.columns
      .filter(col => visibleColumns.has(col.id))
      .map(col => col.label)

    const rows = processedData.map(row =>
      config.columns
        .filter(col => visibleColumns.has(col.id))
        .map(col => {
          const value = row[col.id]
          if (col.type === 'date') {
            return formatDate(value as string)
          }
          return value ? String(value) : ''
        })
    )

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
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

  const handleDeleteClick = async (row: Record<string, unknown>, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDeleteRow) return

    const id = row.id as string | number
    setDeletingId(id)
    try {
      const { error } = await onDeleteRow(id)
      if (error) {
        toast.error(error)
      } else {
        toast.success('Deleted successfully')
        setData(prev => prev.filter(r => r.id !== id))
        const newSelection = new Set(selectedIds)
        newSelection.delete(id)
        setSelectedIds(newSelection)
        onSelectionChange?.(Array.from(newSelection))
      }
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
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

      setData(prevData =>
        prevData.map(row => (row.id === editingRow.id ? editingRow : row))
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

  // ============================================================================
  // ROW ACTIONS RENDERER
  // ============================================================================

  const renderRowActions = (row: Record<string, unknown>) => {
    const hasEditConfig = !!config.editConfig
    const hasDelete = !!onDeleteRow || config.onDelete
    const hasCustomActions = config.rowActions && config.rowActions.length > 0
    const isCurrentlyDeleting = deletingId === row.id

    if (!hasEditConfig && !hasDelete && !hasCustomActions) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasEditConfig && (
            <DropdownMenuItem onClick={(e) => handleEditClick(row, e)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          {config.rowActions?.map((action) => (
            <DropdownMenuItem
              key={action.id}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
            >
              {action.icon === 'pencil' && <Pencil className="h-4 w-4 mr-2" />}
              {action.icon === 'trash' && <Trash2 className="h-4 w-4 mr-2" />}
              {action.label}
            </DropdownMenuItem>
          ))}
          {hasDelete && (
            <DropdownMenuItem
              onClick={(e) => handleDeleteClick(row, e)}
              className="text-destructive"
              disabled={isCurrentlyDeleting}
            >
              {isCurrentlyDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // ============================================================================
  // VIEW RENDERERS
  // ============================================================================

  const renderCardView = () => {
    const primaryColumn = config.columns.find(c => c.isPrimary) || config.columns[0]
    const secondaryColumn = config.columns.find(c => c.isSecondary) || config.columns[1]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {processedData.map((row, idx) => (
          <Card
            key={row.id as string || idx}
            className={cn(
              'group hover:shadow-sm transition-all cursor-pointer',
              selectedIds.has(row.id as string | number) && 'ring-2 ring-primary'
            )}
            onClick={() => handleRowClick(row)}
          >
            <CardContent className="px-4 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {config.enableRowSelection && (
                    <Checkbox
                      checked={selectedIds.has(row.id as string | number)}
                      onCheckedChange={(checked) => {
                        handleSelectRow(row.id as string | number, !!checked)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Select row"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {renderCellContent(primaryColumn, row)}
                    </p>
                    {secondaryColumn && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {renderCellContent(secondaryColumn, row)}
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      {config.columns
                        .filter(c => !c.isPrimary && !c.isSecondary && visibleColumns.has(c.id))
                        .slice(0, 3)
                        .map((column) => (
                          <div key={column.id} className="text-xs text-muted-foreground">
                            <span className="font-medium">{column.label}:</span>{' '}
                            {renderCellContent(column, row)}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  {renderRowActions(row)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {processedData.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No {config.title?.toLowerCase() || 'items'} found.
          </div>
        )}
      </div>
    )
  }

  const renderListView = () => {
    const primaryColumn = config.columns.find(c => c.isPrimary) || config.columns[0]
    const secondaryColumn = config.columns.find(c => c.isSecondary) || config.columns[1]

    return (
      <div className="space-y-2">
        {processedData.map((row, idx) => (
          <div
            key={row.id as string || idx}
            className={cn(
              'flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer',
              selectedIds.has(row.id as string | number) && 'ring-2 ring-primary'
            )}
            onClick={() => handleRowClick(row)}
          >
            {config.enableRowSelection && (
              <Checkbox
                checked={selectedIds.has(row.id as string | number)}
                onCheckedChange={(checked) => {
                  handleSelectRow(row.id as string | number, !!checked)
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select row"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium truncate flex-1">
                  {renderCellContent(primaryColumn, row)}
                </p>
                {secondaryColumn && (
                  <span className="text-xs text-muted-foreground truncate">
                    {renderCellContent(secondaryColumn, row)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                {config.columns
                  .filter(c => !c.isPrimary && !c.isSecondary && visibleColumns.has(c.id))
                  .slice(0, 4)
                  .map((column) => (
                    <span key={column.id}>
                      <span className="font-medium">{column.label}:</span>{' '}
                      {renderCellContent(column, row)}
                    </span>
                  ))}
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              {renderRowActions(row)}
            </div>
          </div>
        ))}
        {processedData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No {config.title?.toLowerCase() || 'items'} found.
          </div>
        )}
      </div>
    )
  }

  const renderTableView = () => {
    const hasActions = config.editConfig || onDeleteRow || config.onDelete || config.rowActions?.length

    return (
      <div className="rounded-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              {config.enableRowSelection && (
                <TableHead className="w-[50px]">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = isSomeSelected
                        }
                      }}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Select all"
                    />
                  </div>
                </TableHead>
              )}
              {config.columns
                .filter(col => visibleColumns.has(col.id))
                .map(col => {
                  const isSortable = config.enableSorting !== false && col.sortable !== false
                  return (
                    <TableHead
                      key={col.id}
                      className={cn(
                        isSortable && 'cursor-pointer select-none hover:bg-muted/50'
                      )}
                      onClick={() => isSortable && handleSort(col.id)}
                    >
                      <div className="flex items-center">
                        {col.label}
                        {renderSortIcon(col.id)}
                      </div>
                    </TableHead>
                  )
                })}
              {hasActions && <TableHead className="w-[70px] text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    config.columns.filter(col => visibleColumns.has(col.id)).length +
                    (config.enableRowSelection ? 1 : 0) +
                    (hasActions ? 1 : 0)
                  }
                  className="h-24 text-center"
                >
                  No {config.title?.toLowerCase() || 'items'} found.
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((row, idx) => (
                <TableRow
                  key={row.id as string || idx}
                  className={cn(
                    config.rowClickPath ? "cursor-pointer hover:bg-muted/50 transition-colors" : "",
                    selectedIds.has(row.id as string | number) && 'bg-muted/30'
                  )}
                  onClick={() => handleRowClick(row)}
                  data-state={selectedIds.has(row.id as string | number) ? 'selected' : undefined}
                >
                  {config.enableRowSelection && (
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={selectedIds.has(row.id as string | number)}
                          onCheckedChange={(checked) => {
                            handleSelectRow(row.id as string | number, !!checked)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Select row"
                        />
                      </div>
                    </TableCell>
                  )}
                  {config.columns
                    .filter(col => visibleColumns.has(col.id))
                    .map(col => (
                      <TableCell key={col.id}>
                        {renderCellContent(col, row)}
                      </TableCell>
                    ))}
                  {hasActions && (
                    <TableCell className="text-right">
                      {renderRowActions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* ========================================
          HEADER SECTION
          ======================================== */}
      {config.title && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl">{config.title}</h1>
            {config.description && (
              <p className="text-sm text-muted-foreground">{config.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {config.enableRowSelection && selectedIds.size > 0 && (
              <span>{selectedIds.size} selected</span>
            )}
            <span>{processedData.length} of {data.length} {config.title?.toLowerCase() || 'items'}</span>
          </div>
        </div>
      )}

      {/* ========================================
          FILTERS & CONTROLS
          ======================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${config.title?.toLowerCase() || 'items'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Dynamic Filters (from config) */}
          {config.filters?.map(filter => (
            <Select
              key={filter.id}
              value={filters[filter.id] || 'all'}
              onValueChange={(value) => setFilters(prev => ({ ...prev, [filter.id]: value }))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher */}
          {config.enableViewSwitcher && (
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="table" className="gap-1.5">
                  <Table2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </TabsTrigger>
                <TabsTrigger value="card" className="gap-1.5">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Card</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1.5">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Export Button */}
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Column Visibility Toggle */}
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

      {/* ========================================
          CONTENT (View-based rendering)
          ======================================== */}
      {viewMode === 'table' && renderTableView()}
      {viewMode === 'card' && renderCardView()}
      {viewMode === 'list' && renderListView()}

      {/* ========================================
          EDIT DIALOG
          ======================================== */}
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
              {editingRow && config.columns
                .filter(col => col.id !== 'id' && col.id !== 'created_at' && col.id !== 'updated_at')
                .map((col) => {
                  const value = editingRow[col.id]
                  const isEditable = !config.editConfig?.editableFields ||
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
                        ) : col.renderConfig?.type === 'badge' || col.type === 'badge' ? (
                          <Select
                            value={String(value || '')}
                            onValueChange={(v) => handleFieldChange(col.id, v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {config.filters
                                ?.find(f => f.field === col.id)
                                ?.options.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                )) || []}
                            </SelectContent>
                          </Select>
                        ) : col.renderConfig?.type === 'currency' || col.type === 'number' ? (
                          <Input
                            id={col.id}
                            type="number"
                            step="0.01"
                            value={value ? Number(value) : ''}
                            onChange={(e) => handleFieldChange(col.id, parseFloat(e.target.value))}
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
