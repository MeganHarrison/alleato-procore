# Task: Rebuild Direct Costs API Route

## Created
2026-01-10T18:30:00Z

## Description
Rebuild corrupted `/api/direct-costs/route.ts` with proper GET/POST implementation

## Requirements
- [x] GET endpoint with pagination
- [x] GET with filters (costType, status, vendorId, employeeId)
- [x] GET with search (description, invoice_number)
- [x] GET with projectId validation (required)
- [x] POST endpoint with validation
- [x] POST with user authentication
- [x] POST with foreign key validation (project, vendor, employee)
- [x] Proper error handling
- [x] PaginatedResponse type usage
- [x] Uses direct_costs_with_details view for optimized queries

## Implementation Details

### GET Endpoint
- URL: `/api/direct-costs`
- Query Params:
  - `projectId` (required)
  - `page` (default: 1)
  - `limit` (default: 100)
  - `costType`, `status`, `vendorId`, `employeeId` (optional filters)
  - `search` (optional, searches description/invoice_number)
- Returns: `PaginatedResponse<DirectCostWithRelations>`

### POST Endpoint
- URL: `/api/direct-costs`
- Required fields: `project_id`, `cost_type`, `date`, `total_amount`
- Optional fields: `vendor_id`, `employee_id`, `description`, etc.
- Validates: User auth, project exists, vendor exists, employee exists
- Returns: Created direct cost with relations (status: 201)

## Quality Check
- ESLint: PASS (no errors)
- File follows existing API patterns from change-orders/route.ts
- Uses actual database schema from Supabase types
