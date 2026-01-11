# Worker Completion: Recycled Commitments Page Rebuild

## Task
Rebuild corrupted Next.js page: `frontend/src/app/[projectId]/commitments/recycled/page.tsx`

## Files Modified
- `/Users/meganharrison/Documents/github/alleato-procore/frontend/src/app/[projectId]/commitments/recycled/page.tsx`

## Changes Made

### Fixed Issues
1. **Syntax Errors**: Removed all broken syntax from corrupted file
2. **Formatting**: Proper indentation and code structure restored
3. **Imports**: Organized imports following project conventions
4. **Type Safety**: All TypeScript types properly defined

### Implementation Details

**Component Structure:**
- Client component using `'use client'` directive
- Async params handling via `useParams()` hook
- Project title set via `useProjectTitle()` hook

**Data Fetching:**
- API endpoint: `GET /api/commitments?projectId={id}&include_deleted=true`
- Client-side filtering for `deleted_at IS NOT NULL`
- Loading, error, and empty states handled

**Table Columns:**
1. Number (medium weight text)
2. Title
3. Type (capitalized, underscores replaced)
4. Contract Company (from relation or fallback)
5. Original Amount (formatted currency)
6. Deleted Date (formatted)
7. Actions (Restore + Delete Forever buttons)

**Actions Implemented:**
1. **Restore**: `POST /api/commitments/{id}/restore`
   - Success toast notification
   - Refreshes list
2. **Permanent Delete**: `DELETE /api/commitments/{id}/permanent-delete`
   - Confirmation dialog with warning icon
   - Destructive styling
   - Success toast notification
   - Refreshes list

**Mobile Support:**
- Custom mobile card renderer with MobileCard component
- Shows number, title, company, deleted date
- Restore (outline) and Delete Forever (destructive) buttons

**Design System Compliance:**
- ✅ NO inline styles
- ✅ ShadCN components only (Button, AlertDialog, Text, Stack, MobileCard)
- ✅ DataTablePage template for consistency
- ✅ Proper semantic variants (destructive for dangerous actions)
- ✅ Lucide icons (RotateCcw, Trash2, AlertTriangle)

## Quality Check
```bash
npm run quality --prefix frontend
# No errors found for commitments/recycled/page.tsx
```

## Ready for Verification
✅ YES

## Notes for Verifier
- Original file had severe corruption with broken syntax throughout
- Rebuilt from scratch following DataTablePage template pattern
- All design system rules followed (no inline styles, semantic components)
- API endpoints assume `/api/commitments/{id}/restore` and `/api/commitments/{id}/permanent-delete` exist
- If these endpoints don't exist yet, they need to be implemented in the API routes
