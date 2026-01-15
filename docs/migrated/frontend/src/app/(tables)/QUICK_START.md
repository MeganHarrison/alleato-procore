# Quick Start - Create a Table Page in 2 Minutes

## The 3-Line Summary
1. Copy `TABLE_TEMPLATE.tsx.example` to `your-table/page.tsx`
2. Change table name and columns
3. Done!

## Example: Creating a "Daily Logs" Page

```bash
# 1. Create the folder and file
mkdir -p /Users/meganharrison/Documents/github/alleato-procore/frontend/src/app/\(tables\)/daily-logs
cp TABLE_TEMPLATE.tsx.example daily-logs/page.tsx

# 2. Edit daily-logs/page.tsx
```

```typescript
import type { GenericTableConfig } from '@/components/tables/generic-table-factory'
import { SimpleTablePage } from '@/components/tables/simple-table-page'

const config: GenericTableConfig = {
  title: 'Daily Logs',
  description: 'Project daily activity logs',
  searchFields: ['notes', 'weather'],
  exportFilename: 'daily-logs-export.csv',
  editConfig: {
    tableName: 'daily_logs',
    editableFields: ['notes', 'weather', 'temperature'],
  },
  columns: [
    { id: 'date', label: 'Date', defaultVisible: true, type: 'date' },
    { id: 'weather', label: 'Weather', defaultVisible: true, type: 'text' },
    { id: 'notes', label: 'Notes', defaultVisible: true, type: 'text' },
  ],
  filters: [],
}

export default function DailyLogsPage() {
  return <SimpleTablePage tableName="daily_logs" config={config} />
}
```

## That's It!

Your page is now live at: `http://localhost:3000/daily-logs`

It automatically has:
- ✅ Professional header with title and description
- ✅ Data table with search, sort, filter
- ✅ Inline editing
- ✅ CSV export
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design

## Common Column Configs

### Text Field
```typescript
{ id: 'name', label: 'Name', defaultVisible: true, type: 'text' }
```

### Date Field
```typescript
{ id: 'created_at', label: 'Created', defaultVisible: true, type: 'date' }
```

### Status Badge
```typescript
{
  id: 'status',
  label: 'Status',
  defaultVisible: true,
  type: 'badge',
  renderConfig: {
    type: 'badge',
    variantMap: {
      'active': 'default',
      'completed': 'outline',
      'error': 'destructive',
    },
    defaultVariant: 'outline',
  },
}
```

### Currency
```typescript
{
  id: 'amount',
  label: 'Amount',
  defaultVisible: true,
  renderConfig: {
    type: 'currency',
    prefix: '$',
  },
}
```

## Pro Tips

### Make a field non-editable
Set `editable: false` on the column:
```typescript
{ id: 'id', label: 'ID', defaultVisible: true, type: 'text', editable: false }
```

### Add filters
```typescript
filters: [
  {
    id: 'status',
    label: 'Status',
    field: 'status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
]
```

### Link to detail page
```typescript
rowClickPath: '/daily-logs/{id}'
```

## Need Help?

Check `README.md` for full documentation.
