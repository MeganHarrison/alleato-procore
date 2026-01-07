# Quick Wins - Implementation Guide

These are the easiest, highest-impact improvements you can make to the Generic Table Factory.

## 1. Column Sorting (2 hours, huge impact)

### Type Definitions

```tsx
interface SortConfig {
  columnId: string
  direction: 'asc' | 'desc'
}

interface ColumnConfig {
  // ... existing fields
  sortable?: boolean
  sortType?: 'string' | 'number' | 'date' // Auto-detect if not specified
}
```

### State

```tsx
const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
```

### Sorting Logic

```tsx
const sortedData = useMemo(() => {
  if (!sortConfig) return filteredData

  return [...filteredData].sort((a, b) => {
    const aVal = a[sortConfig.columnId]
    const bVal = b[sortConfig.columnId]

    // Handle null/undefined
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    // Get column config to determine sort type
    const column = config.columns.find(c => c.id === sortConfig.columnId)
    const sortType = column?.sortType || column?.type || 'string'

    let comparison = 0

    switch (sortType) {
      case 'number':
        comparison = Number(aVal) - Number(bVal)
        break
      case 'date':
        comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
        break
      default: // string
        comparison = String(aVal).localeCompare(String(bVal))
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison
  })
}, [filteredData, sortConfig, config.columns])
```

### Header Click Handler

```tsx
const handleSort = (columnId: string) => {
  const column = config.columns.find(c => c.id === columnId)
  if (!column?.sortable) return

  setSortConfig(prev => {
    // First click: ascending
    if (!prev || prev.columnId !== columnId) {
      return { columnId, direction: 'asc' }
    }
    // Second click: descending
    if (prev.direction === 'asc') {
      return { columnId, direction: 'desc' }
    }
    // Third click: remove sort
    return null
  })
}
```

### UI Changes

```tsx
<TableHead
  key={col.id}
  onClick={() => handleSort(col.id)}
  className={col.sortable ? "cursor-pointer select-none hover:bg-muted/50" : ""}
>
  <div className="flex items-center gap-2">
    {col.label}
    {col.sortable && (
      <div className="ml-auto">
        {sortConfig?.columnId === col.id ? (
          sortConfig.direction === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    )}
  </div>
</TableHead>
```

---

## 2. Persistent State (1 hour, huge UX improvement)

### Save/Load Helpers

```tsx
const STORAGE_KEY_PREFIX = 'table-state-'

const saveTableState = (tableId: string, state: {
  visibleColumns: string[]
  sortConfig: SortConfig | null
  filters: Record<string, string>
}) => {
  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${tableId}`,
    JSON.stringify(state)
  )
}

const loadTableState = (tableId: string) => {
  const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tableId}`)
  return saved ? JSON.parse(saved) : null
}
```

### Initialize State from localStorage

```tsx
export function GenericDataTable({ data, config }: GenericDataTableProps) {
  // Generate stable ID from title or provide via config
  const tableId = config.id || slugify(config.title || 'table')

  // Load saved state
  const savedState = useMemo(() => loadTableState(tableId), [tableId])

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(
      savedState?.visibleColumns ||
      config.columns.filter(col => col.defaultVisible).map(col => col.id)
    )
  )

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    savedState?.sortConfig || null
  )

  const [filters, setFilters] = useState<Record<string, string>>(
    savedState?.filters || {}
  )

  // Save state whenever it changes
  useEffect(() => {
    saveTableState(tableId, {
      visibleColumns: Array.from(visibleColumns),
      sortConfig,
      filters
    })
  }, [tableId, visibleColumns, sortConfig, filters])

  // ... rest of component
}
```

### Add Reset Button

```tsx
const handleResetTable = () => {
  // Clear saved state
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${tableId}`)

  // Reset to defaults
  setVisibleColumns(
    new Set(config.columns.filter(col => col.defaultVisible).map(col => col.id))
  )
  setSortConfig(null)
  setFilters({})

  toast.success('Table reset to defaults')
}

// Add to toolbar
<Button variant="ghost" size="sm" onClick={handleResetTable}>
  <RotateCcw className="h-4 w-4 mr-2" />
  Reset
