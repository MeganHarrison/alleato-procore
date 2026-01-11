# Worker Completion: Rebuild Commitments Attachments Route

## Task ID
commitments-attachments-rebuild

## Timestamp
2026-01-10T[current-time]

## Files Modified
- `/Users/meganharrison/Documents/github/alleato-procore/frontend/src/app/api/commitments/[id]/attachments/route.ts` (rebuilt from corrupted state)

## Changes Made

### Summary
Completely rebuilt the corrupted commitment attachments API route file with proper structure and formatting.

### Key Changes
1. **Fixed Structure**:
   - Proper imports: `NextRequest`, `NextResponse`, `z` (Zod)
   - Async params pattern: `{ params: Promise<{ id: string }> }`
   - RouteParams interface for type safety
   - Proper syntax (no missing brackets, proper catch blocks)

2. **GET Endpoint** (List Attachments):
   - Verifies commitment exists first
   - Queries generic `attachments` table (not commitment_attachments)
   - Filters by: `attached_to_id = commitmentId` AND `attached_to_table = 'commitments'`
   - Includes user relationship via foreign key
   - Returns formatted response with `_links` (HATEOAS pattern)

3. **POST Endpoint** (Upload Attachment):
   - Validates user authentication
   - Verifies commitment exists
   - Validates file metadata with Zod schema
   - Uploads to Supabase Storage: `project-files` bucket
   - Storage path: `commitments/{project_id}/{commitment_id}/{unique_filename}`
   - Creates record in `attachments` table with proper fields
   - Updates commitment timestamp
   - Includes cleanup on failure (removes uploaded file if DB insert fails)

4. **DELETE Endpoint** (Bulk Delete):
   - Validates user authentication
   - Verifies commitment exists
   - Expects array of attachment IDs
   - Deletes from storage first (extracts path from URL)
   - Deletes database records
   - Updates commitment timestamp

### Database Schema Used
```typescript
attachments {
  id: string (uuid, PK)
  attached_to_id: string (commitment ID)
  attached_to_table: string ('commitments')
  project_id: number
  file_name: string
  url: string (public URL from storage)
  uploaded_at: string (timestamp)
  uploaded_by: string (user ID, FK)
}
```

### Storage Bucket
- Bucket: `project-files`
- Path pattern: `commitments/{project_id}/{commitment_id}/{timestamp}_{random}.{ext}`

### Validation Schema
```typescript
createAttachmentSchema = z.object({
  fileName: z.string().max(255),
  filePath: z.string(),
  fileSize: z.number().positive(),
  mimeType: z.string().max(100),
})
```

## Ready for Verification
YES

## Quality Check
TypeScript compilation: PASS (no errors in route file)
ESLint: PASS (no violations)

## Notes for Verifier

1. **Pattern Consistency**: Route follows the exact pattern from change-events attachments endpoint:
   - Same structure (GET, POST, DELETE)
   - Same response format with `_links`
   - Same error handling
   - Same storage bucket and cleanup patterns

2. **Key Differences from Change Events**:
   - Uses generic `attachments` table (not dedicated table)
   - No audit log/history entries (commitments table doesn't have history tracking)
   - No `commitment_attachments` table (uses polymorphic attachments pattern)

3. **Testing Recommendations**:
   - Test GET with valid/invalid commitment IDs
   - Test POST with file upload (multipart form data)
   - Test DELETE with bulk attachment IDs
   - Verify storage cleanup on POST failure
   - Verify commitment `updated_at` timestamp changes

4. **Potential Issues to Check**:
   - Verify `project-files` bucket exists and has proper RLS policies
   - Verify `attachments` table has proper RLS policies
   - Test foreign key relationship: `attachments.uploaded_by → users.id`
   - Verify URL extraction regex in DELETE works with actual Supabase URLs

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/commitments/{id}/attachments` | List all attachments for commitment |
| POST | `/api/commitments/{id}/attachments` | Upload new attachment (multipart/form-data) |
| DELETE | `/api/commitments/{id}/attachments` | Bulk delete attachments (JSON body: `{attachmentIds: string[]}`) |

## Example Responses

**GET Success (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "commitmentId": "uuid",
      "fileName": "document.pdf",
      "url": "https://...",
      "uploadedBy": { "id": "uuid", "email": "user@example.com" },
      "uploadedAt": "2026-01-10T...",
      "downloadUrl": "/api/commitments/{id}/attachments/{id}/download",
      "_links": { ... }
    }
  ],
  "_links": { ... }
}
```

**POST Success (201)**:
```json
{
  "id": "uuid",
  "commitmentId": "uuid",
  "fileName": "document.pdf",
  "url": "https://...",
  "uploadedBy": { "id": "uuid", "email": "user@example.com" },
  "uploadedAt": "2026-01-10T...",
  "publicUrl": "https://...",
  "downloadUrl": "/api/commitments/{id}/attachments/{id}/download",
  "_links": { ... }
}
```

**DELETE Success (200)**:
```json
{
  "message": "3 attachment(s) deleted successfully"
}
```

## Completion Status
✅ File rebuilt with proper structure
✅ TypeScript compilation passes
✅ Follows established patterns
✅ Ready for verification testing
