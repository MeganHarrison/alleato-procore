# Table Pages System

## The Simplest Way to Create Table Pages

This folder contains all simple data table pages. The TablePageWrapper component provides:
- ✅ Consistent PageHeader with title and description
- ✅ PageContainer layout with proper spacing
- ✅ ONE place to change layout for ALL table pages

## How to Create a New Table Page

### Step 1: Create the folder and file
```bash
mkdir -p /Users/meganharrison/Documents/github/alleato-procore/frontend/src/app/\(tables\)/your-table-name
touch /Users/meganharrison/Documents/github/alleato-procore/frontend/src/app/\(tables\)/your-table-name/page.tsx
```

### Step 2: Copy this template

```typescript
import { createClient } from '@/lib/supabase/server'
import { GenericDataTable, type GenericTableConfig } from '@/components/tables/generic-table-factory'
import { TablePageWrapper } from '@/components/tables/table-page-wrapper'

const PAGE_TITLE = 'Your Table Name'
const PAGE_DESCRIPTION = 'Description of what this table shows'

const config: GenericTableConfig = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  searchFields: ['column1', 'column2'],
  exportFilename: 'your-table-export.csv',
  editConfig: {
    tableName: 'your_table_name',
    editableFields: ['column1', 'column2'],
  },
  columns: [
    {
      id: 'column1',
      label: 'Column 1',
      defaultVisible: true,
      type: 'text',
    },
    // Add more columns...
  ],
  filters: [],
}

export default async function YourTablePage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('your_table_name')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching data:', error)
    return (
      <TablePageWrapper title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
        <div className="text-center text-red-600 p-6">
          Error loading data. Please try again later.
        </div>
      </TablePageWrapper>
    )
  }

  return (
    <TablePageWrapper title={PAGE_TITLE} description={PAGE_DESCRIPTION}>
      <GenericDataTable data={data || []} config={config} />
    </TablePageWrapper>
  )
}
```

### Step 3: Update the values
1. Change PAGE_TITLE and PAGE_DESCRIPTION
2. Update tableName in config and Supabase query
3. Configure your columns
4. Add filters if needed

### Step 4: Done!
Your page is now live at `/your-table-name`

## What You DON'T Need to Do

❌ No manual PageHeader markup
❌ No PageContainer setup
❌ No layout/styling code
❌ No custom components for simple tables

All layout is handled by TablePageWrapper!

## Column Types

- `text` - Plain text
- `date` - Formatted date
- `badge` - Colored badge with variants
- `number` - Numeric values
- `currency` - Money (uses renderConfig.prefix)

## Badge Variants

```typescript
renderConfig: {
  type: 'badge',
  variantMap: {
    'active': 'default',        // Blue
    'completed': 'outline',     // Gray border
    'error': 'destructive',     // Red
    'pending': 'secondary',     // Gray fill
  },
  defaultVariant: 'outline',
}
```

## Adding Filters

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

## Architecture

**ONE wrapper component controls everything:**
- `/components/tables/table-page-wrapper.tsx` - Renders PageHeader + PageContainer

**Pages just provide data:**
- Title and description constants
- Table config
- Supabase query
- Wrap in TablePageWrapper

This means changing layout across ALL table pages = editing ONE file.