</Button>
```

---

## 3. Loading States (1 hour, professional feel)

### Skeleton Loader Component

```tsx
function TableSkeleton({ columns }: { columns: number }) {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, idx) => (
        <TableRow key={idx}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <TableCell key={colIdx}>
              <div className="h-4 bg-muted animate-pulse rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
```

### Usage

```tsx
interface GenericDataTableProps {
  data: Record<string, unknown>[]
  config: GenericTableConfig
  isLoading?: boolean // Add this
}

// In table body
<TableBody>
  {isLoading ? (
    <TableSkeleton columns={config.columns.filter(c => visibleColumns.has(c.id)).length} />
  ) : filteredData.length === 0 ? (
    // Empty state
  ) : (
    // Data rows
  )}
</TableBody>
```

---

## 4. Better Empty States (30 minutes, more polished)

```tsx
interface EmptyStateConfig {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
}

interface GenericTableConfig {
  // ... existing fields
  emptyState?: EmptyStateConfig
}

// Empty state component
function TableEmptyState({ config }: { config?: EmptyStateConfig }) {
  if (!config) {
    return <div className="text-center text-muted-foreground">No items found.</div>
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      {config.icon && (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          {config.icon}
        </div>
      )}
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">{config.title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {config.description}
        </p>
      </div>
      {config.action && (
        <Button onClick={config.action.onClick}>
          {config.action.icon}
          {config.action.label}
        </Button>
      )}
    </div>
  )
}

// Usage
<TableCell
  colSpan={visibleColumnCount}
  className="h-64"
>
  <TableEmptyState config={config.emptyState} />
</TableCell>
```

### Example Usage

```tsx
<GenericDataTable
  data={risks}
  config={{
    title: "Risks",
    // ... other config
    emptyState: {
      title: "No risks found",
      description: "Get started by creating your first risk assessment for this project.",
      icon: <AlertTriangle className="h-6 w-6" />,
      action: {
        label: "Create Risk",
        icon: <Plus className="h-4 w-4 mr-2" />,
        onClick: () => setCreateDialogOpen(true)
      }
    }
  }}
/>
```

---

## 5. Bulk Selection (3 hours, high productivity boost)

### State & Types

```tsx
interface BulkAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: (selectedIds: string[]) => Promise<void>
  variant?: 'default' | 'destructive'
}

interface GenericTableConfig {
  // ... existing fields
  bulkActions?: BulkAction[]
}

const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
```

### Selection Handlers

```tsx
const toggleRow = (rowId: string) => {
  const newSelected = new Set(selectedRows)
  if (newSelected.has(rowId)) {
    newSelected.delete(rowId)
  } else {
    newSelected.add(rowId)
  }
  setSelectedRows(newSelected)
}

const toggleAll = () => {
  if (selectedRows.size === filteredData.length) {
    setSelectedRows(new Set())
  } else {
    setSelectedRows(new Set(filteredData.map(row => String(row.id))))
  }
}

const clearSelection = () => setSelectedRows(new Set())
```

### UI - Header Checkbox

```tsx
<TableHeader>
  <TableRow>
    {config.bulkActions && (
      <TableHead className="w-12">
        <Checkbox
          checked={selectedRows.size === filteredData.length && filteredData.length > 0}
          onCheckedChange={toggleAll}
          indeterminate={selectedRows.size > 0 && selectedRows.size < filteredData.length}
        />
      </TableHead>
    )}
    {/* ... column headers */}
  </TableRow>
</TableHeader>
```

### UI - Row Checkboxes

```tsx
<TableRow>
  {config.bulkActions && (
    <TableCell onClick={(e) => e.stopPropagation()}>
      <Checkbox
        checked={selectedRows.has(String(row.id))}
        onCheckedChange={() => toggleRow(String(row.id))}
      />
    </TableCell>
  )}
  {/* ... data cells */}
