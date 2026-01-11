# Worker Completion: Rebuild Commitment Change Orders Route

## Task ID
commitment-change-orders-route-rebuild

## Timestamp
2026-01-10T17:30:00Z

## Files Modified
- `frontend/src/app/api/commitments/[id]/change-orders/route.ts` (completely rebuilt)

## Changes Made

### Original Issue
File was corrupted with malformed syntax:
- Missing `catch` keyword (line 19: `} catch error)` instead of `} catch (error)`)
- Incomplete formatting and line breaks
- Missing proper structure

### Rebuild Details

**GET Endpoint** (`/api/commitments/[id]/change-orders`):
- Lists all change orders for a commitment
- Queries `contract_change_orders` table with correct schema
- Returns formatted array with proper field mapping:
  - `change_order_number` → `number`
  - `description` → `title`
  - Status normalization (lowercase)
- Includes aggregated totals in response:
  - `total_count`: Number of change orders
  - `total_amount`: Sum of all change order amounts
  - `approved_amount`: Sum of approved change order amounts
- Returns empty array (200 status) when no change orders exist
- Proper error handling for database errors

**POST Endpoint** (`/api/commitments/[id]/change-orders`):
- Creates new change order for a commitment
- Authentication check (401 if not logged in)
- Validates commitment exists (404 if not found)
- Required field validation:
  - `change_order_number` (trimmed)
  - `description` (trimmed)
  - `amount` (converted to number)
- Handles duplicate change order numbers (23505 error code)
- Defaults:
  - `status`: "draft"
  - `requested_date`: current timestamp
  - `requested_by`: current user ID
- Returns formatted change order (201 status)

**Schema Used** (from `database.types.ts`):
```typescript
contract_change_orders {
  id: string
  change_order_number: string
  description: string
  status: string
  amount: number
  requested_date: string
  requested_by: string | null
  approved_date: string | null
  approved_by: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  contract_id: string (FK to commitments)
}
```

**Patterns Followed**:
- Next.js 15 async params: `{ params: Promise<{ id: string }> }`
- Consistent with other commitment routes (invoices, attachments)
- Standard error response format
- Proper status codes (200, 201, 400, 401, 404, 500)

## Ready for Verification
YES

## Notes for Verifier
1. File is syntactically correct and follows Next.js 15 patterns
2. Uses actual database schema from `contract_change_orders` table
3. Includes both GET (list) and POST (create) operations
4. GET endpoint includes helpful aggregated totals
5. POST endpoint has comprehensive validation
6. Pre-existing TypeScript errors in `auto-sitemap-utils.ts` are unrelated
7. This route is isolated and does not depend on the broken file

## Test Commands
```bash
# Manual API testing (requires dev server running)
# GET: curl http://localhost:3000/api/commitments/{id}/change-orders
# POST: curl -X POST http://localhost:3000/api/commitments/{id}/change-orders \
#   -H "Content-Type: application/json" \
#   -d '{"change_order_number":"PCO-001","description":"Test","amount":1000}'
```

## Verification Checklist
- [x] File structure correct
- [x] Async params handled properly
- [x] Database schema matches types
- [x] GET endpoint returns list with totals
- [x] POST endpoint validates and creates
- [x] Error handling comprehensive
- [x] Authentication checked in POST
- [x] Follows project patterns
