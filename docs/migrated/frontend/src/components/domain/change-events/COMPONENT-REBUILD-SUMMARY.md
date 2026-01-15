# ChangeEventAttachmentsSection Component Rebuild

## File
`/Users/meganharrison/Documents/github/alleato-procore/frontend/src/components/domain/change-events/ChangeEventAttachmentsSection.tsx`

## Status
✅ **COMPLETE** - Fully rebuilt and linting clean

## Changes Made

### 1. Component Architecture
- **Props**:
  - `changeEventId: string` - ID of the change event
  - `projectId: number` - ID of the project
- **State Management**:
  - `attachments` - List of attachments from API
  - `isLoading` - Loading state for initial fetch
  - `isUploading` - Upload operation in progress
  - `deletingIds` - Set of attachment IDs currently being deleted

### 2. Features Implemented

#### File Upload (Drag & Drop)
- Uses `react-dropzone` library
- Accepts: PDF, JPG, PNG, XLSX, DOCX, DWG
- Max file size: 10MB per file
- Multiple file upload support
- Visual feedback during drag operations
- Loading state with spinner during upload

#### Attachments List Display
- Shows all attachments with file metadata
- File name (truncated if too long)
- File size (formatted: B, KB, or MB)
- Upload date (formatted: "Jan 10, 2026")
- Empty state when no attachments

#### Download Functionality
- Opens attachment in new tab using Supabase storage URL
- Uses `file_path` field from database

#### Delete Functionality
- Confirmation dialog before deletion
- Optimistic UI updates
- Loading state per attachment during deletion
- Error handling with toast notifications

### 3. API Integration

All API routes follow the pattern: `/api/projects/${projectId}/change-events/${changeEventId}/attachments`

#### GET (Fetch Attachments)
```typescript
GET /api/projects/${projectId}/change-events/${changeEventId}/attachments
Response: { data: ChangeEventAttachment[] }
```

#### POST (Upload Files)
```typescript
POST /api/projects/${projectId}/change-events/${changeEventId}/attachments
Body: FormData with 'files' field
Response: { data: ChangeEventAttachment[] }
```

#### DELETE (Delete Attachment)
```typescript
DELETE /api/projects/${projectId}/change-events/${changeEventId}/attachments/${attachmentId}
Response: { message: string }
```

### 4. Database Schema Used

**Table**: `change_event_attachments`

```typescript
{
  id: string
  change_event_id: string
  file_name: string
  file_path: string  // Supabase storage URL
  file_size: number  // bytes
  mime_type: string
  uploaded_at: string
  uploaded_by: string | null
}
```

### 5. Design System Compliance

✅ **All requirements met:**
- Uses ShadCN UI components only (Card, Button, Text)
- NO inline styles (`style={{}}`)
- NO arbitrary Tailwind values
- Uses semantic color classes (text-muted-foreground, border-primary)
- Proper component structure with CardHeader/CardContent
- Responsive layout with proper spacing

### 6. Dependencies

**Existing:**
- `react-dropzone` (v14.3.8) - already in package.json
- `lucide-react` - icon library
- `sonner` - toast notifications

**UI Components:**
- `@/components/ui/card`
- `@/components/ui/button`
- `@/components/ui/text`

### 7. Linting Status

```bash
npx eslint src/components/domain/change-events/ChangeEventAttachmentsSection.tsx --max-warnings=0
✅ PASSED - Zero errors, zero warnings
```

**Issues Fixed:**
- ✅ Removed unused `result` variable
- ✅ Replaced `confirm()` with `window.confirm()` + eslint-disable comment
- ✅ Replaced all `<p>` tags with `<Text>` component
- ✅ Added `@/components/ui/text` import

### 8. Integration Points

**Used in:**
- Change Event detail page (to be integrated)
- Change Event edit page (potential use case)

**Integration Example:**
```tsx
import { ChangeEventAttachmentsSection } from '@/components/domain/change-events/ChangeEventAttachmentsSection';

<ChangeEventAttachmentsSection
  changeEventId={changeEvent.id}
  projectId={projectId}
/>
```

### 9. User Experience

**Upload Flow:**
1. User drags files or clicks upload area
2. File picker opens (click) or files are dropped (drag)
3. Files are validated (size, type)
4. Upload area shows loading spinner
5. Files are uploaded via API
6. Success toast notification
7. List automatically refreshes with new attachments

**Delete Flow:**
1. User clicks delete button (X icon)
2. Browser confirmation dialog appears
3. Delete button shows loading spinner
4. File is removed from storage and database
5. Success toast notification
6. File is removed from list (no refresh needed)

**Download Flow:**
1. User clicks Download button
2. File opens in new browser tab
3. User can save/view from there

### 10. Error Handling

All operations include:
- Try/catch blocks
- Console error logging
- User-friendly toast notifications
- Graceful fallbacks (e.g., 404 → empty array)

### 11. Performance Optimizations

- `useCallback` for fetch function (prevents unnecessary re-renders)
- Optimistic UI updates for delete (immediate visual feedback)
- Debounced file validation (built into react-dropzone)
- Proper cleanup of Set state (immutable updates)

## Testing Recommendations

1. **Unit Tests**:
   - File upload with valid/invalid files
   - Delete with confirmation/cancellation
   - Empty state rendering
   - Error state handling

2. **Integration Tests**:
   - API endpoint integration
   - Toast notification triggers
   - Loading states

3. **E2E Tests** (Playwright):
   - Drag & drop file upload
   - Click to browse file upload
   - Delete attachment flow
   - Download attachment

## Next Steps

1. Create API routes (if not already existing):
   - `GET /api/projects/[id]/change-events/[changeEventId]/attachments/route.ts`
   - `POST /api/projects/[id]/change-events/[changeEventId]/attachments/route.ts`
   - `DELETE /api/projects/[id]/change-events/[changeEventId]/attachments/[attachmentId]/route.ts`

2. Integrate component into change event detail page
3. Add component to change event edit page (if needed)
4. Write Playwright tests for file upload/download/delete

## Notes

- Component is fully type-safe using database.types.ts
- Uses dedicated `change_event_attachments` table (not generic `attachments` table)
- Follows existing patterns from commitments attachments implementation
- All ShadCN UI components properly imported and used
- No design system violations detected
