# Worker Completion: Line Items Route Rebuild

## Task ID
line-items-route-rebuild

## Timestamp
2026-01-10T16:30:00Z

## Files Modified
- `/Users/meganharrison/Documents/github/alleato-procore/frontend/src/app/api/projects/[id]/change-events/[changeEventId]/line-items/route.ts`

## Changes Made

### Corruption Fixed
1. **Syntax Errors Fixed:**
   - Line 21: Fixed `catch error)` → `catch (error)`
   - Line 40: Removed incomplete `if provided` comment
   - Line 52: Fixed `catch error)` → `catch (error)`
   - Line 75: Fixed `catch error)` → `catch (error)`

2. **Schema Alignment:**
   - Changed from incorrect `cost_code` field to proper `budget_code_id` (UUID)
   - Added proper relationships: `budget_lines` → `cost_codes` → details
   - Added vendor relationship via `companies` table
   - Fixed column name mappings (snake_case in DB, camelCase in API)

3. **Database Schema Compliance:**
   - Table: `change_event_line_items`
   - Columns: `id`, `change_event_id`, `budget_code_id`, `description`, `vendor_id`, `contract_id`, `quantity`, `unit_of_measure`, `unit_cost`, `cost_rom`, `revenue_rom`, `non_committed_cost`, `sort_order`
   - Relations properly joined with budget_lines, cost_codes, cost_types, companies

### Functional Improvements

**GET Endpoint:**
- Lists all line items for a change event
- Includes budget_line details with nested cost_code and cost_type
- Includes vendor details from companies table
- Calculates extended amount (quantity × unit_cost)
- Sorts by sort_order (ascending)

**POST Endpoint:**
- Creates new line item with validation
- Verifies change event exists and is not Closed/Void
- Validates budget_code_id belongs to project (if provided)
- Validates vendor_id exists (if provided)
- Calculates extended amount for cost_rom default
- Updates change event timestamp on creation
- Returns full line item with relationships

**PUT Endpoint:**
- Bulk update for reordering line items
- Validates change event is not Closed/Void
- Updates sort_order for multiple items
- Updates change event timestamp

### Validation
- Uses `createLineItemSchema` from `validation.ts`
- Handles ZodError with detailed field-level errors
- Auth validation via Supabase user session
- Business rule validation (closed events, project ownership)

## Ready for Verification
YES

## Quality Check Status
PASSED - No TypeScript or lint errors

## Notes for Verifier
1. The route now properly handles the database schema relationships
2. Change event IDs are UUIDs (strings), not integers
3. Project IDs are integers
4. Contract IDs are integers (BIGINT)
5. All other IDs are UUIDs
6. The route properly joins budget_lines → cost_codes for cost code details
7. Vendor details come from companies table
8. Extended amounts are calculated on-demand (quantity × unit_cost)
9. Status values are now "Open", "Closed", "Void" (not lowercase)
10. Removed audit log creation (change_event_history table doesn't exist in schema)
