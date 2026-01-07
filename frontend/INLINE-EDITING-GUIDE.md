# Inline Cell Editing - Implementation Guide

## Overview

The Generic Table Factory now supports **inline cell editing**, allowing users to double-click cells and edit them directly in the table without opening a modal dialog.

## Features

✅ **Double-click to edit** - Double-click any editable cell to start editing
✅ **Keyboard navigation** - Use Tab/Shift+Tab to move between cells while editing
✅ **Auto-save** - Press Enter or blur (click away) to save changes
✅ **Cancel** - Press Escape to cancel editing
✅ **Visual feedback** - Loading spinner shows when saving
✅ **Respects editConfig** - Only fields in `editableFields` are editable
✅ **System fields protected** - `id`, `created_at`, `updated_at` cannot be edited

## How to Enable

Add `enableInlineCellEdit: true` to your table configuration:

```typescript
const config: GenericTableConfig = {
  title: 'Risks',
  columns: [...],
  searchFields: [...],

  // Required: editConfig must be present
  editConfig: {
    tableName: 'risks',
    editableFields: ['description', 'category', 'status', 'owner_name'],
  },

  // Enable inline editing
  enableInlineCellEdit: true,
}
```

## Requirements

1. **editConfig must be defined** - The table needs to know which table and fields are editable
2. **editableFields list** - Only fields in this array will be editable
3. **API endpoint** - The table uses `/api/table-update` to save changes

## User Experience

### Starting Edit Mode
- Double-click any cell in an editable column
- The cell transforms into an input field
- The current value is selected for easy replacement

### While Editing
- **Type** to change the value
- **Tab** - Save and move to next editable cell
- **Shift+Tab** - Save and move to previous editable cell
- **Enter** - Save and exit edit mode
- **Escape** - Cancel without saving
- **Click away** (blur) - Save and exit edit mode

### Visual Indicators
- Editable cells show `cursor-text` on hover
- Active editing shows a focused input with border
- Saving shows a loading spinner overlay

## Example Usage

### Basic Setup

```typescript
import { GenericDataTable, type GenericTableConfig } from '@/components/tables/generic-table-factory'

const config: GenericTableConfig = {
  title: 'Project Risks',
  description: 'Track and manage risks',

  columns: [
    {
      id: 'description',
      label: 'Description',
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
          'open': 'destructive',
          'closed': 'default',
        },
      },
    },
    {
      id: 'owner_name',
      label: 'Owner',
      defaultVisible: true,
    },
  ],

  searchFields: ['description', 'owner_name'],

  editConfig: {
    tableName: 'risks',
    editableFields: ['description', 'status', 'owner_name'],
  },

  enableInlineCellEdit: true,
}

export default function RisksPage() {
  return (
    <div>
      <GenericDataTable data={risks} config={config} />
    </div>
  )
}
```

### With Other Advanced Features

Inline editing works alongside other advanced features:

```typescript
const config: GenericTableConfig = {
  title: 'Tasks',
  columns: [...],
  searchFields: ['title', 'description'],

  // Inline editing
  enableInlineCellEdit: true,

  // Edit configuration
  editConfig: {
    tableName: 'tasks',
    editableFields: ['title', 'status', 'priority', 'assignee'],
  },

  // Other advanced features
  enableVirtualScroll: true,           // Virtual scrolling
  enableMultiColumnSort: true,         // Multi-column sorting
  enableFuzzySearch: true,             // Fuzzy search
  enableRowSelection: true,            // Row selection

  bulkActions: [                       // Bulk actions
    {
      id: 'mark-complete',
      label: 'Mark Complete',
      onClick: async (ids) => { /* ... */ }
    }
  ],
}
```

## Technical Details

### State Management

The component maintains the following state for inline editing:

- `editingCell` - Currently edited cell `{ rowId, columnId }` or null
- `editingValue` - Current value in the input field
- `isSavingCell` - Loading state while saving
- `editInputRef` - Reference to the input element for focus management

### API Integration

When a cell is saved, the component calls:

```typescript
POST /api/table-update
{
  "table": "risks",
  "id": "123",
  "data": {
    "description": "Updated risk description"
  }
}
```

The API should return:
- `200 OK` on success
- Error status on failure

### Keyboard Navigation Logic

The Tab navigation logic:
1. Finds all visible, editable columns
2. Filters out system fields (`id`, `created_at`, `updated_at`)
3. Navigates to next/previous editable cell
4. Wraps to next/previous row when reaching end of columns
5. Automatically saves before navigation

## Migration Guide

### From Modal Editing to Inline Editing

**Before:** Users clicked Edit button → Modal opened → Made changes → Clicked Save

```typescript
const config: GenericTableConfig = {
  editConfig: {
    tableName: 'risks',
    editableFields: ['description', 'status'],
  },
  // Modal editing (default)
}
```

**After:** Users double-click cell → Edit inline → Press Enter or Tab

```typescript
const config: GenericTableConfig = {
  editConfig: {
    tableName: 'risks',
    editableFields: ['description', 'status'],
  },
  // Enable inline editing
  enableInlineCellEdit: true,
}
```

**Note:** Both methods can coexist. Users can still use the Edit button for bulk field editing, while inline editing is faster for single-field updates.

## Performance

- **Minimal re-renders** - Only the edited cell re-renders during editing
- **Efficient focus management** - Uses ref for direct focus control
- **Optimistic updates** - Local state updates immediately while saving in background
- **Error handling** - Toast notifications for save errors

## Limitations

1. **Text input only** - Currently supports text input. Date pickers, dropdowns, etc. are roadmap items
2. **Single cell at a time** - Only one cell can be edited at once
3. **No validation UI** - Field validation must be handled by the API
4. **Simple data types** - Works best with strings and numbers

## Future Enhancements

Planned features for inline editing:

- [ ] Date picker for date fields
- [ ] Dropdown for select fields
- [ ] Textarea for long text
- [ ] Number input with validation
- [ ] Client-side validation before save
- [ ] Undo/redo support
- [ ] Cell-level permissions
- [ ] Custom edit components per column

## Testing

To test inline editing:

1. Visit any page using `GenericDataTable` with `enableInlineCellEdit: true`
2. Double-click an editable cell (e.g., description, status)
3. Type a new value
4. Press Enter or Tab to save
5. Press Escape to cancel
6. Click away to save and exit
7. Use Tab/Shift+Tab to navigate between cells

Example pages with inline editing:
- `/risks` - After adding `enableInlineCellEdit: true`
- `/opportunities` - After adding the flag
- `/tasks` - After adding the flag

## Troubleshooting

### Cell not editable
- Check that `enableInlineCellEdit: true` is in config
- Check that `editConfig` is defined
- Check that the field is in `editableFields` array
- System fields (id, created_at, updated_at) cannot be edited

### Save not working
- Check browser console for API errors
- Verify `/api/table-update` endpoint exists
- Check that `editConfig.tableName` is correct
- Verify database permissions

### Input not focusing
- Check for JavaScript errors in console
- Verify React ref is working correctly
- Check for conflicting click handlers

## Summary

Inline cell editing provides a fast, intuitive way for users to update data directly in the table. It's fully backward compatible and works alongside all other table features. Simply add `enableInlineCellEdit: true` to your config and users can start double-clicking cells to edit them.
