# Direct Costs Seed Script

## Overview

This script seeds the database with realistic test data for the Direct Costs feature.

## What It Creates

### Vendors (10)
- Acme Supply Co
- BuildMart Materials
- Construction Depot
- ABC Materials & Supplies
- XYZ Equipment Rental
- ProBuild Distributors
- Premier Supply Chain
- Quality Construction Materials
- FastTrack Equipment
- Reliable Vendors Inc

### Cost Structure
- **Cost Code Divisions**: 5 divisions (General Requirements, Concrete, Metals, etc.)
- **Cost Codes**: 15 cost codes (3 per division)
- **Cost Types**: 4 types (Labor, Materials, Equipment, Subcontractors)
- **Project Budget Codes**: 15 codes (5 per project × 3 projects)

### Direct Costs (15-21 per run)
- **Types**: Mix of Expenses and Invoices
- **Statuses**: Draft, Approved, Paid (weighted distribution)
- **Line Items**: 2-5 per direct cost
- **Associated Data**: Vendors (for Invoices), Employees (for Expenses)

## Prerequisites

### Required Environment Variables

Create `frontend/.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Required Data

The script requires:
1. **At least 1 project** in the `projects` table
2. **At least 1 auth user** in Supabase Auth
3. **Optional**: Employees (if none exist, employee_id will be null for expenses)

## Usage

### Basic Usage

```bash
# Run the script
tsx scripts/seed-direct-costs.ts
```

### Clear Existing Data First

```bash
# Clear existing direct costs data, then seed
tsx scripts/seed-direct-costs.ts --clear
```

## What Gets Created

For each project (up to 3 projects):

1. **5-7 Direct Costs** with:
   - Random cost type (Expense or Invoice)
   - Random status (Draft, Approved, or Paid)
   - Associated vendor (if Invoice)
   - Associated employee (if Expense)
   - Realistic dates, invoice numbers, terms

2. **2-5 Line Items per Direct Cost** with:
   - Budget code assignment
   - Quantity and unit cost
   - Auto-calculated line total (database-generated)
   - Unit of measure (EA, LF, SF, CY, TON, HR, LOT)

3. **Total amounts** calculated from line items

## Database Schema

### Direct Costs Table
- Uses UUID for `id`, `vendor_id`, `created_by_user_id`, `updated_by_user_id`
- Uses BIGINT for `project_id`, `employee_id`
- Cost types: 'Expense', 'Invoice', 'Subcontractor Invoice'
- Statuses: 'Draft', 'Approved', 'Rejected', 'Paid'

### Direct Cost Line Items Table
- Uses UUID for `id`, `direct_cost_id`, `budget_code_id`
- `line_total` is GENERATED/COMPUTED (quantity × unit_cost)
- Never insert `line_total` - it's calculated automatically

## Example Output

```
🌱 Starting direct costs data seeding...

📋 Step 1: Getting/creating company for vendors...
✓ Using existing company: General Contractors Inc

📋 Step 2: Creating vendors...
✓ Created 10 vendors

📋 Step 3: Getting existing projects...
✓ Found 3 projects
  - Commercial Office Building (ID: 1)
  - Residential Complex (ID: 2)
  - Industrial Warehouse (ID: 3)

📋 Step 4: Getting/creating cost codes...
✓ Using 5 existing cost code divisions
✓ Using 15 existing cost codes
✓ Using 4 existing cost types

📋 Step 5: Getting auth user...
✓ Using auth user: admin@example.com

📋 Step 6: Getting employees...
✓ Found 5 employees

📋 Step 7: Creating project budget codes...
✓ Created 15 project budget codes

📋 Step 8: Creating direct costs with line items...
✓ Created 18 direct costs
✓ Created 67 line items

🎉 Direct costs data seeding completed successfully!

📊 Summary:
- Vendors: 10
- Cost Code Divisions: 5
- Cost Codes: 15
- Cost Types: 4
- Project Budget Codes: 15
- Direct Costs: 18
- Line Items: 67
- Projects Used: 3
```

## Error Handling

The script will exit with an error if:
- Environment variables are missing
- No projects exist in the database
- No auth users exist in Supabase Auth
- Database operations fail

## Development Notes

### Type Safety
- Uses TypeScript for full type safety
- No `@ts-ignore` or `any` types
- Follows project coding standards

### Database Gate Protocol
- Schema verified against `database.types.ts`
- Migration file reviewed (`20260110_fix_direct_costs_schema.sql`)
- Foreign key types confirmed:
  - `project_id`: BIGINT (not UUID)
  - `employee_id`: BIGINT (not UUID)
  - `vendor_id`: UUID
  - `budget_code_id`: UUID

### Key Learnings
1. **Generated Columns**: Never insert values for `line_total` - it's computed
2. **Foreign Key Types**: Always check actual types (BIGINT vs UUID)
3. **RLS Bypass**: Uses service key to bypass Row Level Security
4. **Realistic Data**: Uses faker.js for realistic test data

## Related Files

- **Migration**: `supabase/migrations/20260110_fix_direct_costs_schema.sql`
- **Types**: `frontend/src/types/database.types.ts`
- **Page**: `frontend/src/app/[projectId]/direct-costs/page.tsx`
- **Gate Docs**: `.claude/supabase-gate-passed.md`

## Maintenance

When updating this script:
1. Always regenerate types first: `npx supabase gen types typescript`
2. Verify schema matches migration files
3. Test with `tsx scripts/seed-direct-costs.ts`
4. Run quality checks: `npm run quality`
