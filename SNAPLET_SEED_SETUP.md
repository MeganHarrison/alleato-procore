# Snaplet Seed Configuration for Financial Data

This document explains how to use Snaplet to generate seed data for financial entities in the Alleato-Procore system.

## Overview

Snaplet Seed is configured to generate realistic test data for:

- **Budget Codes** and **Budget Line Items**
- **Contracts** and **Change Orders**
- **Commitments**
- **Change Events**
- **Cost Codes** and **Cost Code Types**
- **Companies** (vendors/subcontractors)

## Configuration

The seed configuration is located in `seed.config.ts` at the project root.

## Known Issue: "job number" Column

The `projects` table contains a column named `"job number"` (with a space), which causes JavaScript syntax errors in Snaplet's generated code. This column has been excluded from seeding operations.

## Usage

### Sync with Database Schema

Before seeding, always sync with the latest database schema:

```bash
npm run seed:sync
```

### Seed Complete Financial Data

To seed a complete set of financial data including projects, clients, and all related entities:

```bash
npm run seed:financial
```

This will generate:
- 5 Projects with clients
- 15-25 Cost codes
- 25-50 Budget codes
- 50-250 Budget line items
- 5-15 Contracts
- 0-75 Change orders with line items
- 15-40 Commitments
- 10-30 Change events
- 10 Vendor companies
- 4 Cost code types

### Seed Financial Data for a Specific Project

To add financial data to an existing project:

```bash
npm run seed:project -- [projectId]
```

Example:
```bash
npm run seed:project -- 60
```

This will generate for the specified project:
- 10 Budget codes
- 20-40 Budget line items
- 2 Contracts
- 2-6 Change orders
- 5 Commitments
- 4 Change events

## Data Configuration

### Budget Line Items

- Original amounts: $10,000 - $510,000
- Unit quantities: 1 - 1,000
- Unit costs: $10 - $1,010
- UOMs: EA, SF, LF, CY, LS
- Calculation methods: unit, total

### Contracts

- Original amounts: $500,000 - $5,500,000
- Statuses: draft, active, complete
- Retention: 5% or 10%
- Vertical markup: randomly enabled/disabled

### Commitments

- Contract amounts: $50,000 - $1,050,000
- Statuses: draft, approved, executed
- Retention: 5% or 10%

### Change Orders

- Statuses: draft, pending, approved, rejected
- Vertical markup: randomly enabled/disabled
- 1-3 line items per change order

### Change Events

- Statuses: pending, approved, rejected
- Reasons: Owner Request, Design Change, Field Condition, Code Requirement

## Troubleshooting

### "Unexpected identifier 'number'" Error

This error occurs when Snaplet tries to generate code for the `"job number"` column. To fix:

1. Run `npm run seed:sync` to regenerate the Snaplet models
2. Ensure the `select` configuration excludes problematic tables
3. The seed scripts avoid this issue by not directly manipulating the `job number` field

### Connection Issues

Ensure your environment variables are set:

```bash
SUPABASE_DB_PASSWORD=your_password
# OR
SUPABASE_PASSWORD=your_password
```

### No Data Generated

Check that:
1. Your database connection is valid
2. Required parent records exist (e.g., projects, clients)
3. Foreign key constraints are satisfied

## Customization

To customize the seed data generation, edit the model configurations in `seed.config.ts`:

```typescript
models: {
  budget_line_items: {
    data: {
      original_amount: () => Math.floor(Math.random() * 500000) + 10000,
      // Customize other fields...
    },
  },
}
```

## Related Files

- `/seed.config.ts` - Main configuration
- `/scripts/seed-financial-data.ts` - Complete financial data seeding
- `/scripts/seed-project-financial-data.ts` - Project-specific seeding
- `/scripts/test-seed-config.ts` - Configuration validation

## References

- [Snaplet Seed Documentation](https://docs.snaplet.dev/seed/getting-started)
- [Supabase Connection String Format](https://supabase.com/docs/guides/database/connecting-to-postgres)
