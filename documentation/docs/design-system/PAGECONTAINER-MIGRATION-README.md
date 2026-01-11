# PageContainer → Design System Layouts Migration

## Overview

This migration script automates the conversion from the legacy `PageContainer` component to the new design system layout components (`TableLayout`, `FormLayout`, `DashboardLayout`).

## What the Script Does

### 1. **Identifies Files**
- Scans all `.tsx` files in `frontend/src/app`
- Detects files using `PageContainer`
- Builds a list of files to migrate

### 2. **Determines Layout Type**
The script uses intelligent rules to determine the appropriate layout:

#### Path-Based Rules (checked first):
- `/(tables)/` → `TableLayout`
- `/(forms)/` → `FormLayout`
- `/dashboard` → `DashboardLayout`
- `/profile` → `FormLayout`
- `/pipeline` → `TableLayout`
- `/directory/` → `TableLayout`
- `/[projectId]/(contracts|commitments|meetings|etc)` → `TableLayout`
- `/[projectId]/*/edit` → `FormLayout`
- `/[projectId]/*/new` → `FormLayout`

#### Content-Based Rules (fallback):
- Contains `DataTable`, `Table`, `useTable` → `TableLayout`
- Contains `Form`, `FormField`, `useForm` → `FormLayout`
- Contains `Dashboard`, `Chart`, `Metric` → `DashboardLayout`

#### Default:
- If no rules match → `TableLayout`

### 3. **Updates Imports**
- Replaces `import { PageContainer } from '@/components/layout'`
- With appropriate: `import { TableLayout } from '@/components/layouts'`
- Preserves other imports from `@/components/layout`

### 4. **Replaces Component Usage**
- `<PageContainer>` → `<TableLayout>` (or appropriate layout)
- Adds `density="standard"` to `TableLayout` by default
- Preserves existing props

### 5. **Updates Spacing Classes**
Converts hard-coded Tailwind classes to CSS variables:

| Before | After |
|--------|-------|
| `space-y-4` | `space-y-[var(--spacing-group)]` |
| `space-y-6/8` | `space-y-[var(--spacing-section)]` |
| `gap-4` | `gap-[var(--spacing-group)]` |
| `gap-6/8` | `gap-[var(--spacing-section)]` |
| `p-4/6/8` | `p-[var(--spacing-page)]` |
| `px-4/6/8` | `px-[var(--spacing-page)]` |
| `py-4` | `py-[var(--spacing-group)]` |
| `py-6/8` | `py-[var(--spacing-section)]` |

## Usage

### 1. Run the Script
```bash
cd /Users/meganharrison/Documents/github/alleato-procore
node scripts/migrate-pagecontainer-to-layouts.js
```

### 2. Review Output
The script provides a detailed report:
- Summary of files processed by layout type
- List of processed files with their assigned layouts
- Any errors encountered
- Spacing conversions applied

### 3. Verify Changes
```bash
# Review all changes
git diff

# Check for TypeScript errors
npm run typecheck --prefix frontend

# Check for lint errors  
npm run lint --prefix frontend

# Run quality check (combines both)
npm run quality --prefix frontend
```

### 4. Test the Application
- Navigate through migrated pages
- Verify spacing looks correct
- Check responsive behavior
- Test table density controls (for TableLayout pages)

## Manual Verification Checklist

After running the script, verify:

- [ ] **Imports are correct** - Each file imports from `@/components/layouts`
- [ ] **Layout assignments make sense** - Tables use TableLayout, forms use FormLayout, etc.
- [ ] **Spacing variables work** - CSS variables are applied correctly
- [ ] **No TypeScript errors** - `npm run typecheck` passes
- [ ] **No lint errors** - `npm run lint` passes
- [ ] **Visual appearance** - Pages look correct in the browser

## Rollback

If needed, you can rollback with:
```bash
git checkout -- frontend/src/app
```

## Example Transformations

### Table Page (Before)
```tsx
import { PageContainer, PageHeader } from '@/components/layout';

export default function ClientsPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <DataTable />
      </div>
    </PageContainer>
  );
}
```

### Table Page (After)
```tsx
import { PageHeader } from '@/components/layout';
import { TableLayout } from '@/components/layouts';

export default function ClientsPage() {
  return (
    <TableLayout density="standard">
      <div className="space-y-[var(--spacing-section)]">
        <DataTable />
      </div>
    </TableLayout>
  );
}
```

### Form Page (Before)
```tsx
import { PageContainer, PageHeader } from '@/components/layout';

export default function NewContractPage() {
  return (
    <PageContainer>
      <div className="p-6">
        <ContractForm />
      </div>
    </PageContainer>
  );
}
```

### Form Page (After)
```tsx
import { PageHeader } from '@/components/layout';
import { FormLayout } from '@/components/layouts';

export default function NewContractPage() {
  return (
    <FormLayout>
      <div className="p-[var(--spacing-page)]">
        <ContractForm />
      </div>
    </FormLayout>
  );
}
```

## Troubleshooting

### Script won't run
- Ensure Node.js is installed
- Check file permissions: `chmod +x scripts/migrate-pagecontainer-to-layouts.js`

### Import errors after migration
- The script assumes `@/components/layouts` exports exist
- Verify the layouts are properly exported in `frontend/src/components/layouts/index.ts`

### Spacing looks wrong
- CSS variables are defined by the layout components
- Ensure the layout components are setting the variables correctly
- Check that `frontend/src/styles/table-density.css` is imported in root layout

### Wrong layout assigned
- Review the path/content rules in the script
- You can manually adjust any incorrect assignments
- Consider updating the rules for future migrations

## Notes

- The script is idempotent - running it multiple times is safe
- It only processes files that currently use `PageContainer`
- Manual review is always recommended after automated migrations
- The script preserves all existing props on PageContainer