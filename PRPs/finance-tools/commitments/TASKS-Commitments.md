# Commitments Implementation - Complete Task Checklist

## Phase 1: Database Foundation
- [x] Create subcontracts table
- [x] Create purchase_orders table
- [x] Create commitments_unified view
- [x] Create subcontract_sov_items table
- [x] Create purchase_order_sov_items table
- [ ] Add deleted_at columns for soft delete
- [ ] Create subcontract_attachments table
- [ ] Create commitment_change_order_lines table

## Phase 2: Backend Services - API Endpoints
- [x] GET /api/commitments (with pagination, filters, search)
- [x] GET /api/commitments/[id] (detail with related data)
- [x] POST /api/commitments (create with validation)
- [x] PUT /api/commitments/[id] (update with authorization)
- [ ] Fix DELETE /api/commitments/[id] (implement soft delete)
- [x] GET /api/commitments/[id]/change-orders
- [x] GET /api/commitments/[id]/invoices
- [x] GET /api/commitments/[id]/attachments
- [x] POST /api/commitments/[id]/attachments
- [x] DELETE /api/commitments/[id]/attachments/[id]
- [x] POST /api/commitments/[id]/restore

## Phase 3: Core UI Pages
- [x] Commitments list page (/[projectId]/commitments)
- [x] Commitment detail page (/[projectId]/commitments/[id])
- [x] Create subcontract page (/[projectId]/commitments/new)
- [x] Create purchase order page (/[projectId]/commitments/new)
- [ ] Edit pages (/[projectId]/commitments/[id]/edit)
- [x] Recycle bin page (/[projectId]/commitments/recycled)
- [ ] Configure settings page (/[projectId]/commitments/configure)

## Phase 4: Detail Page Tabs
- [x] Overview tab (General info)
- [x] Financial tab (Alleato enhancement)
- [x] Schedule tab (SOV line items)
- [x] Change Orders tab
- [x] Invoices tab
- [x] Attachments tab
- [ ] Advanced Settings tab

## Phase 5: List Page Enhancements
- [x] Basic table columns (Number, Title, Company, Status, Type, Amounts)
- [ ] ERP Status column (needs DB field)
- [x] Executed column
- [ ] SSOV Status column (needs DB field)
- [ ] Approved Change Orders column (needs aggregation)
- [ ] Pending Change Orders column (needs aggregation)
- [ ] Draft Change Orders column (needs aggregation)
- [ ] Invoiced Amount column (needs aggregation)
- [ ] Payments Issued column (needs aggregation)
- [ ] % Paid column (needs calculation)
- [ ] Remaining Balance column (needs calculation)
- [x] Private column
- [x] Row selection checkboxes
- [x] Sorting
- [x] Search
- [x] Pagination
- [x] Row grouping
- [x] Column configuration
- [ ] Column reordering
- [x] Grand totals footer

## Phase 6: Forms Enhancement
- [x] Basic subcontract form fields
- [x] Basic purchase order form fields
- [ ] Rich text editors (Description, Inclusions, Exclusions)
- [ ] Private checkbox with default
- [ ] Default Retainage field
- [ ] All date fields
- [ ] Contact selectors
- [ ] Non-admin access controls
- [ ] Invoice contacts (conditional)
- [x] SOV line items editor
- [x] Attachments manager
- [ ] Form validation enhancements
- [ ] Conditional field logic

## Phase 7: Configuration Page
- [ ] General settings section
- [ ] Distribution settings section
- [ ] Defaults section
- [ ] Billing period settings section
- [ ] 81 configuration fields from Procore

## Phase 8: Testing & Quality
- [x] Commitment detail tabs tests (29 tests passing)
- [ ] Create subcontract flow test
- [ ] Create purchase order flow test
- [ ] Edit commitment flow test
- [ ] Delete and restore flow test
- [ ] List page functionality tests
- [ ] SOV line items CRUD tests
- [ ] Configuration page tests

## Phase 9: Integration & Polish
- [ ] Budget integration (cost codes, committed amounts)
- [ ] Change order integration (totals calculation)
- [ ] Invoice integration (amounts calculation)
- [ ] Export functionality (CSV, PDF, Excel)
- [ ] Email functionality
- [ ] Download PDF functionality
- [ ] Performance optimizations

## Current Status: 65% Complete

### Completed Components (✅)
- Core database schema
- Basic API endpoints
- List page with advanced features
- Detail page with 6 tabs
- Create forms (basic)
- Attachments management
- Recycle bin functionality
- Comprehensive test suite for detail tabs

### Critical Remaining Work (⚠️)
- API aggregation queries (financial totals)
- Form enhancements (rich text, conditionals)
- Configuration page (81 settings)
- Integration with Budget/Change Orders/Invoices
- Comprehensive testing suite

### Success Criteria
- [ ] Full Procore feature parity
- [ ] All E2E tests passing
- [ ] No TypeScript errors
- [ ] Complete API documentation
- [ ] Budget integration functional
- [ ] Performance benchmarks met