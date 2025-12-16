# Generic Table Editing Feature

## Overview

All table pages in the application now support inline editing through a dialog-based interface. This feature is powered by the `GenericDataTable` component with an optional `editConfig` property.

## How It Works

### Architecture

1. **Generic Table Factory** (`generic-table-factory.tsx`): Core component that renders tables with optional edit functionality
2. **API Route** (`/api/table-update`): Server-side endpoint that handles updates via Supabase
3. **Table Page Configs**: Each table page defines which fields are editable via `editConfig`

### User Flow

1. User clicks the pencil icon in the "Actions" column
2. Edit dialog opens with form fields for all editable columns
3. User modifies fields and clicks "Save Changes"
4. API request updates Supabase database
5. Local table data updates optimistically
6. Toast notification confirms success or shows error

## Configuration

### Adding Edit Support to a Table

To enable editing on any table page, add an `editConfig` object to your `GenericTableConfig`:

```typescript
const config: GenericTableConfig = {
  title: 'My Table',
  description: 'Description here',
  // ... other config
  editConfig: {
    tableName: 'supabase_table_name',  // Must match actual Supabase table
    editableFields: ['field1', 'field2', 'field3'],  // Column IDs that can be edited
  },
  columns: [
    // ... column definitions
  ],
}
```

### Example: Decisions Table

```typescript
const config: GenericTableConfig = {
  title: 'Decisions',
  description: 'Track important project and business decisions',
  searchFields: ['description', 'impact', 'owner_name', 'rationale'],
  exportFilename: 'decisions-export.csv',
  editConfig: {
    tableName: 'decisions',
    editableFields: [
      'description',
      'status',
      'impact',
      'owner_name',
      'owner_email',
      'rationale',
      'effective_date',
    ],
  },
  columns: [
    // ... column definitions
  ],
}
```

## Supported Field Types

The edit dialog automatically renders appropriate inputs based on column type:

| Column Type | Input Rendered | Example |
|-------------|----------------|---------|
| `text` | `<Input type="text">` | Title, description |
| `email` | `<Input type="email">` | Email addresses |
| `number` | `<Input type="number">` | IDs, counts, amounts |
| `date` | `<Input type="date">` | Date fields |
| `badge` (with variantMap) | `<Select>` | Status dropdowns |
| Long text fields | `<Textarea>` | Descriptions, notes |
| Default | `<Input type="text">` | Fallback for unknown types |

### Badge/Select Fields

For columns with a `badge` renderConfig that includes a `variantMap`, the edit dialog automatically creates a dropdown:

```typescript
{
  id: 'status',
  label: 'Status',
  defaultVisible: true,
  renderConfig: {
    type: 'badge',
    variantMap: {
      'pending': 'outline',
      'approved': 'default',
      'rejected': 'outline',
    },
    defaultVariant: 'outline',
  },
}
```

This will render as a `<Select>` with options: Pending, Approved, Rejected

## Protected Fields

The following fields are automatically excluded from editing and updates:

- `id` - Primary key, immutable
- `created_at` - Creation timestamp, immutable
- `updated_at` - Automatically managed by Supabase

## API Route

### Endpoint: `/api/table-update`

**Method**: `POST`

**Request Body**:
```json
{
  "table": "supabase_table_name",
  "id": "record-uuid",
  "data": {
    "field1": "new value",
    "field2": "new value"
  }
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "record-uuid",
    "field1": "new value",
    "field2": "new value",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

**Error Response** (400/500):
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Tables with Editing Enabled

The following tables currently support editing:

1. **Risks** (`/risks`) - Risk management entries
2. **Opportunities** (`/opportunities`) - Business opportunities
3. **Decisions** (`/decisions`) - Project decisions
4. **Issues** (`/issues`) - Issue tracking
5. **Daily Logs** (`/daily-logs`) - Construction daily logs
6. **Notes** (`/notes`) - Project notes
7. **Meeting Segments** (`/meeting-segments`) - AI-analyzed meeting chunks
8. **Insights** (`/insights`) - AI-generated insights
9. **Daily Reports** (`/daily-reports`) - Daily recap summaries

## Security Considerations

1. **Server-Side Validation**: All updates go through the API route which uses the server-side Supabase client
2. **RLS Policies**: Supabase Row Level Security (RLS) policies still apply to all updates
3. **Field Filtering**: The API route automatically removes protected fields (`id`, `created_at`, `updated_at`)
4. **No Direct Client Updates**: Client never directly updates Supabase; always goes through API

## User Experience Features

### Optimistic Updates
After a successful save, the local table data updates immediately without requiring a page refresh.

### Toast Notifications
- **Success**: Green toast with "Changes saved successfully"
- **Error**: Red toast with error message and "Please try again"

### Loading States
- Edit dialog shows "Saving..." and disables buttons while saving
- Save button shows disabled state during API call

### Click Handling
- Edit button click prevents row click event from firing
- Dialog can be closed with Cancel button or X icon

## Troubleshooting

### Edit Button Not Showing
- Verify `editConfig` is defined in table config
- Check that `editConfig.tableName` matches actual Supabase table name
- Ensure `editConfig.editableFields` is a non-empty array

### Save Failing
- Check browser console for API errors
- Verify Supabase table name is correct
- Check Supabase RLS policies allow updates for current user
- Ensure field names in `editableFields` match actual column names

### Field Not Editable
- Confirm field ID is in `editableFields` array
- Protected fields (`id`, `created_at`, `updated_at`) cannot be edited
- Case-sensitive: field IDs must match exactly

## Future Enhancements

Possible improvements for future iterations:

1. **Bulk Editing**: Select multiple rows and edit common fields
2. **Field Validation**: Client-side validation rules in config
3. **Custom Inputs**: Support for custom input components (file uploads, rich text, etc.)
4. **Audit Trail**: Track who edited what and when
5. **Undo/Redo**: Revert changes within session
6. **Inline Editing**: Edit directly in table cells without dialog
7. **Conditional Fields**: Show/hide fields based on other field values

## Related Files

- `frontend/src/components/tables/generic-table-factory.tsx` - Main component
- `frontend/src/app/api/table-update/route.ts` - API endpoint
- `frontend/src/app/(tables)/*/page.tsx` - Individual table pages with configs
- `frontend/src/app/(project-mgmt)/risks/page.tsx` - Risks table with edit config

---

**Last Updated**: 2025-12-16
**Feature Version**: 1.0
