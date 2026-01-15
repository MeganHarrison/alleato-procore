# Generic Table Factory - Complete Documentation

**Single Source of Truth** for the Generic Table Factory component.

## Quick Links

- [Component Location](./generic-table-factory.tsx)
- [Usage Examples](#usage-examples)
- [Features](#features)
- [Configuration Reference](#configuration-reference)

---

## Overview

The Generic Table Factory is a powerful, configurable data table component that supports:
- Basic table rendering with sorting, filtering, and search
- Advanced features like virtual scrolling, fuzzy search, inline editing
- Multiple view modes (table, card, list)
- Bulk actions and row selection
- Export capabilities

**Component Path**: `frontend/src/components/tables/generic-table-factory.tsx`

---

## Features

### Core Features (Always Available)

1. **Column Configuration** - Define columns with types, labels, visibility
2. **Search** - Full-text search across specified fields
3. **Filtering** - Dropdown filters for specific fields
4. **Sorting** - Click column headers to sort (single or multi-column)
5. **Row Actions** - Edit, delete, and custom actions
6. **View Modes** - Switch between table, card, and list views
7. **Export** - CSV export functionality

### Advanced Features (Opt-In)

8. **Virtual Scrolling** (`enableVirtualScroll`) - Handle 10,000+ rows efficiently
9. **Multi-Column Sorting** (`enableMultiColumnSort`) - Shift+Click for secondary sorts
10. **Fuzzy Search** (`enableFuzzySearch`) - Typo-tolerant search with Fuse.js
11. **Bulk Actions** (`bulkActions`) - Select multiple rows and perform batch operations
12. **Inline Cell Editing** (`enableInlineCellEdit`) - Double-click cells to edit inline
13. **Row Selection** (`enableRowSelection`) - Checkbox selection for rows
14. **Advanced Filters** (`advancedFilters`) - Date ranges, number ranges, multi-select

---

## Usage Examples

### Basic Usage

```typescript
import { GenericDataTable, type GenericTableConfig } from '@/components/tables/generic-table-factory'

const config: GenericTableConfig = {
  title: 'Projects',
  description: 'All active projects',
  columns: [
    {
      id: 'name',
      label: 'Project Name',
      defaultVisible: true,
      type: 'text',
    },
    {
      id: 'status',
      label: 'Status',
      defaultVisible: true,
      renderConfig: {
        type: 'badge',
        variantMap: {
          'active': 'default',
          'completed': 'outline',
        },
      },
    },
  ],
  searchFields: ['name', 'description'],
  exportFilename: 'projects.csv',
}

export default function ProjectsPage() {
  const { data } = await fetchProjects()
  return <GenericDataTable data={data} config={config} />
}
```

### With Editing

```typescript
const config: GenericTableConfig = {
  title: 'Risks',
  columns: [...],
  searchFields: ['description'],

  editConfig: {
    tableName: 'risks',
    editableFields: ['description', 'status', 'owner_name'],
  },
}
```

### With Inline Editing

```typescript
const config: GenericTableConfig = {
  title: 'Tasks',
  columns: [...],
  searchFields: ['title'],

  editConfig: {
    tableName: 'tasks',
    editableFields: ['title', 'status', 'priority'],
  },

  // Enable inline editing
  enableInlineCellEdit: true,
}
```

**Keyboard Shortcuts for Inline Editing:**
- **Double-click** cell to edit
- **Tab** - Save and move to next cell
- **Shift+Tab** - Save and move to previous cell
- **Enter** - Save and exit edit mode
- **Escape** - Cancel without saving
- **Blur** (click away) - Auto-save

### With Virtual Scrolling

```typescript
const config: GenericTableConfig = {
  title: 'Large Dataset',
  columns: [...],
  searchFields: ['name'],

  // Enable virtual scrolling for 10,000+ rows
  enableVirtualScroll: true,
  virtualScrollHeight: 600, // pixels
}
```

### With Bulk Actions

```typescript
const config: GenericTableConfig = {
  title: 'Documents',
  columns: [...],
  searchFields: ['filename'],

  enableRowSelection: true,

  bulkActions: [
    {
      id: 'delete',
      label: 'Delete Selected',
      variant: 'destructive',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (selectedIds) => {
        await deleteDocuments(selectedIds)
        toast.success(`Deleted ${selectedIds.length} documents`)
      },
    },
  ],
}
```

### With Multi-Column Sorting

```typescript
const config: GenericTableConfig = {
  title: 'Reports',
  columns: [...],
  searchFields: ['title'],

  // Enable Shift+Click for multi-column sorting
  enableMultiColumnSort: true,
}
```

### With Fuzzy Search

```typescript
const config: GenericTableConfig = {
  title: 'Contacts',
  columns: [...],
  searchFields: ['name', 'email', 'company'],

  // Enable typo-tolerant search
  enableFuzzySearch: true,
  fuzzySearchThreshold: 0.3, // 0.0 = exact, 1.0 = match anything
}
```

---

## Configuration Reference

### GenericTableConfig

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `title` | string | No | - | Table title (h1) |
| `description` | string | No | - | Subtitle text |
| `columns` | ColumnConfig[] | Yes | - | Column definitions |
| `searchFields` | string[] | Yes | - | Fields to search in |
| `filters` | FilterConfig[] | No | - | Dropdown filters |
| `rowClickPath` | string | No | - | Navigation path (e.g., "/risks/{id}") |
| `exportFilename` | string | No | "export.csv" | Export filename |
| `editConfig` | EditConfig | No | - | Enable editing |
| `enableViewSwitcher` | boolean | No | false | Show view mode toggle |
| `defaultViewMode` | ViewMode | No | "table" | Initial view (table/card/list) |
| `enableRowSelection` | boolean | No | false | Show row checkboxes |
| `enableSorting` | boolean | No | true | Enable column sorting |
| `defaultSortColumn` | string | No | - | Initial sort column |
| `defaultSortDirection` | 'asc' \| 'desc' | No | 'asc' | Initial sort direction |
| `rowActions` | RowActionConfig[] | No | - | Custom row actions |
| `onDelete` | boolean | No | false | Enable delete action |

### Advanced Features

| Property | Type | Description |
|----------|------|-------------|
| `enableVirtualScroll` | boolean | Enable virtual scrolling for large datasets |
| `virtualScrollHeight` | number | Height in pixels (default: 600) |
| `enableMultiColumnSort` | boolean | Enable Shift+Click multi-column sorting |
| `enableFuzzySearch` | boolean | Enable Fuse.js fuzzy search |
| `fuzzySearchThreshold` | number | Fuzziness (0.0-1.0, default: 0.3) |
| `enableInlineCellEdit` | boolean | Enable double-click inline editing |
| `bulkActions` | BulkAction[] | Bulk action configurations |
| `advancedFilters` | AdvancedFilterConfig[] | Date range, number range filters |

### ColumnConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Data field name |
| `label` | string | Yes | Column header text |
| `defaultVisible` | boolean | Yes | Show by default |
| `type` | 'text' \| 'date' \| 'badge' \| 'number' \| 'email' | No | Basic rendering type |
| `renderConfig` | RenderConfig | No | Advanced rendering |
| `sortable` | boolean | No | Allow sorting (default: true) |
| `isPrimary` | boolean | No | Primary field for card view |
| `isSecondary` | boolean | No | Secondary field for card view |

### EditConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `tableName` | string | Yes | Database table name |
| `editableFields` | string[] | Yes | Fields that can be edited |

### BulkAction

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `label` | string | Yes | Button text |
| `icon` | ReactNode | No | Button icon |
| `variant` | 'default' \| 'destructive' | No | Button style |
| `onClick` | (ids) => Promise<void> | Yes | Action handler |
| `disabled` | (ids) => boolean | No | Disable condition |

---

## API Integration

The table uses the following API endpoints:

### Table Update (Editing)
```typescript
POST /api/table-update
{
  "table": "table_name",
  "id": "row_id",
  "data": { "field": "new_value" }
}
```

Used by both modal editing and inline cell editing.

---

## Performance

- **Small datasets (< 1,000 rows)**: Standard rendering
- **Medium datasets (1,000 - 10,000 rows)**: Consider virtual scrolling
- **Large datasets (10,000+ rows)**: Use `enableVirtualScroll: true`

Virtual scrolling renders only visible rows, dramatically improving performance.

---

## Migration Guide

### From Modal-Only to Inline Editing

**Before:**
```typescript
const config: GenericTableConfig = {
  editConfig: {
    tableName: 'risks',
    editableFields: ['description', 'status'],
  },
}
```

**After:**
```typescript
const config: GenericTableConfig = {
  editConfig: {
    tableName: 'risks',
    editableFields: ['description', 'status'],
  },
  enableInlineCellEdit: true, // Add this line
}
```

Both modal and inline editing work together. Users can:
- Double-click cells for quick inline edits
- Use Edit button for multi-field edits in modal

---

## Troubleshooting

### Inline Editing Not Working
1. Check `enableInlineCellEdit: true` is set
2. Verify `editConfig` is defined
3. Ensure field is in `editableFields` array
4. System fields (id, created_at, updated_at) cannot be edited

### Virtual Scrolling Performance Issues
1. Increase `overscan` value (default: 5)
2. Adjust `virtualScrollHeight` to match viewport
3. Check for expensive render operations in `renderConfig`

### Search Not Finding Results
1. Verify fields are in `searchFields` array
2. Try enabling `enableFuzzySearch: true` for typo tolerance
3. Check data types (search converts all to strings)

---

## TypeScript Types

All types are exported from the component:

```typescript
import {
  GenericDataTable,
  type GenericTableConfig,
  type ColumnConfig,
  type EditConfig,
  type BulkAction,
  type RenderConfig,
} from '@/components/tables/generic-table-factory'
```

---

## Examples in Codebase

See these files for working examples:
- [frontend/src/app/(tables)/risks/page.tsx](../../app/(tables)/risks/page.tsx)
- [frontend/src/app/(tables)/opportunities/page.tsx](../../app/(tables)/opportunities/page.tsx)
- [frontend/src/app/(tables)/notes/page.tsx](../../app/(tables)/notes/page.tsx)

---

## Contributing

When adding new features:
1. Update this README.md file (single source of truth)
2. Add TypeScript types to the component
3. Update examples section
4. Add to feature list with description
5. Do NOT create separate documentation files

---

## Version History

- **v1.0** - Initial release with basic table features
- **v1.1** - Added virtual scrolling and multi-column sorting
- **v1.2** - Added fuzzy search and bulk actions
- **v1.3** - Added inline cell editing (current)

---

## License

Internal use only - Alleato-Procore construction management system.