</TableRow>
```

### UI - Bulk Actions Toolbar

```tsx
{selectedRows.size > 0 && (
  <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
    <span className="font-medium">
      {selectedRows.size} selected
    </span>
    <div className="flex gap-2">
      {config.bulkActions?.map(action => (
        <Button
          key={action.id}
          variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
          size="sm"
          onClick={async () => {
            await action.onClick(Array.from(selectedRows))
            clearSelection()
          }}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={clearSelection}
    >
      Clear
    </Button>
  </div>
)}
```

### Example Usage

```tsx
<GenericDataTable
  data={risks}
  config={{
    // ... other config
    bulkActions: [
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4 mr-2" />,
        variant: 'destructive',
        onClick: async (ids) => {
          await deleteRisks(ids)
          toast.success(`Deleted ${ids.length} risks`)
        }
      },
      {
        id: 'export',
        label: 'Export',
        icon: <Download className="h-4 w-4 mr-2" />,
        onClick: async (ids) => {
          const rows = data.filter(row => ids.includes(String(row.id)))
          exportToCSV(rows)
        }
      },
      {
        id: 'assign',
        label: 'Assign to...',
        icon: <User className="h-4 w-4 mr-2" />,
        onClick: async (ids) => {
          setAssignDialogOpen(true)
          setItemsToAssign(ids)
        }
      }
    ]
  }}
/>
```

---

## 6. Quick Filters (2 hours, power user feature)

### Click Cell to Filter

```tsx
const handleQuickFilter = (columnId: string, value: unknown) => {
  // Find if there's a filter config for this column
  const filterConfig = config.filters?.find(f => f.field === columnId)

  if (filterConfig) {
    setFilters(prev => ({
      ...prev,
      [filterConfig.id]: String(value)
    }))
    toast.success(`Filtered by ${filterConfig.label}: ${value}`)
  } else {
    // Create a temporary search
    setSearchTerm(String(value))
    toast.success(`Searching for: ${value}`)
  }
}

// Add to cell rendering
<TableCell
  key={col.id}
  onContextMenu={(e) => {
    e.preventDefault()
    // Show context menu with quick actions
  }}
  onDoubleClick={() => handleQuickFilter(col.id, row[col.id])}
>
  {renderCellContent(col, row)}
</TableCell>
```

### Context Menu

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

<ContextMenu>
  <ContextMenuTrigger asChild>
    <TableCell>{/* ... */}</TableCell>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={() => handleQuickFilter(col.id, row[col.id])}>
      <Filter className="h-4 w-4 mr-2" />
      Filter by this value
    </ContextMenuItem>
    <ContextMenuItem onClick={() => navigator.clipboard.writeText(String(row[col.id]))}>
      <Copy className="h-4 w-4 mr-2" />
      Copy value
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

## 7. Column Aggregation Footer (2 hours, useful for budgets)

### Type Definition

```tsx
interface ColumnConfig {
  // ... existing fields
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}
```

### Calculate Aggregations

```tsx
const calculateAggregate = (
  data: Record<string, unknown>[],
  columnId: string,
  type: 'sum' | 'avg' | 'count' | 'min' | 'max'
) => {
  const values = data
    .map(row => row[columnId])
    .filter(val => val !== null && val !== undefined)
    .map(val => Number(val))
    .filter(val => !isNaN(val))

  if (values.length === 0) return null

  switch (type) {
    case 'sum':
      return values.reduce((acc, val) => acc + val, 0)
    case 'avg':
      return values.reduce((acc, val) => acc + val, 0) / values.length
    case 'count':
      return values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
  }
}
```

### Footer Row

```tsx
{config.columns.some(col => col.aggregate) && (
  <TableFooter>
    <TableRow className="bg-muted/50 font-medium">
      {config.bulkActions && <TableCell />}
      {config.columns
        .filter(col => visibleColumns.has(col.id))
        .map(col => (
          <TableCell key={col.id}>
            {col.aggregate ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase">
                  {col.aggregate}:
                </span>
                <span>
                  {renderCellContent(
                    col,
                    {
                      [col.id]: calculateAggregate(
                        filteredData,
                        col.id,
                        col.aggregate
                      )
                    }
                  )}
                </span>
              </div>
            ) : (
              col.id === config.columns.filter(c => visibleColumns.has(c.id))[0].id && (
                <span className="text-muted-foreground">Totals</span>
              )
            )}
          </TableCell>
        ))}
      {config.editConfig && <TableCell />}
    </TableRow>
  </TableFooter>
)}
```

---

## Summary - Implementation Priority

**Start with these 3 (4 hours total):**
1. ✅ Column sorting (2 hours)
2. ✅ Persistent state (1 hour)
3. ✅ Loading states (1 hour)

**Then add these (5 hours total):**
4. ✅ Better empty states (30 min)
5. ✅ Bulk selection (3 hours)
6. ✅ Quick filters (1.5 hours)

**Nice to have (2 hours total):**
7. ✅ Column aggregation (2 hours)

**Total time for all quick wins: ~11 hours**
**Impact: Transforms basic table into production-grade component**

These improvements turn your generic table from "functional" to "production-ready" with minimal effort!
